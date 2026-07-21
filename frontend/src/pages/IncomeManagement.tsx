import React, { useEffect, useState, useCallback } from 'react';
import { App, Button, Space, Popconfirm, Tag, Table, Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAnalyzer } from '../components/BusinessAnalyzer';
import dayjs from 'dayjs';
import { fetchIncomeFlows, createIncomeFlow, updateIncomeFlow, deleteIncomeFlow, IncomeFlow } from '../services/income';
import ImportButton from '../components/ImportButton';
import { fetchOrders, OrderRecord } from '../services/order';
import { fetchProjects } from '../services/project';
import { default as DictSelect } from '../components/DictSelect';

interface Props {
  projectId?: number;
  onNavigate?: (key: string, state?: any) => void;
}

const IncomeManagement: React.FC<Props> = ({ projectId, onNavigate }) => {
  const { message } = App.useApp();
  const [incomes, setIncomes] = useState<IncomeFlow[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderProjects, setOrderProjects] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<IncomeFlow | null>(null);
  const [filterOrder, setFilterOrder] = useState<number | undefined>();
  const [projectOrderIds] = useState<Set<string>>(new Set());
  const [form] = Form.useForm();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const analyzer = useAnalyzer();
  const effectiveProjectId = projectId ?? (
    analyzer.state.objectId && ['project', 'contract'].includes(analyzer.state.dimension)
      ? Number(analyzer.state.objectId)
      : undefined
  );

  const loadData = useCallback(async () => {
    // Re-fetch on analyzer state change
    void analyzer.state;
    setLoading(true);
    try {
      let orderFilter = filterOrder;
      let projOrderIds: string[] = [];
      if (effectiveProjectId) {
        const oRes = await fetchOrders(1, 500, String(effectiveProjectId));
        projOrderIds = oRes.items.map((o: any) => String(o.id));
        setOrders(oRes.items as any);
        if (projOrderIds.length === 0) { setIncomes([]); setLoading(false); return; }
        if (projOrderIds.length === 1) orderFilter = Number(projOrderIds[0]);
      }
      const [iRes, orderRes] = await Promise.all([
        fetchIncomeFlows(orderFilter ? { order_id: orderFilter, page: 1, page_size: 500 } : { page: 1, page_size: 500 }),
        effectiveProjectId ? Promise.resolve({ items: [] }) : fetchOrders(1, 200),
      ]);
      let items = iRes.items;
      if (effectiveProjectId && projOrderIds.length > 1) {
        items = items.filter((i: any) => projOrderIds.includes(String(i.order_id)));
      }
      setIncomes(items);
      if (!effectiveProjectId) setOrders(orderRes.items);
      // Build project name map
      if (orderRes.items?.length > 0) {
        try {
          const pRes = await fetchProjects(1, 200);
          const pMap: Record<string, string> = {};
          (pRes.items || []).forEach((p: any) => { pMap[String(p.id)] = p.framework_name || ''; });
          const oMap: Record<string, string> = {};
          (orderRes.items || []).forEach((o: any) => {
            oMap[String(o.id)] = pMap[String(o.project_id)] || '';
          });
          setOrderProjects(oMap);
        } catch {}
      }
    } catch { message.error('加载数据失败'); }
    setLoading(false);
  }, [filterOrder, effectiveProjectId, message]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setEditingFlow(null); form.resetFields(); form.setFieldsValue({ invoice_date: dayjs(), business_date: dayjs() }); setShowAdvanced(false); setModalOpen(true); };
  const openEdit = (r: IncomeFlow) => {
    setEditingFlow(r);
    form.setFieldsValue({ ...r, invoice_date: r.invoice_date ? dayjs(r.invoice_date) : null });
    setShowAdvanced(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const v = await form.validateFields();
    const payload = {
      tax_rate: v.tax_rate,
      taxable_amount: v.taxable_amount?.toString() || '0',
      non_taxable_amount: v.non_taxable_amount?.toString() || '0',
      invoice_date: v.invoice_date ? v.invoice_date.format('YYYY-MM-DD') : null,
      invoice_no: v.invoice_no || null,
      invoice_stage: v.invoice_stage || null,
      invoice_reason: v.invoice_reason || null,
      business_date: v.business_date ? v.business_date.format('YYYY-MM-DD') : null,
      expected_collection_date: v.expected_collection_date ? v.expected_collection_date.format('YYYY-MM-DD') : null,
      business_owner: v.business_owner || null,
      remark: v.remark || null,
    };
    if (editingFlow) {
      await updateIncomeFlow(Number(editingFlow.order_id), editingFlow.id, payload);
      message.success('更新成功');
    } else {
      await createIncomeFlow(v.order_id, payload);
      message.success('创建成功');
    }
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async (r: IncomeFlow) => {
    await deleteIncomeFlow(Number(r.order_id), r.id);
    message.success('已删除');
    loadData();
  };

  const orderMap = (id: string) => orders.find(o => String(o.id) === id);
  const orderName = (id: string) => { const o = orderMap(id); if (!o) return `#${id}`; return <a onClick={() => onNavigate?.('orders', { focusOrderId: Number(o.id) })} style={{ cursor: 'pointer' }}>{o.order_no} — {o.order_name || ''}</a>; };

  const columns = [
    { title: '开票日期', dataIndex: 'invoice_date', render: (v: string) => v || '-' },
    { title: '关联订单', dataIndex: 'order_id', render: (v: string) => orderName(v) },
    { title: '税率', dataIndex: 'tax_rate', render: (v: number) => v != null ? `${v}%` : '-' },
    { title: '含税金额', dataIndex: 'taxable_amount', render: (v: number | null) => v != null ? `¥${v.toLocaleString()}` : '-' },
    { title: '不含税金额', dataIndex: 'non_taxable_amount', render: (v: number | null) => v != null ? `¥${v.toLocaleString()}` : '-' },
    { title: '发票号码', dataIndex: 'invoice_no', render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: '操作', width: 160,
      render: (_: any, r: IncomeFlow) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }} wrap>
        <Select allowClear placeholder="按订单筛选" style={{ width: 200 }}
          value={filterOrder} onChange={setFilterOrder}
          options={orders.map(o => ({ value: Number(o.id), label: `${o.order_no} - ${o.order_name || ''}` }))} />
        <ImportButton title="导入收入流水数据" importAction="/import/income-flows" exportAction="/income-flows" templateName="收入流水导入模板.xlsx" onSuccess={loadData} />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增收入开票</Button>
      </Space>
      <Table dataSource={incomes} columns={columns} rowKey="id" loading={loading}
        pagination={{ showSizeChanger: true, defaultPageSize: 20 }} size="small" />

      <Modal title={editingFlow ? '编辑收入流水' : '新增收入开票'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnHidden width={600}>
        <Form form={form} layout="vertical">
          {!editingFlow && (
            <Form.Item name="order_id" label="关联订单" rules={[{ required: true }]}>
              <Select showSearch placeholder="选择订单" optionFilterProp="label"
                options={orders.map(o => ({ value: Number(o.id), label: `${o.order_no} | ${o.order_name || ''}${orderProjects[String(o.id)] ? '（' + orderProjects[String(o.id)] + '）' : ''}` }))} />
            </Form.Item>
          )}
          <Form.Item name="tax_rate" label="税率(%)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="taxable_amount" label="含税金额" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="invoice_date" label="开票日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          
          <div style={{ marginBottom: 16 }}>
            <Button type="link" onClick={() => setShowAdvanced(!showAdvanced)} style={{ padding: 0 }}>
              {showAdvanced ? '收起高级信息' : '展开高级信息'}
            </Button>
          </div>
          
          {showAdvanced && (
            <div>
              <Form.Item name="non_taxable_amount" label="不含税金额"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
              <Form.Item name="invoice_no" label="发票号码"><Input /></Form.Item>
              <Form.Item name="invoice_stage" label="开票阶段">
                <DictSelect category="invoice_stage" mode="create" placeholder="选择开票阶段" />
              </Form.Item>
              <Form.Item name="invoice_reason" label="开票原因">
                <DictSelect category="invoice_reason" mode="create" placeholder="选择开票原因" />
              </Form.Item>
              <Form.Item name="business_date" label="经营发生日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
              <Form.Item name="expected_collection_date" label="预计回款日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
              <Form.Item name="business_owner" label="经营责任人"><Input /></Form.Item>
              <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};
export default IncomeManagement;
