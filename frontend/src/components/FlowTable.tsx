/**
 * FlowTable — 通用流水表格组件
 *
 * 用于 Drill-down Drawer 中展示收入/成本/回款/付款流水。
 * 统一列定义，避免每个 flow type 单独写表格。
 */
import React from 'react';
import { Table, Tag, Typography } from 'antd';
import { formatMoney } from './SummaryKpi';

const { Text } = Typography;

// ── Flow Types ──

export type FlowType = 'income' | 'cost' | 'collection' | 'payment';

interface BaseFlowItem {
  id: number;
  date: string;
  amount: number;
  remark?: string;
}

export interface IncomeFlowRow extends BaseFlowItem {
  _type: 'income';
  invoiceNo: string;
  taxRate: number;
  nonTaxable: number;
}

export interface CostFlowRow extends BaseFlowItem {
  _type: 'cost';
  costType: string;
  supplier: string;
  nonTaxable: number;
}

export interface CollectionFlowRow extends BaseFlowItem {
  _type: 'collection';
  method: string;
  status: string;
}

export interface PaymentFlowRow extends BaseFlowItem {
  _type: 'payment';
  method: string;
  status: string;
}

export type FlowRow = IncomeFlowRow | CostFlowRow | CollectionFlowRow | PaymentFlowRow;

interface FlowTableProps {
  type: FlowType;
  data: FlowRow[];
  loading?: boolean;
}

const TYPE_LABELS: Record<FlowType, string> = {
  income: '收入流水',
  cost: '成本流水',
  collection: '回款记录',
  payment: '付款记录',
};

const COLUMNS: Record<FlowType, any[]> = {
  income: [
    { title: '日期', dataIndex: 'date', width: 110, key: 'date' },
    { title: '含税金额', dataIndex: 'amount', width: 140, key: 'amount', align: 'right', render: (v: number) => <Text strong style={{ color: '#52c41a' }}>{formatMoney(v)}</Text> },
    { title: '不含税金额', dataIndex: 'nonTaxable', width: 140, key: 'nonTaxable', align: 'right', render: (v: number) => formatMoney(v) },
    { title: '发票号', dataIndex: 'invoiceNo', width: 150, key: 'invoiceNo' },
    { title: '税率', dataIndex: 'taxRate', width: 70, key: 'taxRate', render: (v: number) => `${v}%` },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  ],
  cost: [
    { title: '日期', dataIndex: 'date', width: 110, key: 'date' },
    { title: '含税金额', dataIndex: 'amount', width: 140, key: 'amount', align: 'right', render: (v: number) => <Text strong style={{ color: '#ff4d4f' }}>{formatMoney(v)}</Text> },
    { title: '不含税金额', dataIndex: 'nonTaxable', width: 140, key: 'nonTaxable', align: 'right', render: (v: number) => formatMoney(v) },
    { title: '成本类型', dataIndex: 'costType', width: 110, key: 'costType' },
    { title: '供应商', dataIndex: 'supplier', width: 160, key: 'supplier', ellipsis: true },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  ],
  collection: [
    { title: '日期', dataIndex: 'date', width: 110, key: 'date' },
    { title: '金额', dataIndex: 'amount', width: 140, key: 'amount', align: 'right', render: (v: number) => <Text strong style={{ color: '#52c41a' }}>{formatMoney(v)}</Text> },
    { title: '回款方式', dataIndex: 'method', width: 120, key: 'method' },
    { title: '状态', dataIndex: 'status', width: 100, key: 'status', render: (v: string) => <Tag color={v === '已到账' ? 'success' : 'warning'}>{v}</Tag> },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  ],
  payment: [
    { title: '日期', dataIndex: 'date', width: 110, key: 'date' },
    { title: '金额', dataIndex: 'amount', width: 140, key: 'amount', align: 'right', render: (v: number) => <Text strong style={{ color: '#ff4d4f' }}>{formatMoney(v)}</Text> },
    { title: '付款方式', dataIndex: 'method', width: 120, key: 'method' },
    { title: '状态', dataIndex: 'status', width: 100, key: 'status', render: (v: string) => <Tag color={v === '已支付' ? 'success' : 'warning'}>{v}</Tag> },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  ],
};

const FlowTable: React.FC<FlowTableProps> = ({ type, data, loading }) => {
  return (
    <div>
      <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>
        {TYPE_LABELS[type]}
      </Text>
      <Table
        rowKey="id"
        columns={COLUMNS[type]}
        dataSource={data}
        loading={loading}
        size="small"
        pagination={data.length > 10 ? { pageSize: 10, showTotal: (t) => `共 ${t} 条` } : false}
        scroll={{ x: 700 }}
      />
      {data.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无{TYPE_LABELS[type]}
        </div>
      )}
    </div>
  );
};

export default FlowTable;
