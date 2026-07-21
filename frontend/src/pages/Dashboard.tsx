/**
 * Business Cockpit（经营驾驶舱）— 总览首页
 *
 * 结构：
 * - Header（分析上下文）
 * - 经营概况（4 KPI）
 * - 资金概况（4 KPI）
 * - 经营指标（4 KPI）
 * - 基础数据（4 KPI）
 */
import React, { useState, useCallback, useEffect } from 'react';
import { App, Card, Row, Col, Typography, Segmented } from 'antd';
import dayjs from 'dayjs';
import { api } from '../services/api';
import SummaryKpi, { moneyKpi, countKpi, percentKpi } from '../components/SummaryKpi';
import { useAnalyzer } from '../components/BusinessAnalyzer';

const { Text } = Typography;

interface DashboardSummary {
  project_count: number;
  total_order_count: number;
  total_contract_amount: number;
  total_income: number;
  total_cost: number;
  total_profit: number;
  total_collected: number;
  total_paid: number;
  completion_rate: number;
  profit_rate: number;
  collection_rate: number;
  cost_rate: number;
  supplier_count: number;
  dict_count: number;
}

interface Props {
  onNavigate: (key: string, state?: any) => void;
}

function analyzerParams(state: any): Record<string, string | number | undefined> {
  const p: Record<string, string | number | undefined> = {};
  if (state.period) p.period = state.period;
  const dim = state.dimension;
  const oid = state.objectId;
  if (oid && (dim === 'contract' || dim === 'project')) {
    p.project_id = oid;
  }
  return p;
}

const Dashboard: React.FC<Props> = ({ onNavigate }) => {
  const { message } = App.useApp();
  const analyzer = useAnalyzer();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = analyzerParams(analyzer.state);
    try {
      const s = await api.get<DashboardSummary>('/dashboard/summary', params).catch(() => null);
      if (s) setSummary(s);
    } catch (e: any) {
      message.error('加载数据失败: ' + (e.message || e));
    } finally { setLoading(false); }
  }, [message, analyzer.state]);

  useEffect(() => { loadData(); }, [loadData]);

  const s = summary;

  /* ── 经营概况 ── */
  const businessKpi = s ? [
    countKpi('项目数', s.project_count, '个', () => onNavigate('projects')),
    countKpi('合同数', s.project_count, '个', () => onNavigate('projects')),
    countKpi('订单数', s.total_order_count, '个', () => onNavigate('orders')),
    moneyKpi('合同总额', s.total_contract_amount, () => onNavigate('orders')),
  ] : [];

  /* ── 资金概况 ── */
  const fundKpi = s ? [
    moneyKpi('累计收入', s.total_income, () => onNavigate('incomes'), '#1677ff'),
    moneyKpi('累计成本', s.total_cost, () => onNavigate('costs'), '#ff4d4f'),
    moneyKpi('累计回款', s.total_collected, () => onNavigate('collections'), '#1677ff'),
    moneyKpi('累计付款', s.total_paid, () => onNavigate('payments'), '#ff4d4f'),
  ] : [];

  /* ── 经营指标 ── */
  const metricKpi = s ? [
    percentKpi('经营完成率', s.completion_rate, () => onNavigate('orders')),
    percentKpi('利润率', s.profit_rate, undefined),
    percentKpi('回款率', s.collection_rate, undefined),
    percentKpi('成本率', s.cost_rate, undefined),
  ] : [];

  /* ── 基础数据 ── */
  const baseKpi = s ? [
    countKpi('合同数', s.project_count, '个'),
    countKpi('供应商', s.supplier_count, '个'),
    countKpi('人员', 0, '人'),
    countKpi('字典项', s.dict_count, '项'),
  ] : [];

  return (
    <>
      {/* ═══ Header ═══ */}
      <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>ERP数据: {analyzer.state.period} | 更新时间: {dayjs().format('YYYY-MM-DD HH:mm')}</Text>
          </Col>
          <Col flex="auto" style={{ textAlign: 'center' }}>
            <Segmented value={analyzer.state.dimension} onChange={analyzer.setDimension as any}
              options={[
                { value: 'company', label: '公司' },
                { value: 'contract', label: '合同' },
                { value: 'project', label: '项目' },
                { value: 'order', label: '订单' },
              ]} />
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>
              项目: {s?.project_count || 0} | 订单: {s?.total_order_count || 0}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* ═══ 经营概况 ═══ */}
      <Card title="经营概况" size="small" style={{ marginBottom: 12 }}>
        <SummaryKpi items={businessKpi} columns={4} loading={!s} />
      </Card>

      {/* ═══ 资金概况 ═══ */}
      <Card title="资金概况" size="small" style={{ marginBottom: 12 }}>
        <SummaryKpi items={fundKpi} columns={4} loading={!s} />
      </Card>

      {/* ═══ 经营指标 ═══ */}
      <Card title="经营指标" size="small" style={{ marginBottom: 12 }}>
        <SummaryKpi items={metricKpi} columns={4} loading={!s} />
      </Card>

      {/* ═══ 基础数据 ═══ */}
      <Card title="基础数据" size="small">
        <SummaryKpi items={baseKpi} columns={4} loading={!s} />
      </Card>
    </>
  );
};

export default Dashboard;
