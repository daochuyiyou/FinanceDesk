/**
 * ERP Import Sandbox — 导入沙箱预览工作台
 *
 * BDD-06E Phase 1：仅预览，不写入业务表。
 * 流程：上传 → ERP Fact Preview → Match Preview → Import Preview → [确认导入 Phase 3]
 */
import React, { useState, useCallback } from 'react';
import {
  App, Card, Table, Tag, Button, Upload, Alert, Steps, Row, Col, Statistic,
  Descriptions, Space, Spin, Divider, Typography,
} from 'antd';
import {
  InboxOutlined, ReloadOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ArrowRightOutlined,
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

interface MatchPriorityItem {
  priority: string;
  label: string;
  count: number;
  confidence: string;
}

interface MatchPreviewResult {
  priorities: MatchPriorityItem[];
  total_auto_matched: number;
  total_needs_manual: number;
  total_errors: number;
}

interface ImportPreviewResult {
  total_records: number;
  income_count: number;
  cost_count: number;
  collection_count: number;
  payment_count: number;
  auto_match_count: number;
  manual_pending_count: number;
  failed_count: number;
  duplicate_count: number;
  total_income_amount: number;
  total_cost_amount: number;
}

// ── 列名中英对照（展示用） ───────────────────────────────

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
  high: 'green',
  medium: 'orange',
  low: 'red',
};

const ERPImportSandbox: React.FC = () => {
  const { message } = App.useApp();

  // State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<UploadPreviewResult | null>(null);
  const [matchPreview, setMatchPreview] = useState<MatchPreviewResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewResult | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // ── 步骤 1: 上传预览 ─────────────────────────────────

  const handleUpload = async (file: File) => {
    setUploadLoading(true);
    setUploadPreview(null);
    setMatchPreview(null);
    setImportPreview(null);
    setCurrentStep(0);

    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(API_BASE + '/erp/sandbox/upload-preview', {
        method: 'POST',
        body: fd,
      }).then(r => r.json());

      setUploadPreview(res as UploadPreviewResult);
      if (res.total_parsed > 0) {
        message.success(`解析完成: ${res.total_parsed} 条有效记录`);
        setCurrentStep(1);
      } else {
        message.warning('未解析到有效数据');
      }
    } catch (e: any) {
      message.error('上传失败: ' + e.message);
    }
    setUploadLoading(false);
    return false;
  };

  // ── 步骤 2: 匹配预览 ─────────────────────────────────

  const handleMatchPreview = async () => {
    setMatchLoading(true);
    setMatchPreview(null);
    try {
      const res = await api.post<MatchPreviewResult>('/erp/sandbox/match-preview', {});
      setMatchPreview(res);
      setCurrentStep(2);
    } catch (e: any) {
      message.error('匹配预览失败: ' + e.message);
    }
    setMatchLoading(false);
  };

  // ── 步骤 3: 导入预览 ─────────────────────────────────

  const handleImportPreview = async () => {
    setImportLoading(true);
    setImportPreview(null);
    try {
      const res = await api.get<ImportPreviewResult>('/erp/sandbox/import-preview');
      setImportPreview(res);
      setCurrentStep(3);
    } catch (e: any) {
      message.error('导入预览失败: ' + e.message);
    }
    setImportLoading(false);
  };

  // ── 重置 ────────────────────────────────────────

  const handleReset = () => {
    setUploadPreview(null);
    setMatchPreview(null);
    setImportPreview(null);
    setCurrentStep(0);
  };

  // ── 列映射渲染 ───────────────────────────────────

  const renderColumnMapping = (mappings: ColumnMapping[]) => (
    <div style={{ marginBottom: 12 }}>
      <Text strong style={{ marginBottom: 8, display: 'block' }}>列映射关系</Text>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            <th style={{ border: '1px solid #f0f0f0', padding: '6px 12px', textAlign: 'left' }}>英文目标字段</th>
            <th style={{ border: '1px solid #f0f0f0', padding: '6px 12px', textAlign: 'left' }}>检测到的列名</th>
            <th style={{ border: '1px solid #f0f0f0', padding: '6px 12px', textAlign: 'left' }}>状态</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((m) => (
            <tr key={m.target}>
              <td style={{ border: '1px solid #f0f0f0', padding: '6px 12px', fontFamily: 'monospace' }}>{m.target}</td>
              <td style={{ border: '1px solid #f0f0f0', padding: '6px 12px' }}>{m.detected || '-'}</td>
              <td style={{ border: '1px solid #f0f0f0', padding: '6px 12px' }}>
                {m.detected ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>已匹配</Tag>
                ) : (
                  <Tag color="warning" icon={<CloseCircleOutlined />}>未检测到</Tag>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ── 示例数据列定义 ─────────────────────────────

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
        const colorMap: Record<string, string> = {
          income_expense: 'blue', receivable: 'orange', collection: 'green',
        };
        return <Tag color={colorMap[v] || 'default'}>{v}</Tag>;
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

  // ── 步骤描述 ───────────────────────────────────

  const steps = [
    { title: 'Fact Preview', description: '解析结果' },
    { title: 'Match Preview', description: '匹配预览' },
    { title: 'Import Preview', description: '导入摘要' },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Title level={4} style={{ marginBottom: 4 }}>ERP Import Sandbox</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        仅预览模式 — 不写入任何业务表。确认后进入正式导入。
      </Text>

      {/* 步骤指示器 */}
      <Steps current={currentStep} items={steps} style={{ marginBottom: 24, maxWidth: 700 }} />

      {/* ── Step 0: 上传 ───────────────────────────── */}
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
        {uploadLoading && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Spin tip="解析中..."><div style={{ padding: 20 }} /></Spin>
          </div>
        )}
      </Card>

      {/* ── Step 1: ERP Fact Preview ──────────────── */}
      {uploadPreview && (
        <Card
          title={`② ERP Fact Preview (${uploadPreview.total_parsed} 条有效)`}
          size="small" style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Button size="small" onClick={handleReset}>重新上传</Button>
              <Button type="primary" size="small" onClick={handleMatchPreview} loading={matchLoading}>
                匹配预览 <ArrowRightOutlined />
              </Button>
            </Space>
          }
        >
          {uploadPreview.sheets.map((sheet, idx) => (
            <div key={idx} style={{ marginBottom: 16 }}>
              <Descriptions size="small" column={4} style={{ marginBottom: 8 }}>
                <Descriptions.Item label="Sheet">{sheet.sheet_name}</Descriptions.Item>
                <Descriptions.Item label="有效行">{sheet.parsed_rows}</Descriptions.Item>
                <Descriptions.Item label="跳过行">{sheet.skipped_rows}</Descriptions.Item>
                <Descriptions.Item label="告警">{sheet.errors.length}</Descriptions.Item>
              </Descriptions>

              {/* 列映射 */}
              {renderColumnMapping(sheet.columns_mapped)}

              {/* 告警 */}
              {sheet.errors.length > 0 && (
                <Alert
                  type="warning" showIcon style={{ marginBottom: 8 }}
                  message="解析告警"
                  description={sheet.errors.map((e, i) => <div key={i}>{e}</div>)}
                />
              )}

              {/* 示例数据 */}
              <Text strong style={{ display: 'block', marginBottom: 8 }}>示例数据（前 {sheet.sample_data.length} 条）</Text>
              <ProResizableTable
                rowKey={(_: any, i) => String(i ?? 0)}
                columns={sampleColumns}
                dataSource={sheet.sample_data}
                pagination={false}
                size="small"
              />
            </div>
          ))}
        </Card>
      )}

      {/* ── Step 2: Match Preview ─────────────────── */}
      {matchPreview && (
        <Card
          title={`③ Match Preview (自动匹配 ${matchPreview.total_auto_matched} 条)`}
          size="small" style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Button size="small" onClick={handleReset}>重新开始</Button>
              <Button type="primary" size="small" onClick={handleImportPreview} loading={importLoading}>
                导入预览 <ArrowRightOutlined />
              </Button>
            </Space>
          }
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="自动匹配"
                  value={matchPreview.total_auto_matched}
                  valueStyle={{ color: '#52c41a' }}
                  suffix={`条`}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="人工待匹配"
                  value={matchPreview.total_needs_manual}
                  valueStyle={{ color: '#faad14' }}
                  suffix={`条`}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="异常"
                  value={matchPreview.total_errors}
                  valueStyle={{ color: matchPreview.total_errors > 0 ? '#ff4d4f' : '#52c41a' }}
                  suffix={`条`}
                />
              </Card>
            </Col>
          </Row>

          <ProResizableTable
            rowKey="priority"
            columns={priorityColumns}
            dataSource={matchPreview.priorities}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* ── Step 3: Import Preview ────────────────── */}
      {importPreview && (
        <Card
          title={`④ Import Preview (${importPreview.total_records} 条)`}
          size="small" style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Button size="small" onClick={handleReset}>重新开始</Button>
              <Button type="primary" size="small" icon={<CheckCircleOutlined />} disabled>
                确认导入 (Phase 3)
              </Button>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic title="总记录数" value={importPreview.total_records} suffix="条" />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="收入明细"
                  value={importPreview.income_count}
                  suffix={`条 ¥${importPreview.total_income_amount.toLocaleString()}`}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="成本明细"
                  value={importPreview.cost_count}
                  suffix={`条 ¥${importPreview.total_cost_amount.toLocaleString()}`}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="自动匹配"
                  value={importPreview.auto_match_count}
                  suffix="条"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="人工待匹配"
                  value={importPreview.manual_pending_count}
                  suffix="条"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card size="small">
                <Statistic
                  title="失败/重复"
                  value={importPreview.failed_count + importPreview.duplicate_count}
                  suffix="条"
                  valueStyle={{
                    color: importPreview.failed_count + importPreview.duplicate_count > 0 ? '#ff4d4f' : '#52c41a',
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          <Alert
            type="info"
            message="Sandbox 模式"
            description="当前为预览模式，未写入任何业务数据。确认导入功能将在 Phase 3 实现。"
            showIcon
          />
        </Card>
      )}
    </div>
  );
};

export default ERPImportSandbox;
