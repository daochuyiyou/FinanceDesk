/* 🅳-4: OrderDetail reduce null safety */
import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, message, Space, Tag, Tabs, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchIncomeFlows, createIncomeFlow, updateIncomeFlow, deleteIncomeFlow, IncomeFlow } from '../services/incomeFlow';
import { fetchCostFlows, createCostFlow, updateCostFlow, deleteCostFlow, CostFlow } from '../services/costFlow';
import { fetchSuppliers } from '../services/supplier';

interface Props {
  orderId: number;
  onBack: () => void;
}

const OrderDetail: React.FC<Props> = ({ orderId, onBack }) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<IncomeFlow[]>([]);
  const [costs, setCosts] = useState<CostFlow[]>([]);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeFlow | null>(null);
  const [editingCost, setEditingCost] = useState<CostFlow | null>(null);
  const [form] = Form.useForm();
  const [costForm] = Form.useForm();

  useEffect(() => {
    loadIncomes();
    loadCosts();
    fetchSuppliers(1, 200).then(r => setSuppliers(r.items)).catch(() => {});
  }, [orderId]);

  const loadIncomes = async () => {
    try { setIncomes((await fetchIncomeFlows(String(orderId))).items); }
    catch { setIncomes([]); }
  };
  const loadCosts = async () => {
    try { setCosts((await fetchCostFlows(String(orderId))).items); }
    catch { setCosts([]); }
  };

  const openIncomeModal = (income?: IncomeFlow) => {
    setEditingIncome(income || null);
    if (income) form.setFieldsValue({ ...income, invoice_date: income.invoice_date ? dayjs(income.invoice_date) : null });
    else form.resetFields();
    setIncomeModalOpen(true);
  };

  const handleIncomeSave = async () => {
    const v = await form.validateFields();
    const payload = { ...v, invoice_date: v.invoice_date ? v.invoice_date.format('YYYY-MM-DD') : null };
    if (editingIncome) await updateIncomeFlow(String(orderId), String(editingIncome.id), payload);
    else await createIncomeFlow(String(orderId), payload);
    message.success('保存成功');
    setIncomeModalOpen(false);
    loadIncomes();
  };

  const openCostModal = (cost?: CostFlow) => {
    setEditingCost(cost || null);
    if (cost) costForm.setFieldsValue(cost);
    else costForm.resetFields();
    setCostModalOpen(true);
  };

  const handleCostSave = async () => {
    const v = await costForm.validateFields();
    if (editingCost) await updateCostFlow(String(orderId), String(editingCost.id), v);
    else await createCostFlow(String(orderId), v);
    message.success('保存成功');
    setCostModalOpen(false);
    loadCosts();
  };

  const supName = (id: number | null) => id ? (suppliers.find(s => s.id === id)?.name || `#${id}`) : '-';
  const taxDiff = (a: number | null, b?: number | null) => ((a ?? 0) - (b ?? 0)).toLocaleString();

  const incomeCols: import('antd/es/table').ColumnsType<IncomeFlow> = [
    { title: '税率', dataIndex: 'tax_rate', render: (v: number) => v != null ? `${v}%` : '-' },
    { title: '含税金额', dataIndex: 'taxable_amount', render: (v: number | null) => (v ?? 0).toLocaleString() },
    { title: '不含税金额', dataIndex: 'non_taxable_amount', render: (v: number | null) => (v ?? 0).toLocaleString() },
    { title: '税额', render: (_: any, r: IncomeFlow) => taxDiff(r.taxable_amount, r.non_taxable_amount) },
    { title: '发票号码', dataIndex: 'invoice_no' },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag>{v}</Tag> },
    { title: '操作', render: (_: any, r: IncomeFlow) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openIncomeModal(r)}>编辑</Button>
        <Popconfirm title="确认删除？" onConfirm={() => deleteIncomeFlow(String(orderId), String(r.id)).then(loadIncomes)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  const costCols: import('antd/es/table').ColumnsType<CostFlow> = [
    { title: '供应商', dataIndex: 'supplier_id', render: (v: number | null) => supName(v) },
    { title: '成本类型', dataIndex: 'cost_type' },
    { title: '税率', dataIndex: 'tax_rate', render: (v: number) => v != null ? `${v}%` : '-' },
    { title: '含税金额', dataIndex: 'taxable_amount', render: (v: number | null) => (v ?? 0).toLocaleString() },
    { title: '不含税金额', dataIndex: 'non_taxable_amount', render: (v: number | null) => (v ?? 0).toLocaleString() },
    { title: '税额', render: (_: any, r: CostFlow) => taxDiff(r.taxable_amount, r.non_taxable_amount) },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag>{v}</Tag> },
    { title: '操作', render: (_: any, r: CostFlow) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openCostModal(r)}>编辑</Button>
        <Popconfirm title="确认删除？" onConfirm={() => deleteCostFlow(String(orderId), String(r.id)).then(loadCosts)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  const tabs = [
    { key: 'incomes', label: '收入流水', children: (
      <><Button type="primary" icon={<PlusOutlined />} onClick={() => openIncomeModal()} style={{ marginBottom: 12 }}>新增收入流水</Button>
      <Table dataSource={incomes} columns={incomeCols} rowKey="id" pagination={{ showSizeChanger: true, defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total) => `共 ${total} 条` }} size="small" /></>
    )},
    { key: 'costs', label: '成本流水', children: (
      <><Button type="primary" icon={<PlusOutlined />} onClick={() => openCostModal()} style={{ marginBottom: 12 }}>新增成本流水</Button>
      <Table dataSource={costs} columns={costCols} rowKey="id" pagination={{ showSizeChanger: true, defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total) => `共 ${total} 条` }} size="small" /></>
    )},
  ];

  // Safe reduce: use (i.taxable_amount || 0) to prevent NaN from undefined
  const safeSum = (items: { [key: string]: any }[], field: string): number =>
    items.reduce((s: number, i) => s + (i[field] || 0), 0);

  return (
    <div style={{ padding: 16 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 12 }}>返回订单列表</Button>
      <Card title={`订单 #${orderId} 流水管理`} style={{ marginBottom: 12 }} size="small">
        <Descriptions column={4} size="small">
          <Descriptions.Item label="含税总金额">
            {safeSum(incomes, 'taxable_amount').toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="成本总金额">
            {safeSum(costs, 'taxable_amount').toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="毛利">
            {(safeSum(incomes, 'taxable_amount') - safeSum(costs, 'taxable_amount')).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="毛利率">
            {(() => {
              const inc = safeSum(incomes, 'taxable_amount');
              const cst = safeSum(costs, 'taxable_amount');
              return (inc > 0 ? ((inc - cst) / inc * 100).toFixed(2) : '0.00') + '%';
            })()}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Tabs items={tabs} />
      {/* Income Modal */}
      <Modal title={editingIncome ? '编辑收入流水' : '新增收入流水'} open={incomeModalOpen}
        onOk={handleIncomeSave} onCancel={() => setIncomeModalOpen(false)} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="tax_rate" label="税率(%)"><InputNumber style={{width:'100%'}} /></Form.Item>
          <Form.Item name="taxable_amount" label="含税金额" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0} /></Form.Item>
          <Form.Item name="non_taxable_amount" label="不含税金额"><InputNumber style={{width:'100%'}} min={0} /></Form.Item>
          <Form.Item name="invoice_date" label="开票日期"><DatePicker style={{width:'100%'}} /></Form.Item>
          <Form.Item name="invoice_no" label="发票号码"><Input /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
      {/* Cost Modal */}
      <Modal title={editingCost ? '编辑成本流水' : '新增成本流水'} open={costModalOpen}
        onOk={handleCostSave} onCancel={() => setCostModalOpen(false)} destroyOnHidden>
        <Form form={costForm} layout="vertical">
          <Form.Item name="supplier_id" label="供应商">
            <Select allowClear placeholder="选择供应商" options={suppliers.map(s => ({value: s.id, label: s.name}))} />
          </Form.Item>
          <Form.Item name="cost_type" label="成本类型" rules={[{required:true}]}>
            <Select options={[{value:'施工费',label:'施工费'},{value:'材料费',label:'材料费'},{value:'管理费',label:'管理费'},{value:'其他',label:'其他'}]} />
          </Form.Item>
          <Form.Item name="tax_rate" label="税率(%)"><InputNumber style={{width:'100%'}} /></Form.Item>
          <Form.Item name="taxable_amount" label="含税金额" rules={[{required:true}]}><InputNumber style={{width:'100%'}} min={0} /></Form.Item>
          <Form.Item name="non_taxable_amount" label="不含税金额"><InputNumber style={{width:'100%'}} min={0} /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default OrderDetail;
