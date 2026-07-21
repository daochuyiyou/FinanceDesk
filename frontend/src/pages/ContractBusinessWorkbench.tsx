/**
 * Contract Business Workbench — 合同经营分析工作台
 *
 * 合同不是 CRUD，是经营对象。
 * 每个合同展示：合同金额 → 订单金额 → 收入 → 成本 → 利润 → 回款 → 付款 → Gap
 *
 * 布局：Summary KPI → Contract Business Table → Drawer（订单列表）
 * 数据源: GET /api/v1/dashboard/contract-summary
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { App, Table, Tag, Typography, Input, Button, Space, Popconfirm, Divider, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import SummaryKpi, { moneyKpi, countKpi, percentKpi } from '../components/SummaryKpi';
import { useAnalyzer } from '../components/BusinessAnalyzer';
import ContractDrawer from '../components/ContractDrawer';
import ContractCreateDialog from './ContractCreateDialog';
import { createProject, deleteProject } from '../services/project';
import ImportButton from '../components/ImportButton';

const { Text } = Typography;

function fmt(v: number): string {
  const abs = Math.abs(v);
  let s: string;
  if (abs >= 1_0000_0000) s = (abs / 1_0000_0000).toFixed(2) + '\u4ebf';
  else if (abs >= 1_0000) s = (abs / 1_0000).toFixed(2) + '\u4e07';
  else s = abs.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? '-\u00a5' + s : '\u00a5' + s;
}

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
  completion_rate: number;
  order_total_amount: number;
  next_action: string;
}

const ContractBusinessWorkbench: React.FC<{ onNavigate?: (key: string, state?: any) => void }> = ({ onNavigate }) => {
  const { message } = App.useApp();
  const [searchText, setSearchText] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const openCreate = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleSave = async (values: any) => {
    await createProject(values);
    setModalOpen(false);
    setEditingRecord(null);
    loadData();
  };

  const loadData = useCallback(() => {
    setLoading(true);
    api.get<ContractRow[]>('/dashboard/contract-summary')
      .then(data => setContracts(data || []))
      .catch(() => message.error('\u52a0\u8f7d\u5408\u540c\u6570\u636e\u5931\u8d25'))
      .finally(() => setLoading(false));
  }, [message]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    if (!searchText.trim()) return contracts;
    const q = searchText.toLowerCase();
    return contracts.filter(c =>
      (c.contract_name || '').toLowerCase().includes(q) ||
      (c.contract_no || '').toLowerCase().includes(q) ||
      (c.manager || '').toLowerCase().includes(q)
    );
  }, [contracts, searchText]);

  const summary = useMemo(() => {
    const c = filtered;
    return {
      count: c.length,
      totalAmount: c.reduce((s, r) => s + (r.contract_amount || 0), 0),
      totalIncome: c.reduce((s, r) => s + (r.total_income || 0), 0),
      totalCost: c.reduce((s, r) => s + (r.total_cost || 0), 0),
      totalProfit: c.reduce((s, r) => s + (r.gross_profit || 0), 0),
      totalCollected: c.reduce((s, r) => s + (r.total_collected || 0), 0),
      totalPaid: c.reduce((s, r) => s + (r.total_paid || 0), 0),
    };
  }, [filtered]);

  const kpiItems = [
    countKpi('\u5408\u540c\u6570\u91cf', summary.count, '', () => onNavigate?.('projects')),
    moneyKpi('\u5408\u540c\u603b\u91d1\u989d', summary.totalAmount, () => onNavigate?.('projects')),
    moneyKpi('\u7d2f\u8ba1\u6536\u5165', summary.totalIncome, () => onNavigate?.('incomes'), '#1677ff'),
    moneyKpi('\u7d2f\u8ba1\u6210\u672c', summary.totalCost, () => onNavigate?.('costs'), '#ff4d4f'),
    moneyKpi('\u7d2f\u8ba1\u5229\u6da6', summary.totalProfit, () => onNavigate?.('projects'), summary.totalProfit >= 0 ? '#52c41a' : '#ff4d4f'),
    moneyKpi('\u7d2f\u8ba1\u56de\u6b3e', summary.totalCollected, () => onNavigate?.('collections'), '#1677ff'),
    moneyKpi('\u7d2f\u8ba1\u4ed8\u6b3e', summary.totalPaid, () => onNavigate?.('payments'), '#fa8c16'),
  ];

  const openDrawer = useCallback((contract: ContractRow) => {
    setSelectedContract(contract);
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback(async (contract: ContractRow) => {
    try {
      await deleteProject(String(contract.contract_id));
      message.success('合同已删除');
      loadData();
    } catch (err: any) {
      const reason = err?.response?.data?.detail || err?.message || '删除失败';
      message.error(reason);
    }
  }, [loadData]);

  function profitColor(v: number): string { return v >= 0 ? '#52c41a' : '#ff4d4f'; }
  function gapColor(v: number): string { return v > 0 ? '#ff4d4f' : '#52c41a'; }

  const columns = [
    { title: '\u5408\u540c\u7f16\u53f7', dataIndex: 'contract_no', width: 130, fixed: 'left' as const,
      render: (_: string, r: ContractRow) => <a onClick={() => openDrawer(r)}>{r.contract_no || '-'}</a>,
    },
    { title: '\u5408\u540c\u540d\u79f0', dataIndex: 'contract_name', width: 180, ellipsis: true,
      render: (_: string, r: ContractRow) => <a onClick={() => openDrawer(r)}>{r.contract_name}</a>,
    },
    { title: '\u7c7b\u578b', dataIndex: 'contract_type', width: 90, render: (v: string) => <Tag>{v}</Tag> },
    { title: '\u8d1f\u8d23\u4eba', dataIndex: 'manager', width: 80 },
    { title: '\u8ba2\u5355\u6570', dataIndex: 'order_count', width: 70, align: 'right' as const },
    { title: '\u5408\u540c\u91d1\u989d', dataIndex: 'contract_amount', width: 130, align: 'right' as const, render: (v: number) => <Text strong>{fmt(v)}</Text> },
    { title: '\u7d2f\u8ba1\u6536\u5165', dataIndex: 'total_income', width: 130, align: 'right' as const,
      render: (v: number) => <span style={{ color: '#1677ff' }}>{fmt(v)}</span>,
    },
    { title: '\u7d2f\u8ba1\u6210\u672c', dataIndex: 'total_cost', width: 130, align: 'right' as const,
      render: (v: number) => <span style={{ color: '#ff4d4f' }}>{fmt(v)}</span>,
    },
    { title: '\u5229\u6da6', dataIndex: 'gross_profit', width: 130, align: 'right' as const,
      render: (v: number) => <span style={{ color: profitColor(v), fontWeight: 600 }}>{fmt(v)}</span>,
    },
    { title: '\u5229\u6da6\u7387', dataIndex: 'gross_margin', width: 80, align: 'right' as const,
      render: (v: number) => <span style={{ color: v >= 5 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>{v.toFixed(1)}%</span>,
    },
    { title: '\u56de\u6b3e', dataIndex: 'total_collected', width: 120, align: 'right' as const, render: (v: number) => fmt(v) },
    { title: '\u4ed8\u6b3e', dataIndex: 'total_paid', width: 120, align: 'right' as const, render: (v: number) => fmt(v) },
    { title: '\u6536\u5165Gap', dataIndex: 'revenue_gap', width: 120, align: 'right' as const,
      render: (v: number) => <span style={{ color: gapColor(v), fontWeight: 600 }}>{fmt(v)}</span>,
    },
    { title: '\u6210\u672cGap', dataIndex: 'cost_gap', width: 120, align: 'right' as const,
      render: (v: number) => <span style={{ color: gapColor(v), fontWeight: 600 }}>{fmt(v)}</span>,
    },
    { title: '\u72b6\u6001', dataIndex: 'status', width: 80, align: 'center' as const, render: (v: string) => <Tag>{v || '-'}</Tag> },
    { title: '\u4e0b\u4e00\u52a8\u4f5c', dataIndex: 'next_action', width: 140, ellipsis: true,
      render: (v: string) => <Text style={{ fontSize: 12, color: '#666' }}>{v}</Text>,
    },
    { title: '\u5b8c\u6210\u7387', dataIndex: 'completion_rate', width: 80, align: 'right' as const,
      render: (v: number) => <span style={{ color: v >= 80 ? '#52c41a' : '#faad14' }}>{v}%</span>,
    },
    {
      title: '操作', width: 120, align: 'center' as const, fixed: 'right' as const,
      render: (_: any, r: ContractRow) => (
        <>
          <a onClick={() => openDrawer(r)}>详情</a>
          <Divider type="vertical" />
          <Popconfirm
            title="确认删除合同"
            description={`确定删除合同「${r.contract_name || r.contract_no}」吗？删除后不可恢复。`}
            onConfirm={() => handleDelete(r)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </>
      ),
    },
  ];

  const paginationProps = useMemo(() => ({
    defaultPageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (t: number) => '共 ' + t + ' 条',
  }), []);

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增合同</Button>
        <ImportButton title="导入合同数据" importAction="/import/projects" exportAction="/projects" templateName="合同导入模板.xlsx" onSuccess={loadData} />
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索合同名称、编号、负责人…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 360, borderRadius: 6 }}
          allowClear
        />
      </Space>
      <SummaryKpi items={kpiItems} columns={4} loading={loading} />
      <Table<ContractRow>
        rowKey="contract_id"
        columns={columns}
        dataSource={filtered}
        loading={loading}
        locale={{ emptyText: '暂无数据，请点击【新增合同】或【导入】开始' }}
        pagination={paginationProps}
        size="small"
        scroll={{ x: 2000 }}
        style={{ background: '#fff', borderRadius: 8 }}
      />
      <ContractDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedContract(null); }}
        contract={selectedContract}
        onNavigate={onNavigate}
      />
      <ContractCreateDialog
        open={modalOpen}
        editingRecord={editingRecord}
        onClose={() => { setModalOpen(false); setEditingRecord(null); }}
        onSave={handleSave}
      />
    </>
  );
};

export default ContractBusinessWorkbench;
