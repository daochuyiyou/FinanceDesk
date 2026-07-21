// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { Card, Descriptions, Table, Button, Tag, Space, message, Row, Col, Statistic, Modal, Form, Input, InputNumber, DatePicker, Select, Tabs } from 'antd';
import { ArrowLeftOutlined, OrderedListOutlined, PlusOutlined, EyeOutlined, DollarOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getProject } from '../services/project';
import { fetchOrders, createOrder, OrderRecord } from '../services/order';
import { fetchIncomeFlows, IncomeFlow } from '../services/incomeFlow';
import { fetchCostFlows, CostFlow } from '../services/costFlow';
import IncomeManagement from './IncomeManagement';
import CostExecution from './CostExecution';
import CollectionManagement from './CollectionManagement';
import PaymentManagement from './PaymentManagement';

interface Props {
  projectId: number;
  onBack: () => void;
  onViewOrderDetail?: (id: number) => void;
}

const ProjectDetail: React.FC<Props> = ({ projectId, onBack, onViewOrderDetail }) => {
  const [project, setProject] = useState<any>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [incomes, setIncomes] = useState<IncomeFlow[]>([]);
  const [costs, setCosts] = useState<CostFlow[]>([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderForm] = Form.useForm();

  const loadOrders = useCallback(async () => {
    try { const r = await fetchOrders(1, 100, projectId); setOrders(r.items); } catch { setOrders([]); }
  }, [projectId]);

  const loadFlows = useCallback(async () => {
    try {
      const allIncomes: IncomeFlow[] = [];
      const allCosts: CostFlow[] = [];
      const ords = orders.length > 0 ? orders : (await fetchOrders(1, 100, projectId)).items;
      for (const o of ords) {
        try { const ri = await fetchIncomeFlows(o.id); allIncomes.push(...ri.items); } catch {}
        try { const rc = await fetchCostFlows(o.id); allCosts.push(...rc.items); } catch {}
      }
      setIncomes(allIncomes);
      setCosts(allCosts);
    } catch {}
  }, [projectId, orders]);

  useEffect(() => {
    getProject(projectId).then(setProject).catch(() => message.error('加载项目失败'));
    loadOrders();
  }, [projectId, loadOrders]);

  useEffect(() => { if (orders.length > 0) loadFlows(); }, [orders, loadFlows]);

  const handleCreateOrder = async () => {
    const v = await orderForm.validateFields();
    await createOrder({
      project_id: projectId,
      order_no: v.order_no,
      order_name: v.name,
      amount: v.amount?.toString() || '0',
      sign_date: v.sign_date ? v.sign_date.format('YYYY-MM-DD') : null,
      customer_name: v.customer_name || null,
    });
    message.success('订单创建成功');
    setOrderModalOpen(false);
    orderForm.resetFields();
    loadOrders();
  };

  const totalIncome = incomes.reduce((s, i) => s + i.taxable_amount, 0);
  const totalCost = costs.reduce((s, c) => s + c.taxable_amount, 0);

  const orderCols = [
    { title: '订单编号', dataIndex: 'order_no', width: 140 },
    { title: '订单名称', dataIndex: 'order_name' },
    { title: '甲方单位', dataIndex: 'customer_name', render: (v: string) => v || '-' },
    { title: '含税金额', dataIndex: 'amount', render: (v: number) => v ? v.toLocaleString() : '-' },
    { title: '签订日期', dataIndex: 'sign_date', render: (v: string) => v || '-' },
    {
      title: '操作', width: 120,
      render: (_: any, r: OrderRecord) => (
        <Button type="link" size="small" icon={<EyeOutlined />}
          onClick={() => onViewOrderDetail?.(r.id)}>详情</Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'orders', label: '订单管理',
      children: (
        <>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOrderModalOpen(true)} style={{ marginBottom: 12 }}>
            新增订单
          </Button>
          <Table dataSource={orders} columns={orderCols} rowKey="id" pagination={{ showSizeChanger: true, defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total) => `共 ${total} 条` }} size="small" />
        </>
      ),
    },
    { key: 'incomes', label: '收入流水', children: <div style={{ padding: 8 }}><IncomeManagement projectId={projectId} /></div> },
    { key: 'costs', label: '成本流水', children: <div style={{ padding: 8 }}><CostExecution projectId={projectId} /></div> },
    { key: 'collections', label: '回款记录', children: <div style={{ padding: 8 }}><CollectionManagement projectId={projectId} /></div> },
    { key: 'payments', label: '支付记录', children: <div style={{ padding: 8 }}><PaymentManagement projectId={projectId} /></div> },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 12 }}>返回列表</Button>

      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={6}><Card size="small"><Statistic title="合同总金额" value={orders.reduce((s: number, o: any) => s + Number(o.amount || 0), 0)} suffix="元" prefix={<DollarOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已开票金额" value={totalIncome} suffix="元" prefix={<FileTextOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已付款金额" value={totalCost} suffix="元" prefix={<DollarOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="订单数" value={orders.length} suffix="个" prefix={<OrderedListOutlined />} /></Card></Col>
      </Row>

      <Card title={project?.framework_name || '项目详情'} size="small" style={{ marginBottom: 12 }}>
        <Descriptions column={4} size="small">
          <Descriptions.Item label="项目类型">{project?.project_type || '-'}</Descriptions.Item>
          <Descriptions.Item label="集团内外">{project?.internal_or_external || '-'}</Descriptions.Item>
          <Descriptions.Item label="签订日期">{project?.sign_date || '-'}</Descriptions.Item>
          <Descriptions.Item label="期间">{project?.start_date || '?'} ~ {project?.end_date || '?'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs items={tabItems} />

      <Modal title="新增订单" open={orderModalOpen} onOk={handleCreateOrder}
        onCancel={() => setOrderModalOpen(false)} destroyOnHidden width={600}>
        <Form form={orderForm} layout="vertical">
          <Form.Item name="name" label="订单名称" rules={[{ required: true }]}>
            <Input placeholder="输入订单名称" />
          </Form.Item>
          <Form.Item name="order_no" label="订单编号" rules={[{ required: true }]}>
            <Input placeholder="输入订单编号" />
          </Form.Item>
          <Form.Item name="customer_name" label="甲方单位">
            <Input placeholder="输入甲方单位名称" />
          </Form.Item>
          <Form.Item name="amount" label="含税金额"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="sign_date" label="签订日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default ProjectDetail;