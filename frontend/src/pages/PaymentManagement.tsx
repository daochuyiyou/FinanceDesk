import React, { useEffect, useState, useCallback } from 'react';
import { App, Button, Space, Popconfirm, Table, Modal, Form, Input, InputNumber, DatePicker, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAnalyzer } from '../components/BusinessAnalyzer';
import dayjs from 'dayjs';
import { fetchAllPayments, createPayment, updatePayment, deletePayment } from '../services/payment';
import ImportButton from '../components/ImportButton';
import { fetchOrders, OrderRecord } from '../services/order';
import { fetchCostFlows, CostFlow } from '../services/cost';
import { fetchSuppliers, SupplierRecord } from '../services/supplier';

interface Props {
  projectId?: number;
  onNavigate?: (key: string, state?: any) => void;
}

const PaymentManagement: React.FC<Props> = ({ projectId, onNavigate }) => {
  const { message } = App.useApp();
  const [payments, setPayments] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [costs, setCosts] = useState<CostFlow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
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
        const oRes = await fetchOrders(1, 500, String(effectiveProjectId));
        projOrderIds = oRes.items.map((o: any) => String(o.id));
        setOrders(oRes.items.map((o: any) => ({ ...o, id: Number(o.id) })));
        if (projOrderIds.length === 0) { setPayments([]); setCosts([]); setLoading(false); return; }
      }
      const [pRes, oRes, cRes, sRes] = await Promise.all([
        fetchAllPayments({ order_id: filterOrder, page: 1, page_size: 500 }),
        effectiveProjectId ? Promise.resolve({ items: [] }) : fetchOrders(1, 200),
        fetchCostFlows({ page: 1, page_size: 500 }),
        fetchSuppliers(1, 500),
      ]);
      let items = pRes.items;
      if (effectiveProjectId && projOrderIds.length > 0) {
        items = items.filter((pmt: any) => {
          const c = cRes.items.find((co: CostFlow) => co.id === pmt.cost_id);
          return c && projOrderIds.includes(String(c.order_id));
        });
      }
      setPayments(items);
      if (!effectiveProjectId) setOrders(oRes.items);
      setCosts(cRes.items);
      setSuppliers(sRes.items || []);
    } catch { message.error('加载失败'); }
    setLoading(false);
  }, [filterOrder, effectiveProjectId, message]);

  useEffect(() => { loadData(); }, [loadData]);

  /** 从 cost_id 获取供应商名称 */
  const getSupplierName = (costId: number) => {
    const c = costs.find(co => co.id === costId);
    if (!c) return '-';
    const s = suppliers.find(sup => sup.id === String(c.supplier_id));
    return s?.name || '-';
  };

  const openCreate = () => { setEditingRecord(null); form.resetFields(); form.setFieldsValue({ payment_date: dayjs() }); setShowAdvanced(false); setModalOpen(true); };
  const openEdit = (r: any) => {
    setEditingRecord(r);
    form.setFieldsValue({
      ...r,
      payment_date: r.payment_date ? dayjs(r.payment_date) : null,
    });
    setShowAdvanced(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const v = await form.validateFields();
    const selectedCost = costs.find(c => c.id === v.cost_id);
    const payload = {
      amount: v.amount?.toString() || '0',
      payment_date: v.payment_date ? v.payment_date.format('YYYY-MM-DD') : null,
      payee: v.payee || null,
      voucher_no: v.voucher_no || null,
    };
    if (editingRecord) {
      await updatePayment(selectedCost!.order_id.toString(), v.cost_id.toString(), editingRecord.id.toString(), payload);
      message.success('更新成功');
    } else {
      await createPayment(selectedCost!.order_id.toString(), v.cost_id.toString(), payload);
      message.success('创建成功');
    }
    setModalOpen(false);
    setEditingRecord(null);
    loadData();
  };

  const orderName = (id: string) => { const o = orders.find(o => String(o.id) === id); return o ? `${o.order_no} — ${o.order_name || ''}` : `#${id}`; };

  const costOpts = costs.filter(c => {
    const totalPaid = payments.filter(p => p.cost_id === c.id).reduce((s: number, p: any) => s + (p.amount || 0), 0);
    return (c.taxable_amount || 0) > totalPaid;
  }).map(c => {
    const totalPaid = payments.filter(p => p.cost_id === c.id).reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const remaining = (c.taxable_amount || 0) - totalPaid;
    return { value: c.id, label: `${orderName(c.order_id)} - ${c.cost_type} - 可付: ${remaining.toLocaleString()}元`, remainingCost: remaining };
  });

  const watchedCostId = Form.useWatch('cost_id', form);
  useEffect(() => {
    if (watchedCostId) {
      const opt = costOpts.find(o => o.value === watchedCostId);
      if (opt && 'remainingCost' in opt) {
        form.setFieldsValue({ amount: opt.remainingCost });
      }
    }
  }, [watchedCostId, costOpts, form]);

  const columns = [
    { title: '支付日期', dataIndex: 'payment_date', render: (v: string) => v || '-' },
    { title: '关联订单', dataIndex: 'cost_id', render: (v: string) => { const c = costs.find(co => co.id === Number(v)); if (!c) return '-'; const o = orders.find(x => String(x.id) === String(c.order_id)); return o ? <a onClick={() => onNavigate?.('orders', { focusOrderId: Number(o.id) })} style={{ cursor: 'pointer' }}>{o.order_no} — {o.order_name || ''}</a> : '-'; } },
    { title: '供应商', dataIndex: 'cost_id', render: (v: number) => getSupplierName(v) },
    { title: '金额', dataIndex: 'amount', render: (v: number) => v != null ? `¥${v.toLocaleString()}` : '-' },
    { title: '剩余可付', dataIndex: 'remaining_amount', render: (v: number) => v != null ? `¥${v.toLocaleString()}` : '-' },
    { title: '凭证', dataIndex: 'voucher_no', render: (v: string) => v || '-' },
    {
      title: '操作', width: 180,
      render: (_: any, r: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={async () => {
            try {
              const c = costs.find(co => co.id === r.cost_id);
              if (c) await deletePayment(c.order_id.toString(), r.cost_id.toString(), r.id);
              message.success('已删除');
              loadData();
            } catch { message.error('删除失败'); }
          }}>
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
          options={orders.map(o => ({ value: Number(o.id), label: `${o.order_no} - ${o.order_name}` }))} />
        <ImportButton title="导入付款数据" importAction="/import/payments" exportAction="/payments" templateName="付款导入模板.xlsx" onSuccess={loadData} />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增付款</Button>
      </Space>
      <Table dataSource={payments} columns={columns} rowKey="id" loading={loading}
        pagination={{ showSizeChanger: true, defaultPageSize: 20 }} size="small" />

      <Modal title={editingRecord ? '编辑付款' : '新增付款'} open={modalOpen} onOk={handleSave}
        onCancel={() => { setModalOpen(false); setEditingRecord(null); }} destroyOnHidden width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="cost_id" label="关联成本流水" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择成本流水" optionFilterProp="label" options={costOpts} />
          </Form.Item>

          {/* 供应商：根据选择的成本流水自动显示，只读 */}
          {watchedCostId && (
            <Form.Item label="供应商（来自成本流水）">
              <Input value={getSupplierName(Number(watchedCostId))} disabled />
            </Form.Item>
          )}

          <Form.Item name="payment_date" label="支付日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="amount" label="支付金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>

          {/* 支付对象由后端根据 CostFlow.supplier_id 自动填充，前端不再需要输入 */}
          <Form.Item name="payee" label="支付对象" hidden>
            <Input />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Button type="link" onClick={() => setShowAdvanced(!showAdvanced)} style={{ padding: 0 }}>
              {showAdvanced ? '收起高级信息' : '展开高级信息'}
            </Button>
          </div>

          {showAdvanced && (
            <div>
              <Form.Item name="voucher_no" label="支付凭证号">
                <Input />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};
export default PaymentManagement;
