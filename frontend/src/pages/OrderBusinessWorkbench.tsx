/**
 * Order Business Workbench — 真实数据版本
 * PS-001A: 支持 focusOrderId 深链，自动打开对应订单 Drawer。
 *
 * 数据源: GET /api/v1/dashboard/batch-order-summary
 * Drawer: 真实流水 API（Timeline 保留 Mock）
 *
 * PDD-008: 所有 KPI 必须来自真实 Summary，禁止 Mock
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { App, Table, Tag, Typography, Input, Button, Space, Popconfirm, Divider } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useAnalyzer } from '../components/BusinessAnalyzer';
import { api } from '../services/api';
import SummaryKpi, { moneyKpi, countKpi, percentKpi } from '../components/SummaryKpi';
import DetailDrawer from '../components/DetailDrawer';
import OrderModal from './OrderModal';
import { createOrder, updateOrder, deleteOrder } from '../services/order';
import { fetchProjects } from '../services/project';
import ImportButton from '../components/ImportButton';

const { Text } = Typography;

function fmt(v: number): string {
  const abs = Math.abs(v);
  let s: string;
  if (abs >= 1_0000_0000) s = (abs / 1_0000_0000).toFixed(2) + '亿';
  else if (abs >= 1_0000) s = (abs / 1_0000).toFixed(2) + '万';
  else s = abs.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? '-¥' + s : '¥' + s;
}

interface BatchOrderRow {
  order_id: number;
  order_no: string;
  order_name: string;
  order_amount: number;
  income_total: number;
  collection_total: number;
  cost_total: number;
  payment_total: number;
  profit: number;
  revenue_gap: number;
  cost_gap: number;
  status: string;
  next_action: string;
  owner: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { color: string }> = {
  '正常':     { color: 'success' },
  '待开票':   { color: 'default' },
  '待回款':   { color: 'warning' },
  '待付款':   { color: 'orange' },
  '成本超支': { color: 'red' },
  '利润异常': { color: 'red' },
  '部分回款': { color: 'processing' },
  '部分付款': { color: 'processing' },
};

function StatusTag({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  return <Tag color={cfg?.color || 'default'}>{status}</Tag>;
}

let _focusHandled = false;

const OrderBusinessWorkbench: React.FC<{ focusOrderId?: number; onNavigate?: (key: string, state?: any) => void }> = ({ focusOrderId, onNavigate }) => {
  const { message } = App.useApp();
  const [searchText, setSearchText] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any>(undefined);
  const [orders, setOrders] = useState<BatchOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [projectList, setProjectList] = useState<any[]>([]);

  const openCreate = useCallback(async () => {
    try {
      const p = await fetchProjects(1, 200).then(r => r.items || []);
      setProjectList(p);
    } catch {}
    setEditingOrder(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((order: any) => {
    setEditingOrder(order);
    setModalOpen(true);
  }, []);

  const handleSave = async (values: any) => {
    if (editingOrder) {
      await updateOrder(String(editingOrder.order_id), values);
    } else {
      await createOrder(values);
    }
    setModalOpen(false);
    setEditingOrder(null);
    loadData();
  };

  const analyzer = useAnalyzer();

  const loadData = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = {};
    api.get<BatchOrderRow[]>('/dashboard/batch-order-summary', params)
      .then(data => setOrders(data || []))
      .catch(() => message.error('加载订单数据失败'))
      .finally(() => setLoading(false));
  }, [analyzer.state, message]);

  const handleDelete = useCallback(async (order: BatchOrderRow) => {
    try {
      await deleteOrder(String(order.order_id));
      message.success('订单已删除');
      loadData();
    } catch (err: any) {
      const reason = err?.response?.data?.detail || err?.message || '删除失败';
      message.error(reason);
    }
  }, [loadData, message]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-open drawer for focusOrderId
  useEffect(() => {
    if (focusOrderId && orders.length > 0 && !_focusHandled) {
      const target = orders.find(o => o.order_id === focusOrderId);
      if (target) {
        _focusHandled = true;
        openDrawer(target);
      }
    }
  }, [focusOrderId, orders]);

  const filteredOrders = useMemo(() => {
    if (!searchText.trim()) return orders;
    const q = searchText.toLowerCase();
    return orders.filter(o =>
      (o.order_no || '').toLowerCase().includes(q) ||
      (o.order_name || '').toLowerCase().includes(q) ||
      (o.owner || '').toLowerCase().includes(q)
    );
  }, [orders, searchText]);

  const summary = useMemo(() => {
    const o = filteredOrders;
    const totalAmount = o.reduce((s, r) => s + (r.order_amount || 0), 0);
    const totalIncome = o.reduce((s, r) => s + (r.income_total || 0), 0);
    const totalCost = o.reduce((s, r) => s + (r.cost_total || 0), 0);
    const totalCollected = o.reduce((s, r) => s + (r.collection_total || 0), 0);
    const totalPaid = o.reduce((s, r) => s + (r.payment_total || 0), 0);
    return {
      orderCount: o.length,
      totalAmount,
      totalIncome,
      totalCost,
      totalProfit: totalIncome - totalCost,
      totalInvoiced: totalIncome,
      totalCollected,
      totalPaid,
      completionRate: totalIncome > 0 ? Math.round((totalCollected / totalIncome) * 1000) / 10 : 0,
    };
  }, [filteredOrders]);

  const kpiItems = [
    countKpi('订单数量', summary.orderCount, '', () => message.info('订单数量')),
    moneyKpi('订单总金额', summary.totalAmount, () => message.info('订单总金额')),
    moneyKpi('累计收入', summary.totalIncome, () => onNavigate?.('incomes'), '#1677ff'),
    moneyKpi('累计成本', summary.totalCost, () => onNavigate?.('costs'), '#ff4d4f'),
    moneyKpi('累计利润', summary.totalProfit, () => message.info('累计利润'), summary.totalProfit >= 0 ? '#52c41a' : '#ff4d4f'),
    moneyKpi('累计开票', summary.totalInvoiced, () => onNavigate?.('incomes')),
    moneyKpi('累计回款', summary.totalCollected, () => onNavigate?.('collections'), '#1677ff'),
    moneyKpi('累计付款', summary.totalPaid, () => onNavigate?.('payments'), '#fa8c16'),
    percentKpi('经营完成率', summary.completionRate, () => message.info('经营完成率')),
  ];

  const openDrawer = useCallback(async (order: BatchOrderRow) => {
    const orderId = order.order_id;
    try {
      const [incomes, costs] = await Promise.all([
        api.get<{ items: any[] }>('/orders/' + orderId + '/incomes?page_size=100').catch(() => ({ items: [] })),
        api.get<{ items: any[] }>('/orders/' + orderId + '/costs?page_size=100').catch(() => ({ items: [] })),
      ]);
      const [collections, payments] = await Promise.all([
        api.get<any[]>('/collections?order_id=' + orderId).catch(() => []),
        api.get<any[]>('/payments?order_id=' + orderId).catch(() => []),
      ]);
      setDrawerData({
        order: {
          orderId: String(orderId),
          orderNo: order.order_no,
          orderName: order.order_name,
          owner: order.owner || '',
          orderAmount: order.order_amount,
          customerName: '',
          orderType: '',
          orderDate: '',
          orderSource: '',
        },
        kpi: {
          incomeTotal: order.income_total,
          collectionTotal: order.collection_total,
          costTotal: order.cost_total,
          paymentTotal: order.payment_total,
          profit: order.profit,
          revenueGap: order.revenue_gap,
          costGap: order.cost_gap,
        },
        flows: {
          income: (incomes?.items || []).map((f: any) => ({
            id: f.id, date: f.invoice_date || '', amount: f.taxable_amount || 0,
            nonTaxable: f.non_taxable_amount || 0, invoiceNo: f.invoice_no || '',
            taxRate: f.tax_rate || 0, remark: f.remark || '', _type: 'income' as const,
          })),
          cost: (costs?.items || []).map((f: any) => ({
            id: f.id, date: '', amount: f.taxable_amount || 0,
            nonTaxable: f.non_taxable_amount || 0, costType: f.cost_type || '',
            supplier: '', remark: f.remark || '', _type: 'cost' as const,
          })),
          collection: (Array.isArray(collections) ? collections : []).map((f: any) => ({
            id: f.id, date: f.collection_date || f.date || '', amount: f.amount || 0,
            method: '', status: '', remark: '', _type: 'collection' as const,
          })),
          payment: (Array.isArray(payments) ? payments : []).map((f: any) => ({
            id: f.id, date: f.payment_date || f.date || '', amount: f.amount || 0,
            method: '', status: '', remark: '', _type: 'payment' as const,
          })),
        },
        timeline: [],
        nextAction: order.next_action,
      });
      setDrawerOpen(true);
    } catch {
      message.error('加载订单详情失败');
    }
  }, [message]);

  function gapColor(v: number): string { return v > 0 ? '#ff4d4f' : '#52c41a'; }
  function profitColor(v: number): string { return v >= 0 ? '#52c41a' : '#ff4d4f'; }

  const columns = [
    {
      title: '订单编号', dataIndex: 'order_no', width: 140, fixed: 'left' as const,
      render: (_: string, r: BatchOrderRow) => <a onClick={() => openDrawer(r)}>{r.order_no}</a>,
    },
    {
      title: '订单名称', dataIndex: 'order_name', width: 160, ellipsis: true,
      render: (_: string, r: BatchOrderRow) => <a onClick={() => openDrawer(r)}>{r.order_name}</a>,
    },
    { title: '负责人', dataIndex: 'owner', width: 80,
      render: (v: string) => <a onClick={() => message.info('按 ' + v + ' 筛选')}>{v || '-'}</a>,
    },
    { title: '订单金额', dataIndex: 'order_amount', width: 130, align: 'right' as const, render: (v: number) => <Text strong>{fmt(v)}</Text> },
    {
      title: '累计收入', dataIndex: 'income_total', width: 130, align: 'right' as const,
      render: (v: number, r: BatchOrderRow) => (
        <a onClick={() => message.info('钻取 ' + r.order_name + ' 收入流水')} style={{ color: '#1677ff' }}>{fmt(v)}</a>
      ),
    },
    { title: '累计成本', dataIndex: 'cost_total', width: 130, align: 'right' as const,
      render: (v: number, r: BatchOrderRow) => (
        <a onClick={() => message.info('钻取 ' + r.order_name + ' 成本流水')} style={{ color: '#ff4d4f' }}>{fmt(v)}</a>
      ),
    },
    { title: '累计利润', dataIndex: 'profit', width: 130, align: 'right' as const,
      render: (v: number) => <span style={{ color: profitColor(v), fontWeight: 600 }}>{fmt(v)}</span>,
    },
    { title: '累计回款', dataIndex: 'collection_total', width: 130, align: 'right' as const,
      render: (v: number, r: BatchOrderRow) => (
        <a onClick={() => message.info('钻取 ' + r.order_name + ' 回款记录')} style={{ color: '#1677ff' }}>{fmt(v)}</a>
      ),
    },
    { title: '累计付款', dataIndex: 'payment_total', width: 130, align: 'right' as const, render: (v: number) => fmt(v) },
    { title: '收入Gap', dataIndex: 'revenue_gap', width: 120, align: 'right' as const,
      render: (v: number) => <span style={{ color: gapColor(v), fontWeight: 600 }}>{fmt(v)}</span>,
    },
    { title: '成本Gap', dataIndex: 'cost_gap', width: 120, align: 'right' as const,
      render: (v: number) => <span style={{ color: gapColor(v), fontWeight: 600 }}>{fmt(v)}</span>,
    },
    {
      title: '状态', dataIndex: 'status', width: 100, align: 'center' as const,
      render: (v: string) => <StatusTag status={v} />,
    },
    { title: '下一动作', dataIndex: 'next_action', width: 130, ellipsis: true,
      render: (v: string) => <Text style={{ color: '#666', fontSize: 12 }}>{v}</Text>,
    },
    { title: '更新时间', dataIndex: 'updated_at', width: 100, align: 'right' as const,
      render: (v: string) => v ? v.slice(0, 10) : '',
    },
    {
      title: '操作', width: 180, align: 'center' as const, fixed: 'right' as const,
      render: (_: any, r: BatchOrderRow) => (
        <Space>
          <a onClick={() => openEdit(r)}><EditOutlined /> 编辑</a>
          <a onClick={() => openDrawer(r)}>详情</a>
          <Divider type="vertical" />
          <Popconfirm
            title="确认删除订单"
            description={`确定删除订单「${r.order_name || r.order_no}」吗？删除后不可恢复。`}
            onConfirm={() => handleDelete(r)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增订单</Button>
        <ImportButton title="导入订单数据" importAction="/import/orders" exportAction="/orders" templateName="订单导入模板.xlsx" onSuccess={loadData} />
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索订单编号、名称、负责人…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 360, borderRadius: 6 }}
          allowClear
        />
      </Space>
      <SummaryKpi items={kpiItems} columns={3} loading={loading && orders.length === 0} />
      <Table<BatchOrderRow>
        rowKey="order_id"
        columns={columns}
        dataSource={filteredOrders}
        loading={loading}
        locale={{ emptyText: '暂无数据，请点击【新增订单】或【导入】开始' }}
        pagination={{ showSizeChanger: true, defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total) => `共 ${total} 条` }}
        size="small"
        scroll={{ x: 1800 }}
        style={{ background: '#fff', borderRadius: 8 }}
      />
      <DetailDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerData(undefined); }}
        data={drawerData}
      />
      <OrderModal
        open={modalOpen}
        editingRecord={editingOrder}
        projectList={projectList}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};

export default OrderBusinessWorkbench;
