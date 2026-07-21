import React, { useEffect, useState, useCallback } from 'react';
import { App, Button, Space, Popconfirm, Table, Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAnalyzer } from '../components/BusinessAnalyzer';
import dayjs from 'dayjs';
import { fetchAllCollections, createCollection, deleteCollection } from '../services/collection';
import ImportButton from '../components/ImportButton';
import { fetchOrders, OrderRecord } from '../services/order';
import { fetchIncomeFlows, IncomeFlow } from '../services/income';

interface Props {
  projectId?: number;
  onNavigate?: (key: string, state?: any) => void;
}

const CollectionManagement: React.FC<Props> = ({ projectId, onNavigate }) => {
  const { message } = App.useApp();
  const [collections, setCollections] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [incomes, setIncomes] = useState<IncomeFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filterOrder, setFilterOrder] = useState<number | undefined>();
  const [form] = Form.useForm();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const analyzer = useAnalyzer();
  const effectiveProjectId = projectId ?? (
    analyzer.state.objectId && ['project', 'contract'].includes(analyzer.state.dimension)
      ? Number(analyzer.state.objectId)
      : undefined
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let projOrderIds: string[] = [];
      if (effectiveProjectId) {
        const oRes = await fetchOrders(1, 100, String(effectiveProjectId));
        projOrderIds = oRes.items.map((o: any) => String(o.id));
        setOrders(oRes.items.map((o: any) => ({ ...o, id: Number(o.id) })));
        if (projOrderIds.length === 0) { setCollections([]); setIncomes([]); setLoading(false); return; }
      }
      const [cRes, oRes, iRes] = await Promise.all([
        fetchAllCollections({ order_id: filterOrder, page: 1, page_size: 500 }),
        effectiveProjectId ? Promise.resolve({ items: [] }) : fetchOrders(1, 200),
        fetchIncomeFlows({ page: 1, page_size: 500 }),
      ]);
      let items = cRes.items;
      if (effectiveProjectId && projOrderIds.length > 0) {
        items = items.filter((coll: any) => {
          const inc = iRes.items.find((inc: IncomeFlow) => inc.id === coll.flow_id);
          return inc && projOrderIds.includes(String(inc.order_id));
        });
      }
      setCollections(items);
      if (!effectiveProjectId) setOrders(oRes.items);
      setIncomes(iRes.items);
    } catch { message.error('加载失败'); }
    setLoading(false);
  }, [filterOrder, effectiveProjectId, message]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ collection_date: dayjs() }); setShowAdvanced(false); setModalOpen(true); };

  const handleSave = async () => {
    const v = await form.validateFields();
    const selectedIncome = incomes.find(i => i.id === v.flow_id);
    await createCollection(selectedIncome!.order_id.toString(), v.flow_id.toString(), {
      amount: v.amount?.toString() || '0',
      collection_date: v.collection_date ? v.collection_date.format('YYYY-MM-DD') : null,
      receipt_no: v.receipt_no || null,
    });
    message.success('创建成功');
    setModalOpen(false);
    loadData();
  };

  const getRemaining = (coll: any) => coll.remaining_amount ?? 0;
  const orderName = (id: string) => { const o = orders.find(o => String(o.id) === id); return o ? `${o.order_no} — ${o.order_name || ''}` : `#${id}`; };

  const incomeOpts = incomes.filter(i => {
    const totalColl = collections.filter(c => c.flow_id === i.id).reduce((s: number, c: any) => s + (c.amount || 0), 0);
    return (i.taxable_amount || 0) > totalColl;
  }).map(i => {
    const totalColl = collections.filter(c => c.flow_id === i.id).reduce((s: number, c: any) => s + (c.amount || 0), 0);
    const remaining = (i.taxable_amount || 0) - totalColl;
    return { value: i.id, label: `${orderName(i.order_id)} - 可回款: ${remaining.toLocaleString()}元`, remaining };
  });

  const watchedFlowId = Form.useWatch('flow_id', form);
  useEffect(() => {
    if (watchedFlowId) {
      const opt = incomeOpts.find(o => o.value === watchedFlowId);
      if (opt && 'remaining' in opt) {
        form.setFieldsValue({ amount: opt.remaining });
      }
    }
  }, [watchedFlowId, incomeOpts, form]);

  const columns = [
    { title: '回款日期', dataIndex: 'collection_date', render: (v: string) => v || '-' },
    { title: '关联订单', dataIndex: 'flow_id', render: (v: string) => { const inc = incomes.find(i => i.id === Number(v)); if (!inc) return '-'; const o = orders.find(x => String(x.id) === String(inc.order_id)); return o ? <a onClick={() => onNavigate?.('orders', { focusOrderId: Number(o.id) })} style={{ cursor: 'pointer' }}>{o.order_no} — {o.order_name || ''}</a> : '-'; } },
    { title: '金额', dataIndex: 'amount', render: (v: number) => v != null ? `¥${v.toLocaleString()}` : '-' },
    { title: '剩余可回款', render: (_: any, r: any) => `¥${getRemaining(r).toLocaleString()}` },
    { title: '凭证号', dataIndex: 'receipt_no', render: (v: string) => v || '-' },
    {
      title: '操作', width: 100,
      render: (_: any, r: any) => (
        <Popconfirm title="确认删除？" onConfirm={async () => {
          try {
            const inc = incomes.find(i => i.id === r.flow_id);
            if (inc) await deleteCollection(inc.order_id.toString(), r.flow_id.toString(), r.id.toString());
            message.success('已删除');
            loadData();
          } catch { message.error('删除失败'); }
        }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }} wrap>
        <Select allowClear placeholder="按订单筛选" style={{ width: 200 }}
          value={filterOrder} onChange={setFilterOrder}
          options={orders.map(o => ({ value: Number(o.id), label: `${o.order_no} - ${o.order_name}` }))} />
        <ImportButton title="导入回款数据" importAction="/import/collections" exportAction="/collections" templateName="回款导入模板.xlsx" onSuccess={loadData} />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增回款</Button>
      </Space>
      <Table dataSource={collections} columns={columns} rowKey="id" loading={loading}
        pagination={{ showSizeChanger: true, defaultPageSize: 20 }} size="small" />

      <Modal title="新增回款" open={modalOpen} onOk={handleSave}
        onCancel={() => setModalOpen(false)} destroyOnHidden width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="flow_id" label="关联收入流水" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择收入流水" optionFilterProp="label"
              options={incomeOpts} />
          </Form.Item>
          <Form.Item name="collection_date" label="回款日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="amount" label="回款金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          
          <div style={{ marginBottom: 16 }}>
            <Button type="link" onClick={() => setShowAdvanced(!showAdvanced)} style={{ padding: 0 }}>
              {showAdvanced ? '收起高级信息' : '展开高级信息'}
            </Button>
          </div>
          
          {showAdvanced && (
            <div>
              <Form.Item name="receipt_no" label="收款凭证号">
                <Input />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};
export default CollectionManagement;
