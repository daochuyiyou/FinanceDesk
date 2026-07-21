/**
 * SummaryKPI — 经营分析卡片组
 *
 * 顶部显示一排 KPI 数字卡片，支持点击钻取。
 * 统一风格：label (gray) + value (bold) + optional onClick
 */
import React from 'react';
import { Card, Row, Col, Typography } from 'antd';

const { Text } = Typography;

export interface KpiItem {
  label: string;
  value: string;
  onClick?: () => void;
  /** 值颜色，默认 #333 */
  valueColor?: string;
  /** 前缀符号，如 ¥ */
  prefix?: string;
}

interface SummaryKpiProps {
  items: KpiItem[];
  /** 一行显示几个卡片 (默认 4) */
  columns?: number;
  loading?: boolean;
}

const formatNum = (v: number): string => {
  if (Math.abs(v) >= 1_0000_0000) return (v / 1_0000_0000).toFixed(2) + '亿';
  if (Math.abs(v) >= 1_0000) return (v / 1_0000).toFixed(2) + '万';
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function formatMoney(v: number): string {
  return v < 0 ? `-¥${formatNum(Math.abs(v))}` : `¥${formatNum(v)}`;
}

export function formatPercent(v: number): string {
  return `${v.toFixed(1)}%`;
}

// 货币卡片
export function moneyKpi(label: string, value: number, onClick?: () => void, valueColor?: string): KpiItem {
  return {
    label,
    value: formatMoney(value),
    onClick,
    valueColor: valueColor || (value < 0 ? '#ff4d4f' : '#333'),
  };
}

// 数字卡片
export function countKpi(label: string, value: number, suffix = '', onClick?: () => void): KpiItem {
  return {
    label,
    value: `${value.toLocaleString()}${suffix}`,
    onClick,
  };
}

// 百分比卡片
export function percentKpi(label: string, value: number, onClick?: () => void): KpiItem {
  return {
    label,
    value: formatPercent(value),
    onClick,
    valueColor: value >= 0 ? '#52c41a' : '#ff4d4f',
  };
}

const SummaryKpi: React.FC<SummaryKpiProps> = ({ items, columns = 4, loading }) => {
  if (loading) {
    return (
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Col key={i} xs={24} sm={12} md={6} lg={24 / columns}>
            <Card size="small"><div style={{ height: 60, background: '#f5f5f5', borderRadius: 4 }} /></Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      {items.map((item, idx) => (
        <Col
          key={idx}
          xs={24} sm={12} md={6}
          lg={24 / columns}
          style={{ minWidth: columns <= 3 ? 200 : 160 }}
        >
          <Card
            size="small"
            hoverable={!!item.onClick}
            onClick={item.onClick}
            style={{
              cursor: item.onClick ? 'pointer' : 'default',
              borderRadius: 8,
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Text style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 4 }}>
              {item.label}
            </Text>
            <Text
              strong
              style={{
                fontSize: 20,
                color: item.valueColor || '#333',
                lineHeight: 1.3,
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.prefix}{item.value}
            </Text>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default SummaryKpi;
