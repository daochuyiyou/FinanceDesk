/**
 * Workbench Layout Components — 统一工作区布局
 *
 * Breadcrumb · WorkbenchHeader · ContextBar · Toolbar · StatusBar
 * 所有业务页面必须使用 PageLayout，禁止自行设计 Header/Breadcrumb/Toolbar。
 */
import React from 'react';
import { Breadcrumb, Typography, Space, Button, Divider } from 'antd';
import {
  PlusOutlined, DownloadOutlined, ReloadOutlined,
  FilterOutlined, EllipsisOutlined,
} from '@ant-design/icons';
import { useAnalyzer } from './BusinessAnalyzer';

const { Text } = Typography;

// ── 1. Unified Breadcrumb ──

export interface BreadcrumbItem {
  title: string;
  href?: string;
  onClick?: () => void;
}

interface WorkbenchBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function WorkbenchBreadcrumb({ items }: WorkbenchBreadcrumbProps) {
  return (
    <Breadcrumb
      items={items.map(item => ({
        title: item.onClick ? (
          <a onClick={item.onClick} style={{ fontSize: 13 }}>{item.title}</a>
        ) : (
          <span style={{ fontSize: 13, color: item === items[items.length - 1] ? '#333' : '#999' }}>
            {item.title}
          </span>
        ),
      }))}
      style={{ marginBottom: 8 }}
    />
  );
}

// ── 2. Toolbar ──

export interface ToolbarProps {
  /** 是否显示"新增"按钮 */
  showNew?: boolean;
  /** 是否显示"导出"按钮 */
  showExport?: boolean;
  /** 是否显示"筛选"按钮 */
  showFilter?: boolean;
  /** 是否显示"更多"按钮 */
  showMore?: boolean;
  /** 自定义额外按钮 */
  extra?: React.ReactNode;
  /** 回调 */
  onNew?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  onFilter?: () => void;
  /** 刷新中状态 */
  loading?: boolean;
}

export function Toolbar({
  showNew, showExport, showFilter, showMore,
  extra, onNew, onExport, onRefresh, onFilter, loading,
}: ToolbarProps) {
  return (
    <Space>
      {showNew && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onNew} size="small">
          新增
        </Button>
      )}
      {showExport && (
        <Button icon={<DownloadOutlined />} onClick={onExport} size="small">
          导出
        </Button>
      )}
      {onRefresh && (
        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={loading}
          size="small"
        >
          刷新
        </Button>
      )}
      {showFilter && (
        <Button icon={<FilterOutlined />} onClick={onFilter} size="small">
          筛选
        </Button>
      )}
      {extra}
      {showMore && (
        <Button icon={<EllipsisOutlined />} size="small">
          更多
        </Button>
      )}
    </Space>
  );
}

// ── 3. WorkbenchHeader (Breadcrumb + Title + Toolbar) ──

interface WorkbenchHeaderProps {
  breadcrumb?: BreadcrumbItem[];
  title: string;
  toolbar?: ToolbarProps;
}

export function WorkbenchHeader({ breadcrumb, title, toolbar }: WorkbenchHeaderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <WorkbenchBreadcrumb items={breadcrumb} />
      )}

      {/* Title + Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 18, color: '#333' }}>
          {title}
        </Text>
        {toolbar && <Toolbar {...toolbar} />}
      </div>
    </div>
  );
}

// ── 4. ContextBar (reads from Business Analyzer automatically) ──

const DIMENSION_LABELS: Record<string, string> = {
  company: '公司',
  contract: '合同',
  project: '项目',
  order: '订单',
};

export function ContextBar() {
  const { state } = useAnalyzer();

  const contextItems: { label: string; value: string }[] = [
    { label: '经营期间', value: state.period },
    { label: '分析维度', value: DIMENSION_LABELS[state.dimension] || state.dimension },
  ];

  if (state.dimension !== 'company' && state.objectId) {
    contextItems.push({ label: '经营对象', value: state.objectId });
  }
  if (state.filters.owner && state.filters.owner !== '全部') {
    contextItems.push({ label: '负责人', value: state.filters.owner });
  }
  if (state.filters.contractType && state.filters.contractType !== '全部') {
    contextItems.push({ label: '合同类型', value: state.filters.contractType });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '6px 0',
        marginBottom: 12,
        flexWrap: 'wrap',
      }}
    >
      {contextItems.map((item, idx) => (
        <React.Fragment key={item.label}>
          {idx > 0 && <Divider type="vertical" style={{ margin: 0 }} />}
          <Text style={{ fontSize: 12, color: '#999' }}>
            {item.label}:
          </Text>
          <Text style={{ fontSize: 12, color: '#333', fontWeight: 500 }}>
            {item.value}
          </Text>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── 5. StatusBar ──

interface StatusBarProps {
  dataSource?: string;
  updatedAt?: string;
  period?: string;
  total?: number;
}

export function StatusBar({ dataSource, updatedAt, period, total }: StatusBarProps) {
  const { state } = useAnalyzer();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 16,
        padding: '8px 0',
        borderTop: '1px solid #f0f0f0',
        marginTop: 16,
      }}
    >
      {total !== undefined && (
        <Text style={{ fontSize: 12, color: '#999' }}>
          共 {total} 条
        </Text>
      )}
      {dataSource && (
        <Text style={{ fontSize: 12, color: '#999' }}>
          数据来源: {dataSource}
        </Text>
      )}
      {updatedAt && (
        <Text style={{ fontSize: 12, color: '#999' }}>
          更新时间: {updatedAt}
        </Text>
      )}
      <Text style={{ fontSize: 12, color: '#999' }}>
        经营期间: {period || state.period}
      </Text>
    </div>
  );
}

// ── 6. Unified PageLayout ──

interface PageLayoutProps {
  /** 面包屑 */
  breadcrumb?: BreadcrumbItem[];
  /** 页面标题 */
  title: string;
  /** Toolbar 配置 */
  toolbar?: ToolbarProps;
  /** 是否显示 ContextBar（默认 true） */
  showContextBar?: boolean;
  /** 是否显示 StatusBar（默认 false） */
  showStatusBar?: boolean;
  /** StatusBar 配置 */
  statusBar?: StatusBarProps;
  /** 主要内容 */
  children: React.ReactNode;
  /** 额外样式 */
  style?: React.CSSProperties;
}

export function PageLayout({
  breadcrumb,
  title,
  toolbar,
  showContextBar = true,
  showStatusBar = false,
  statusBar,
  children,
  style,
}: PageLayoutProps) {
  return (
    <div style={{ padding: 0, ...style }}>
      {/* Workbench Header (Breadcrumb + Title + Toolbar) */}
      <WorkbenchHeader breadcrumb={breadcrumb} title={title} toolbar={toolbar} />

      {/* Context Bar (auto-reads from Business Analyzer) */}
      {showContextBar && <ContextBar />}

      {/* Business Workspace (page content) */}
      <div style={{ minHeight: 200 }}>{children}</div>

      {/* Status Bar */}
      {showStatusBar && <StatusBar {...statusBar} />}
    </div>
  );
}
