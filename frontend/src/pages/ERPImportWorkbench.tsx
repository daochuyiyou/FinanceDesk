/**
 * ERP Import Workbench — 企业级导入工作台
 *
 * BDD-06E Phase 2：全流程 7 步导入工作台
 * Upload → Field Parse → Fact Preview → Match Preview → Impact Preview → Confirm → Result
 * 禁止跳过 Preview。所有统计基于 Dry Run（模拟计算）。
 */
import React, { useState } from 'react';
import {
  App, Card, Table, Tag, Button, Upload, Alert, Steps, Row, Col, Statistic,
  Descriptions, Space, Spin, Divider, Typography, Modal, Result, Timeline,
} from 'antd';
import {
  InboxOutlined, ArrowRightOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ReloadOutlined, WarningOutlined,
  FileTextOutlined, ClockCircleOutlined, NumberOutlined,
} from '@ant-design/icons';
import ProResizableTable from '../components/ProResizableTable';
import { renderLongText } from '../utils/renderLongText';
import { api } from '../services/api';

const { Dragger } = Upload;
const { Text, Title } = Typography;
const API_BASE = '/api/v1';

// ── Types ─────────────────────────────────────────────────

interface ColumnMapping {
  target: string;
  detected: string | null;
}

interface UploadPreviewSheet {
  sheet_name: string;
  parsed_rows: number;
  skipped_rows: number;
  errors: string[];
  columns_mapped: ColumnMapping[];
  sample_data: Record<string, any>[];
}

interface UploadPreviewResult {
  sheets: UploadPreviewSheet[];
  total_parsed: number;
  total_skipped: number;
  total_errors: number;
}

interface MatchPreviewResult {
  priorities: { priority: string; label: string; count: number; confidence: string }[];
  total_auto_matched: number;
  total_needs_manual: number;
  total_errors: number;
}

interface ImpactPreviewResult {
  total_records: number;
  income_new_count: number;
  cost_new_count: number;
  collection_new_count: number;
  payment_new_count: number;
  auto_match_count: number;
  manual_match_count: number;
  duplicate_count: number;
  failed_count: number;
  estimated_affected_orders: number;
  estimated_revenue_summary_updates: number;
  estimated_cost_summary_updates: number;
  estimated_order_summary_updates: number;
  risk_level: string;
}

interface ConfirmResult {
  batch_no: string;
  import_time: string;
  total_records: number;
  success_count: number;
  failed_count: number;
  duplicate_count: number;
  manual_match_count: number;
  duration_seconds: number;
}

interface ImportLog {
  level: string;
  message: string;
  time?: string;
}

interface ImportResultData {
  batch_no: string;
  success_count: number;
  failed_count: number;
  duplicate_count: number;
  manual_match_count: number;
  duration_seconds: number;
  logs: ImportLog[];
}

const FIELD_LABELS: Record<string, string> = {
  occur_date: '发生日期',
  erp_record_id: '凭证号',
  summary: '摘要',
  amount_in: '贷方(收入)',
  amount_out: '借方(支出)',
  raw_project_name: '项目名称',
  record_type: '记录类型',
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'green', medium: 'orange', low: 'red',
};

const RISK_COLOR: Record<string, string> = {
  LOW: 'green', MEDIUM: 'orange', HIGH: 'red',
};

const ERPImportWorkbench: React.FC = () => {
  const { message } = App.useApp();

  // Workflow state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadPreviewResult | null>(null);
  const [matchResult, setMatchResult] = useState<MatchPreviewResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [impactResult, setImpactResult] = useState<ImpactPreviewResult | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Step labels
  const steps = [
    { title: 'Upload', description: '上传文件' },
    { title: 'Parse & Preview', description: '解析预览' },
    { title: 'Match Preview', description: '匹配预览' },
    { title: 'Impact Preview', description: '影响评估' },
    { title: 'Result', description: '导入结果' },
  ];

  // ── Step 1: Upload ──────────────────────────────────

  const handleUpload = async (file: File) => {
    setUploadLoading(true);
    setUploadResult(null);
    setMatchResult(null);
    setImpactResult(null);
    setConfirmResult(null);
    setImportResult(null);
    setCurrentStep(0);

    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(API_BASE + '/erp/sandbox/upload-preview', {
        method: 'POST', body: fd,
      }).then(r => r.json());
      setUploadResult(res as UploadPreviewResult);
      if (res.total_parsed > 0) {
        message.success(`解析完成: ${res.total_parsed} 条`);
        setCurrentStep(1);
      } else {
        message.warning('未解析到有效数据');
      }
    } catch (e: any) {
      message.error('上传失败: ' + (e.message || e));
    }
    setUploadLoading(false);
    return false;
  };

  // ── Step 2 → 3: Match Preview ──────────────────────

  const goToMatch = async () => {
    setMatchLoading(true);
    try {
      const res = await api.post<MatchPreviewResult>('/erp/sandbox/match-preview', {});
      setMatchResult(res);
      setCurrentStep(2);
    } catch (e: any) {
      message.error('匹配预览失败: ' + (e.message || e));
    }
    setMatchLoading(false);
  };

  // ── Step 3 → 4: Impact Preview ─────────────────────

  const goToImpact = async () => {
    setImpactLoading(true);
    setImpactResult(null);
    try {
      const res = await api.post<ImpactPreviewResult>('/erp/sandbox/impact-preview', {});
      setImpactResult(res);
      setCurrentStep(3);
    } catch (e: any) {
      message.error('影响评估失败: ' + (e.message || e));
    }
    setImpactLoading(false);
  };

  // ── Step 4 → Confirm Dialog ────────────────────────

  const openConfirm = () => setShowConfirmModal(true);

  // ── Confirm Import ─────────────────────────────────

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    setConfirmLoading(true);
    try {
      const res = await api.post<ConfirmResult>('/erp/sandbox/confirm-import', {});
      setConfirmResult(res);
      message.success(`Batch ${res.batch_no} 创建成功`);

      // Auto-fetch import result
      setResultLoading(true);
      try {
        const resultData = await api.get<ImportResultData>(`/erp/sandbox/import-result/${res.batch_no}`);
        setImportResult(resultData);
        setCurrentStep(4);
      } catch (e2: any) {
        // Still set current step even if result fetch fails
        setCurrentStep(4);
      }
      setResultLoading(false);
    } catch (e: any) {
      message.error('确认导入失败: ' + (e.message || e));
    }
    setConfirmLoading(false);
  };

  // ── Reset ──────────────────────────────────────────

  const handleReset = () => {
    setUploadResult(null);
    setMatchResult(null);
    setImpactResult(null);
    setConfirmResult(null);
    setImportResult(null);
    setCurrentStep(0);
  };

  // ── Render helpers ─────────────────────────────────

  const renderColumnMapping = (mappings: ColumnMapping[]) => (
    <div style={{ marginBottom: 12 }}>
      <Text strong style={{ marginBottom: 8, display: 'block' }}>列映射关系</Text>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            <th style={{ border: '1px solid #f0f0f0', padding: '6px 12px', textAlign: 'left' }}>目标字段</th>
            <th style={{ border: '1px solid #f0f0f0', padding: '6px 12px', textAlign: 'left' }}>检测列名</th>
            <th style={{ border: '1px solid #f0f0f0', padding: '6px 12px', textAlign: 'left' }}>状态</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((m) => (
            <tr key={m.target}>
              <td style={{ border: '1px solid #f0f0f0', padding: '6px 12px', fontFamily: 'monospace' }}>{m.target}</td>
              <td style={{ border: '1px solid #f0f0f0', padding: '6px 12px' }}>{m.detected || '-'}</td>
              <td style={{ border: '1px solid #f0f0f0', padding: '6px 12px' }}>
                {m.detected
                  ? <Tag color="success" icon={<CheckCircleOutlined />}>已匹配</Tag>
                  : <Tag color="warning" icon={<CloseCircleOutlined />}>未检测</Tag>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const sampleColumns: any[] = [
    { title: '凭证号', dataIndex: 'erp_record_id', width: 130 },
    { title: '摘要', dataIndex: 'summary', width: 250, render: renderLongText },
    { title: '项目名', dataIndex: 'raw_project_name', width: 150, render: renderLongText },
    {
      title: '贷方(收入)', dataIndex: 'amount_in', width: 120, align: 'right' as const,
      render: (v: number) => v != null && v > 0 ? `¥${Number(v).toLocaleString()}` : '-',
    },
    {
      title: '借方(支出)', dataIndex: 'amount_out', width: 120, align: 'right' as const,
      render: (v: number) => v != null && v > 0 ? `¥${Number(v).toLocaleString()}` : '-',
    },
    { title: '类型', dataIndex: 'record_type', width: 110,
      render: (v: string) => {
        const c: Record<string, string> = { income_expense: 'blue', receivable: 'orange', collection: 'green' };
        return <Tag color={c[v] || 'default'}>{v}</Tag>;
      },
    },
  ];

  const priorityColumns: any[] = [
    { title: '优先级', dataIndex: 'priority', width: 80,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    { title: '匹配方式', dataIndex: 'label', width: 220 },
    { title: '数量', dataIndex: 'count', width: 80, align: 'right' as const,
      render: (v: number) => <Text strong>{v}</Text>,
    },
    { title: '置信度', dataIndex: 'confidence', width: 100,
      render: (v: string) => <Tag color={CONFIDENCE_COLOR[v] || 'default'}>{v}</Tag>,
    },
  ];

  const impactItems = (r: ImpactPreviewResult) => [
    { label: '总记录数', value: r.total_records, suffix: '条' },
    { label: '收入新增', value: r.income_new_count, suffix: '条' },
    { label: '成本新增', value: r.cost_new_count, suffix: '条' },
    { label: '收款新增', value: r.collection_new_count, suffix: '条' },
    { label: '付款新增', value: r.payment_new_count, suffix: '条' },
    { label: '自动匹配', value: r.auto_match_count, suffix: '条' },
    { label: '人工确认', value: r.manual_match_count, suffix: '条' },
    { label: '重复', value: r.duplicate_count, suffix: '条', warn: r.duplicate_count > 0 },
    { label: '失败', value: r.failed_count, suffix: '条', warn: r.failed_count > 0 },
    { label: '影响订单', value: r.estimated_affected_orders, suffix: '个' },
    { label: 'Revenue Summary', value: r.estimated_revenue_summary_updates, suffix: '次' },
    { label: 'Cost Summary', value: r.estimated_cost_summary_updates, suffix: '次' },
    { label: 'Order Summary', value: r.estimated_order_summary_updates, suffix: '次' },
  ];

  // ── Render ─────────────────────────────────────────

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginBottom: 4 }}>ERP Import Workbench</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        企业级导入工作台 — 全程 Dry Run，确认后才创建 Batch
      </Text>

      <Steps current={currentStep} items={steps} style={{ marginBottom: 24, maxWidth: 900 }} />

      {/* ═══════ Step 0: Upload ═══════ */}
      <Card title="① 上传 ERP Excel" size="small" style={{ marginBottom: 16 }}>
        <Dragger
          accept=".xlsx,.xls"
          beforeUpload={handleUpload}
          disabled={uploadLoading}
          showUploadList={false}
        >
          <p><InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} /></p>
          <p>点击或拖拽上传 ERP Excel 文件</p>
          <p style={{ color: '#999' }}>支持 .xlsx / .xls 格式</p>
        </Dragger>
        {uploadLoading && <div style={{ textAlign: 'center', marginTop: 12 }}><Spin tip="解析中..."><div style={{ padding: 20 }} /></Spin></div>}
      </Card>

      {/* ═══════ Step 1: Fact Preview ═══════ */}
      {uploadResult && (
        <Card
          title={`② ERP Fact Preview (${uploadResult.total_parsed} 条)`}
          size="small" style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Button size="small" onClick={handleReset}>重新上传</Button>
              <Button type="primary" size="small" onClick={goToMatch} loading={matchLoading}>
                匹配预览 <ArrowRightOutlined />
              </Button>
            </Space>
          }
        >
          {uploadResult.sheets.map((sheet, idx) => (
            <div key={idx} style={{ marginBottom: 16 }}>
              <Descriptions size="small" column={4} style={{ marginBottom: 8 }}>
                <Descriptions.Item label="文件">{sheet.sheet_name}</Descriptions.Item>
                <Descriptions.Item label="有效行">{sheet.parsed_rows}</Descriptions.Item>
                <Descriptions.Item label="跳过行">{sheet.skipped_rows}</Descriptions.Item>
                <Descriptions.Item label="告警">{sheet.errors.length}</Descriptions.Item>
              </Descriptions>

              {renderColumnMapping(sheet.columns_mapped)}

              {sheet.errors.length > 0 && (
                <Alert type="warning" showIcon style={{ marginBottom: 8 }}
                  message="解析告警"
                  description={sheet.errors.map((e, i) => <div key={i}>{e}</div>)} />
              )}

              <Text strong style={{ display: 'block', marginBottom: 8 }}>示例数据（前 {sheet.sample_data.length} 条）</Text>
              <ProResizableTable
                rowKey={(_: any, i: any) => String(i ?? 0)}
                columns={sampleColumns}
                dataSource={sheet.sample_data}
                pagination={false} size="small"
              />
            </div>
          ))}
        </Card>
      )}

      {/* ═══════ Step 2: Match Preview ═══════ */}
      {matchResult && (
        <Card
          title={`③ Business Match Preview (自动 ${matchResult.total_auto_matched} 条)`}
          size="small" style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Button size="small" onClick={handleReset}>重新开始</Button>
              <Button type="primary" size="small" onClick={goToImpact} loading={impactLoading}>
                Impact Preview <ArrowRightOutlined />
              </Button>
            </Space>
          }
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}><Card size="small">
              <Statistic title="自动匹配" value={matchResult.total_auto_matched}
                suffix="条" valueStyle={{ color: '#52c41a' }} />
            </Card></Col>
            <Col span={8}><Card size="small">
              <Statistic title="人工待定" value={matchResult.total_needs_manual}
                suffix="条" valueStyle={{ color: '#faad14' }} />
            </Card></Col>
            <Col span={8}><Card size="small">
              <Statistic title="异常" value={matchResult.total_errors}
                suffix="条" valueStyle={{ color: matchResult.total_errors > 0 ? '#ff4d4f' : '#52c41a' }} />
            </Card></Col>
          </Row>
          <ProResizableTable rowKey="priority" columns={priorityColumns}
            dataSource={matchResult.priorities} pagination={false} size="small" />
        </Card>
      )}

      {/* ═══════ Step 3: Impact Preview ═══════ */}
      {impactResult && (
        <Card
          title={`④ Import Impact Preview (Dry Run)`}
          size="small" style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Button size="small" onClick={handleReset}>重新开始</Button>
              <Button type="primary" size="small"
                icon={<CheckCircleOutlined />}
                onClick={openConfirm}>
                确认导入
              </Button>
            </Space>
          }
        >
          <Alert
            type="info" showIcon style={{ marginBottom: 16 }}
            message="Dry Run 模式 — 模拟计算，未写入任何数据"
            description={'以下所有统计基于模拟计算。点击「确认导入」后生成 Import Batch。'}
          />

          <Row gutter={[12, 12]}>
            {impactItems(impactResult).map((item) => (
              <Col key={item.label} xs={12} sm={8} md={6} lg={4}>
                <Card size="small" style={{
                  borderLeft: item.warn ? '3px solid #ff4d4f' : undefined,
                }}>
                  <Statistic
                    title={item.label}
                    value={item.value}
                    suffix={item.suffix}
                    valueStyle={{
                      fontSize: 22,
                      color: item.warn ? '#ff4d4f' : undefined,
                    }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />

          <Descriptions size="small" column={3}>
            <Descriptions.Item label="风险等级">
              <Tag color={RISK_COLOR[impactResult.risk_level] || 'default'}>
                {impactResult.risk_level}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="失败率">
              {impactResult.total_records > 0
                ? `${(impactResult.failed_count / impactResult.total_records * 100).toFixed(1)}%`
                : '0%'}
            </Descriptions.Item>
            <Descriptions.Item label="重复率">
              {impactResult.total_records > 0
                ? `${(impactResult.duplicate_count / impactResult.total_records * 100).toFixed(1)}%`
                : '0%'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* ═══════ Step 4: Import Result ═══════ */}
      {(confirmResult || importResult) && (
        <Card
          title={`⑤ Import Result`}
          size="small" style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Button size="small" onClick={handleReset} icon={<ReloadOutlined />}>新导入</Button>
            </Space>
          }
        >
          <Result
            status="success"
            title={`导入成功 — ${confirmResult?.batch_no || importResult?.batch_no}`}
            subTitle={`总 ${confirmResult?.total_records || 0} 条记录`}
            extra={[
              <Row key="stats" gutter={[12, 12]}>
                <Col xs={12} sm={6}>
                  <Card size="small"><Statistic title="✅ 成功"
                    value={importResult?.success_count || confirmResult?.success_count || 0} suffix="条"
                    valueStyle={{ color: '#52c41a' }} /></Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small"><Statistic title="❌ 失败"
                    value={importResult?.failed_count || 0} suffix="条"
                    valueStyle={{ color: (importResult?.failed_count || 0) > 0 ? '#ff4d4f' : '#52c41a' }} /></Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small"><Statistic title="🔄 重复"
                    value={importResult?.duplicate_count || 0} suffix="条"
                    valueStyle={{ color: (importResult?.duplicate_count || 0) > 0 ? '#faad14' : '#52c41a' }} /></Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small"><Statistic title="👤 人工确认"
                    value={importResult?.manual_match_count || confirmResult?.manual_match_count || 0} suffix="条"
                    valueStyle={{ color: '#faad14' }} /></Card>
                </Col>
              </Row>,
            ]}
          >
            <Divider />
            <Descriptions size="small" column={3}>
              <Descriptions.Item label={<><FileTextOutlined /> Batch</>}>
                <Text code>{confirmResult?.batch_no || importResult?.batch_no}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<><ClockCircleOutlined /> 耗时</>}>
                {confirmResult?.duration_seconds || importResult?.duration_seconds || 0}s
              </Descriptions.Item>
              <Descriptions.Item label={<><NumberOutlined /> 总记录</>}>
                {confirmResult?.total_records || 0} 条
              </Descriptions.Item>
            </Descriptions>

            {importResult?.logs && importResult.logs.length > 0 && (
              <>
                <Divider />
                <Text strong style={{ display: 'block', marginBottom: 8 }}>导入日志</Text>
                <Timeline
                  items={importResult.logs.map((log, i) => ({
                    color: log.level === 'ERROR' ? 'red' : log.level === 'WARN' ? 'orange' : 'green',
                    children: <Text style={{ fontSize: 13 }}>{log.message}</Text>,
                  }))}
                />
              </>
            )}
          </Result>
        </Card>
      )}

      {/* ═══════ Confirm Dialog ═══════ */}
      <Modal
        title="确认导入"
        open={showConfirmModal}
        onOk={handleConfirm}
        onCancel={() => setShowConfirmModal(false)}
        okText="确认导入"
        cancelText="取消"
        okButtonProps={{ danger: true, icon: <WarningOutlined /> }}
        confirmLoading={confirmLoading}
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Import Batch">
            {`IMP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-NNN`}
          </Descriptions.Item>
          <Descriptions.Item label="总记录数">
            {impactResult?.total_records || 0} 条
          </Descriptions.Item>
          <Descriptions.Item label="预计影响订单">
            {impactResult?.estimated_affected_orders || 0} 个
          </Descriptions.Item>
          <Descriptions.Item label="风险等级">
            <Tag color={RISK_COLOR[impactResult?.risk_level || 'LOW']}>
              {impactResult?.risk_level || 'LOW'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
        <Alert
          type="warning" showIcon style={{ marginTop: 16 }}
          message="此操作不可撤销"
          description="确认后系统将创建 Import Batch 记录。确认导入的暂存数据将在 Phase 3 写入业务表。"
        />
      </Modal>
    </div>
  );
};

export default ERPImportWorkbench;
