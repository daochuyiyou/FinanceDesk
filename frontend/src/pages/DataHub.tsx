// @ts-nocheck
/**
 * 财务集成核对 (Data Hub) — 试点 ProResizableTable + renderLongText。
 *
 * 三个功能区域：
 *   1. Excel 解析控制台 — 上传 .xlsx，调用后端解析引擎
 *   2. 待归集数据池 — pending 流水表格，手动关联项目
 *   3. 项目执行对账 — 系统额 vs ERP 实绩 vs 差异
 */

import React, { useEffect, useState, useCallback } from 'react';
import { App, Card, Table, Tag, Select, Button, Upload, Alert, Row, Col, Statistic, message, Spin } from 'antd';
import { InboxOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import ProResizableTable from '../components/ProResizableTable';
import { renderLongText } from '../utils/renderLongText';

const { Dragger } = Upload;
const API_BASE = '/api/v1';

interface ERPFlow {
  id: number;
  record_type: string;
  occur_date: string | null;
  erp_record_id: string | null;
  summary: string | null;
  raw_project_name: string | null;
  amount_in: number | null;
  amount_out: number | null;
  matched_project_id: number | null;
  match_status: string;
  source_file: string | null;
}

interface ProjectOption {
  id: number;
  framework_name: string;
}

interface GapItem {
  project_id: number;
  project_name: string;
  system_contract_amount: number;
  erp_income_amount: number;
  erp_expense_amount: number;
  gap_income: number;
  gap_expense: number;
}

const DataHub: React.FC = () => {
  const { message } = App.useApp();
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [pendingFlows, setPendingFlows] = useState<ERPFlow[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [gapData, setGapData] = useState<GapItem[]>([]);
  const [gapLoading, setGapLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.get<{ items: ProjectOption[] }>('/projects?page=1&page_size=200');
      setProjects(res.items || []);
    } catch { /* ignore */ }
  }, []);

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await api.get<{ items: ERPFlow[]; total: number }>('/erp/flows?match_status=pending');
      setPendingFlows(res.items || []);
    } catch { message.error('加载待归集数据失败'); }
    setPendingLoading(false);
  }, [message]);

  const loadGap = useCallback(async () => {
    setGapLoading(true);
    try {
      const data = await api.get<GapItem[]>('/erp/gap');
      setGapData(data || []);
    } catch { message.error('加载对账数据失败'); }
    setGapLoading(false);
  }, [message]);

  useEffect(() => { loadProjects(); loadPending(); loadGap(); }, [loadPending, loadGap]);

  const handleUpload = async (file: File) => {
    setUploadLoading(true);
    setUploadResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(API_BASE + '/erp/upload', { method: 'POST', body: fd }).then(r => r.json());
      setUploadResult(res);
      if (res.total_rows > 0) {
        message.success(`解析完成: ${res.total_rows} 条, ${res.total_errors} 条告警`);
        loadPending();
        loadGap();
      }
    } catch (e: any) { message.error('上传失败: ' + e.message); }
    setUploadLoading(false);
    return false;
  };

  const handleMatch = async (flowId: number, projectId: number) => {
    setMatchLoading(true);
    try {
      await api.post('/erp/match', { flow_ids: [flowId], project_id: projectId });
      message.success('归集成功，关键词已自动学习');
      loadPending();
      loadGap();
    } catch (e: any) { message.error('归集失败: ' + e.message); }
    setMatchLoading(false);
  };

  // ── 待归集池列定义（使用 ProResizableTable + renderLongText）──
  const pendingColumns = [
    { title: '类型', dataIndex: 'record_type', width: 110,
      render: (v: string) => {
        const colorMap: Record<string, string> = { income_expense: 'blue', receivable: 'orange', collection: 'green' };
        return <Tag color={colorMap[v] || 'default'}>{v}</Tag>;
      },
    },
    { title: '凭证号', dataIndex: 'erp_record_id', width: 130 },
    { title: '摘要', dataIndex: 'summary', width: 250, render: renderLongText },
    { title: '项目名', dataIndex: 'raw_project_name', width: 150, render: renderLongText },
    { title: '贷方(收入)', dataIndex: 'amount_in', width: 120, align: 'right' as const,
      render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    { title: '借方(支出)', dataIndex: 'amount_out', width: 120, align: 'right' as const,
      render: (v: number) => v ? `¥${v.toLocaleString()}` : '-' },
    {
      title: '归集到项目', width: 220, fixed: 'right' as const,
      render: (_: any, r: ERPFlow) => (
        <Select showSearch placeholder="选择项目" optionFilterProp="label"
          style={{ width: 200 }} loading={matchLoading}
          onSelect={(val: number) => handleMatch(r.id, val)}
          options={projects.map(p => ({ value: p.id, label: p.framework_name }))} />
      ),
    },
  ];

  // ── 对账列定义 ──
  const gapColumns = [
    { title: '项目名称', dataIndex: 'project_name', width: 180, render: renderLongText },
    { title: '系统合同额', dataIndex: 'system_contract_amount', width: 140, align: 'right' as const,
      render: (v: number) => `¥${(v || 0).toLocaleString()}` },
    { title: 'ERP 收入', dataIndex: 'erp_income_amount', width: 140, align: 'right' as const,
      render: (v: number) => `¥${(v || 0).toLocaleString()}` },
    { title: 'ERP 支出', dataIndex: 'erp_expense_amount', width: 140, align: 'right' as const,
      render: (v: number) => `¥${(v || 0).toLocaleString()}` },
    {
      title: '收入差异', dataIndex: 'gap_income', width: 140, align: 'right' as const,
      render: (v: number) => {
        const color = v > 0 ? '#ff4d4f' : v < 0 ? '#52c41a' : '#333';
        return <span style={{ color, fontWeight: 600 }}>¥{(v || 0).toLocaleString()}</span>;
      },
    },
    {
      title: '支出差异', dataIndex: 'gap_expense', width: 140, align: 'right' as const,
      render: (v: number) => {
        const color = v > 0 ? '#ff4d4f' : v < 0 ? '#52c41a' : '#333';
        return <span style={{ color, fontWeight: 600 }}>¥{(v || 0).toLocaleString()}</span>;
      },
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* 区域一：上传控制台 */}
      <Card title="① Excel 解析控制台" size="small" style={{ marginBottom: 16 }}>
        <Dragger accept=".xlsx,.xls" beforeUpload={handleUpload} disabled={uploadLoading} showUploadList={false}>
          <p><InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} /></p>
          <p>点击或拖拽上传 ERP Excel 文件</p>
          <p style={{ color: '#999' }}>支持 .xlsx / .xls 格式</p>
        </Dragger>
        {uploadLoading && <div style={{ textAlign: 'center', marginTop: 8 }}><Spin tip="解析中..."><div style={{ padding: '20px' }}></div></Spin></div>}
        {uploadResult && (
          <Alert style={{ marginTop: 8 }}
            type={uploadResult.total_errors > 0 ? 'warning' : 'success'}
            message={`解析完成: ${uploadResult.total_rows} 行, ${uploadResult.total_errors} 条告警`}
            description={uploadResult.results?.map((r: any, i: number) =>
              <div key={i}>{r.sheet_name} ({r.sheet_type}): {r.total} 行</div>
            )} />
        )}
      </Card>

      {/* 区域二：待归集数据池 — 已替换为 ProResizableTable */}
      <Card title={`② 待归集数据池 (${pendingFlows.length})`} size="small" style={{ marginBottom: 16 }}
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadPending}>刷新</Button>}>
        <ProResizableTable
          rowKey="id"
          columns={pendingColumns}
          dataSource={pendingFlows}
          loading={pendingLoading}
          pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }}
        />
      </Card>

      {/* 区域三：项目执行对账 — 已替换为 ProResizableTable */}
      <Card title="③ 项目执行对账" size="small"
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={loadGap}>刷新</Button>}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {gapData.map((g) => (
            <Col key={g.project_id} xs={24} sm={12} md={8} lg={6}>
              <Card size="small" style={{ marginBottom: 8 }}>
                <Statistic title={g.project_name} value={g.gap_income}
                  prefix="¥" precision={2}
                  valueStyle={{ color: g.gap_income > 0 ? '#ff4d4f' : '#52c41a', fontSize: 18 }}
                  suffix={g.gap_income > 0 ? ' 欠款' : g.gap_income < 0 ? ' 结余' : ' 持平'} />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  合同: ¥{(g.system_contract_amount || 0).toLocaleString()} |
                  ERP: ¥{(g.erp_income_amount || 0).toLocaleString()}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
        <ProResizableTable
          rowKey="project_id"
          columns={gapColumns}
          dataSource={gapData}
          loading={gapLoading}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default DataHub;
