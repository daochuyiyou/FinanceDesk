/**
 * ContractDrawer — 合同经营 Drawer
 *
 * 展示：合同概况 → 订单列表 → 项目 KPI
 * 点击订单 → 进入 Order Business Workbench（预留）
 */
import React, { useEffect, useState } from 'react';
import { Drawer, Descriptions, Card, Row, Col, Table, Tag, Typography, Spin } from 'antd';
import { api } from '../services/api';
import { formatMoney } from './SummaryKpi';

const { Text } = Typography;

interface ContractRow {
  contract_id: number;
  contract_no: string;
  contract_name: string;
  contract_type: string;
  manager: string;
  status: string;
  contract_amount: number;
  order_count: number;
  total_income: number;
  total_cost: number;
  gross_profit: number;
  gross_margin: number;
  total_collected: number;
  total_paid: number;
  revenue_gap: number;
  cost_gap: number;
}

interface OrderRow {
  order_id: string;
  order_no: string;
  order_name: string;
  order_amount: number;
  income_total: number;
  cost_total: number;
  profit: number;
  collection_total: number;
  payment_total: number;
  status: string;
}

interface ContractDrawerProps {
  open: boolean;
  onClose: () => void;
  contract: ContractRow | null;
  onNavigate?: (key: string, state?: any) => void;
}

const ContractDrawer: React.FC<ContractDrawerProps> = ({ open, onClose, contract, onNavigate }) => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && contract) {
      setLoading(true);
      api.get<OrderRow[]>('/dashboard/batch-order-summary?project_id=' + contract.contract_id)
        .then(data => setOrders(data || []))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [open, contract]);

  if (!contract) return null;

  const orderColumns = [
    { title: '\u8ba2\u5355\u7f16\u53f7', dataIndex: 'order_no', width: 140,
      render: (_: any, record: OrderRow) => (
        <a onClick={() => onNavigate?.('orders', { focusOrderId: Number(record.order_id) })}
           style={{ cursor: 'pointer' }}>
          {record.order_no}
        </a>
      ),
    },
    { title: '\u8ba2\u5355\u540d\u79f0', dataIndex: 'order_name', width: 160, ellipsis: true },
    { title: '\u8ba2\u5355\u91d1\u989d', dataIndex: 'order_amount', width: 120, align: 'right' as const, render: (v: number) => formatMoney(v) },
    { title: '\u6536\u5165', dataIndex: 'income_total', width: 120, align: 'right' as const, render: (v: number) => <span style={{ color: '#1677ff' }}>{formatMoney(v)}</span> },
    { title: '\u6210\u672c', dataIndex: 'cost_total', width: 120, align: 'right' as const, render: (v: number) => <span style={{ color: '#ff4d4f' }}>{formatMoney(v)}</span> },
    { title: '\u5229\u6da6', dataIndex: 'profit', width: 120, align: 'right' as const,
      render: (v: number) => <span style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>{formatMoney(v)}</span>,
    },
    { title: '\u56de\u6b3e', dataIndex: 'collection_total', width: 120, align: 'right' as const, render: (v: number) => formatMoney(v) },
    { title: '\u4ed8\u6b3e', dataIndex: 'payment_total', width: 120, align: 'right' as const, render: (v: number) => formatMoney(v) },
    {
      title: '\u72b6\u6001', dataIndex: 'status', width: 80, align: 'center' as const,
      render: (v: string) => <Tag color={v === '\u6b63\u5e38' ? 'success' : 'warning'}>{v}</Tag>,
    },
  ];

  return (
    <Drawer
      title={
        <div>
          <Text strong style={{ fontSize: 15 }}>{contract.contract_name}</Text>
          <Text style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>{contract.contract_no}</Text>
          <Tag style={{ marginLeft: 8 }}>{contract.contract_type}</Tag>
        </div>
      }
      open={open}
      onClose={onClose}
      width="45%"
      styles={{ body: { padding: 16 } }}
    >
      {/* Contract Info */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Descriptions column={2} size="small" colon={false}>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>负责人</Text>}>{contract.manager || '-'}</Descriptions.Item>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>状态</Text>}>{contract.status || '-'}</Descriptions.Item>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>订单数</Text>}>{contract.order_count}</Descriptions.Item>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>合同金额</Text>}><Text strong>{formatMoney(contract.contract_amount)}</Text></Descriptions.Item>
        </Descriptions>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
        {[
          { label: '\u7d2f\u8ba1\u6536\u5165', value: contract.total_income, color: '#1677ff' },
          { label: '\u7d2f\u8ba1\u6210\u672c', value: contract.total_cost, color: '#ff4d4f' },
          { label: '\u5229\u6da6', value: contract.gross_profit, color: contract.gross_profit >= 0 ? '#52c41a' : '#ff4d4f' },
          { label: '\u5229\u6da6\u7387', value: contract.gross_margin + '%', color: contract.gross_margin >= 5 ? '#52c41a' : '#ff4d4f' },
        ].map(item => (
          <Col key={item.label} span={12}>
            <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
              <Text style={{ fontSize: 11, color: '#999', display: 'block' }}>{item.label}</Text>
              <Text strong style={{ fontSize: 14, color: item.color }}>
                {typeof item.value === 'number' ? formatMoney(item.value) : item.value}
              </Text>
            </Card>
          </Col>
        ))}
        {[
          { label: '\u7d2f\u8ba1\u56de\u6b3e', value: contract.total_collected, color: '#1677ff' },
          { label: '\u7d2f\u8ba1\u4ed8\u6b3e', value: contract.total_paid, color: '#fa8c16' },
          { label: '\u6536\u5165Gap', value: contract.revenue_gap, color: contract.revenue_gap > 0 ? '#ff4d4f' : '#52c41a' },
          { label: '\u6210\u672cGap', value: contract.cost_gap, color: contract.cost_gap > 0 ? '#ff4d4f' : '#52c41a' },
        ].map(item => (
          <Col key={item.label} span={12}>
            <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
              <Text style={{ fontSize: 11, color: '#999', display: 'block' }}>{item.label}</Text>
              <Text strong style={{ fontSize: 14, color: item.color }}>
                {formatMoney(item.value)}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Order List */}
      <Card size="small" title={'\u8ba2\u5355\u5217\u8868 (' + orders.length + ')'}>
        <Spin spinning={loading}>
          <Table<OrderRow>
            rowKey="order_id"
            columns={orderColumns}
            dataSource={orders}
            pagination={orders.length > 5 ? { pageSize: 5 } : false}
            size="small"
            scroll={{ x: 800 }}
          />
          {orders.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>暂无订单</div>
          )}
        </Spin>
      </Card>

      {/* Risk & ERP Log Placeholder */}
      <Card size="small" style={{ marginTop: 12 }} title="经营风险">
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#ccc' }}>
          经营风险分析即将上线
        </div>
      </Card>
    </Drawer>
  );
};

export default ContractDrawer;
