/**
 * DetailDrawer — 统一经营分析 Drawer
 *
 * 用于所有 Drill-down 场景：
 * - 点击 SummaryKPI 卡片 → 打开对应流水 Drawer
 * - 点击订单行 → 打开订单详情 Drawer（含 5 个 Tab）
 * - 点击流水行 → 展开行详情
 */
import React, { useState } from 'react';
import { Drawer, Tabs, Card, Row, Col, Typography, Tag, Descriptions } from 'antd';
import FlowTable from './FlowTable';
import { formatMoney, formatPercent } from './SummaryKpi';
import type { FlowRow } from './FlowTable';

const { Text } = Typography;

// ── Types ──

export interface OrderInfo {
  orderId: string;
  orderNo: string;
  orderName: string;
  owner: string;
  orderAmount: number;
  customerName?: string;
  orderType?: string;
  orderDate?: string;
  orderSource?: string;
  supplier?: string;
}

export interface OrderKpi {
  incomeTotal: number;
  collectionTotal: number;
  costTotal: number;
  paymentTotal: number;
  profit: number;
  revenueGap: number;
  costGap: number;
}

export interface DrawerFlowData {
  income: FlowRow[];
  cost: FlowRow[];
  collection: FlowRow[];
  payment: FlowRow[];
}

export interface TimelineEvent {
  time: string;
  event: string;
  detail: string;
  type: string;
}

export interface OrderDrawerData {
  order: OrderInfo;
  kpi: OrderKpi;
  flows: DrawerFlowData;
  timeline: TimelineEvent[];
  nextAction?: string;
}

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  data?: OrderDrawerData;
  loading?: boolean;
}

// ── Order Detail Tab: 经营概览 ──

const OverviewTab: React.FC<{ data: OrderDrawerData }> = ({ data }) => {
  const { order, kpi, nextAction } = data;
  return (
    <div>
      {/* Order Info */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Descriptions column={2} size="small" colon={false}>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>订单编号</Text>}>{order.orderNo}</Descriptions.Item>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>订单名称</Text>}>{order.orderName}</Descriptions.Item>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>订单金额</Text>}>
            <Text strong>{formatMoney(order.orderAmount)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>负责人</Text>}>{order.owner}</Descriptions.Item>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>甲方单位</Text>}>{order.customerName || '-'}</Descriptions.Item>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>订单类型</Text>}>{order.orderType || '-'}</Descriptions.Item>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>订单日期</Text>}>{order.orderDate || '-'}</Descriptions.Item>
          <Descriptions.Item label={<Text style={{ color: '#999' }}>来源</Text>}>{order.orderSource || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[8, 8]}>
        {[
          { label: '累计收入', value: kpi.incomeTotal, color: '#52c41a' },
          { label: '累计回款', value: kpi.collectionTotal, color: '#1677ff' },
          { label: '累计成本', value: kpi.costTotal, color: '#ff4d4f' },
          { label: '累计付款', value: kpi.paymentTotal, color: '#fa8c16' },
        ].map((item) => (
          <Col key={item.label} span={12}>
            <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
              <Text style={{ fontSize: 11, color: '#999', display: 'block' }}>{item.label}</Text>
              <Text strong style={{ fontSize: 16, color: item.color }}>
                {formatMoney(item.value)}
              </Text>
            </Card>
          </Col>
        ))}
        <Col span={12}>
          <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
            <Text style={{ fontSize: 11, color: '#999', display: 'block' }}>利润</Text>
            <Text strong style={{ fontSize: 16, color: kpi.profit >= 0 ? '#52c41a' : '#ff4d4f' }}>
              {formatMoney(kpi.profit)}
            </Text>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" bodyStyle={{ padding: '8px 12px' }}>
            <Text style={{ fontSize: 11, color: '#999', display: 'block' }}>收入Gap</Text>
            <Text strong style={{ fontSize: 16, color: kpi.revenueGap > 0 ? '#ff4d4f' : '#52c41a' }}>
              {formatMoney(kpi.revenueGap)}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Next Action */}
      {nextAction && (
        <Card size="small" style={{ marginTop: 12 }}>
          <Text style={{ color: '#666' }}>下一步：</Text>
          <Tag color="blue" style={{ marginLeft: 8 }}>{nextAction}</Tag>
          <Text style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>系统自动推导</Text>
        </Card>
      )}

      {/* Timeline placeholder */}
      <Card size="small" style={{ marginTop: 12 }} title="经营动态">
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          {data.timeline.map((evt, idx) => (
            <div key={idx} style={{ position: 'relative', paddingBottom: 12, borderLeft: '2px solid #f0f0f0', paddingLeft: 16, marginLeft: -2 }}>
              <div style={{
                position: 'absolute', left: -6, top: 4, width: 10, height: 10, borderRadius: '50%',
                background: evt.type === 'income' ? '#52c41a' : evt.type === 'cost' ? '#ff4d4f' : evt.type === 'collection' ? '#1677ff' : evt.type === 'payment' ? '#fa8c16' : '#999',
              }} />
              <Text style={{ fontSize: 11, color: '#999' }}>{evt.time}</Text>
              <div>
                <Tag style={{ fontSize: 10, marginRight: 4 }}>{evt.event}</Tag>
                <Text style={{ fontSize: 12, color: '#666' }}>{evt.detail}</Text>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── Main Drawer Component ──

const DetailDrawer: React.FC<DetailDrawerProps> = ({ open, onClose, data, loading }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) {
    return (
      <Drawer
        title="订单经营分析"
        open={open}
        onClose={onClose}
        width="45%"
        styles={{ body: { padding: 16 } }}
      >
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>选择订单查看详情</div>
      </Drawer>
    );
  }

  const tabItems = [
    {
      key: 'overview',
      label: '经营概览',
      children: <OverviewTab data={data} />,
    },
    {
      key: 'income',
      label: `收入流水 (${data.flows.income.length})`,
      children: <FlowTable type="income" data={data.flows.income} loading={loading} />,
    },
    {
      key: 'cost',
      label: `成本流水 (${data.flows.cost.length})`,
      children: <FlowTable type="cost" data={data.flows.cost} loading={loading} />,
    },
    {
      key: 'collection-payment',
      label: `回款付款 (${data.flows.collection.length + data.flows.payment.length})`,
      children: (
        <div>
          <FlowTable type="collection" data={data.flows.collection} loading={loading} />
          <div style={{ height: 16 }} />
          <FlowTable type="payment" data={data.flows.payment} loading={loading} />
        </div>
      ),
    },
    {
      key: 'erp-log',
      label: 'ERP日志',
      children: (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
          ERP 日志功能即将上线
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <div>
          <Text strong style={{ fontSize: 15 }}>{data.order.orderName}</Text>
          <Text style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>{data.order.orderNo}</Text>
        </div>
      }
      open={open}
      onClose={onClose}
      width="45%"
      styles={{ body: { padding: 16 } }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="small"
        style={{ marginTop: -8 }}
      />
    </Drawer>
  );
};

export default DetailDrawer;
export type { DetailDrawerProps };
