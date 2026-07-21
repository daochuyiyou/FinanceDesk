/**
 * AlertPanel — 经营异常面板
 * PS-001: 点击跳转订单工作台
 */
import React, { useEffect, useState } from 'react';
import { Card, Tag, Typography, Spin, Empty } from 'antd';
import { WarningFilled, ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons';
import { api } from '../services/api';

const { Text } = Typography;

interface AlertItem {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  order_id: number | null;
  order_no: string | null;
  amount: number;
  detail: string;
  action: string;
}

const SEVERITY_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  critical: { color: '#ff4d4f', icon: <WarningFilled style={{ color: '#ff4d4f' }} /> },
  warning:  { color: '#faad14', icon: <ExclamationCircleFilled style={{ color: '#faad14' }} /> },
  info:     { color: '#1677ff', icon: <InfoCircleFilled style={{ color: '#1677ff' }} /> },
};

const TYPE_LABELS: Record<string, string> = {
  overdue_collection: '超期未回款',
  overdue_payment: '超期未付款',
  revenue_gap: '收入 Gap',
  cost_gap: '成本 Gap',
  erp_unmatched: 'ERP 未匹配',
  profit_abnormal: '利润异常',
};

interface Props {
  onAlertClick?: (orderId: number) => void;
}

const AlertPanel: React.FC<Props> = ({ onAlertClick }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<AlertItem[]>('/dashboard/alerts')
      .then(data => setAlerts(data || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const displayed = alerts.slice(0, 10);

  return (
    <Card
      title={
        <span>
          <WarningFilled style={{ color: '#ff4d4f', marginRight: 8 }} />
          经营异常
          <Text style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>{alerts.length > 10 ? 'Top 10' : alerts.length + ' 项'}</Text>
        </span>
      }
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '4px 12px 12px', maxHeight: 420, overflow: 'auto' }}
    >
      <Spin spinning={loading}>
        {displayed.length === 0 && !loading && (
          <Empty description="暂无异常" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '24px 0' }} />
        )}
        {displayed.map((item, idx) => {
          const cfg = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.info;
          return (
            <div
              key={idx}
              style={{
                padding: '8px 0',
                borderBottom: idx < displayed.length - 1 ? '1px solid #f5f5f5' : 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (item.order_id && onAlertClick) {
                  onAlertClick(item.order_id);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ marginTop: 2 }}>{cfg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Tag color={item.severity === 'critical' ? 'red' : item.severity === 'warning' ? 'orange' : 'blue'} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                      {TYPE_LABELS[item.type] || item.type}
                    </Tag>
                    <Text style={{ fontSize: 13, fontWeight: 500, color: cfg.color, flex: 1 }} ellipsis={{ tooltip: item.title }}>
                      {item.title}
                    </Text>
                  </div>
                  <Text style={{ fontSize: 11, color: '#999', display: 'block', lineHeight: 1.4 }}>
                    {item.detail}
                  </Text>
                </div>
              </div>
            </div>
          );
        })}
        {alerts.length > 10 && (
          <div style={{ textAlign: 'center', padding: '8px 0', cursor: 'pointer' }}>
            <Text style={{ color: '#1677ff', fontSize: 12 }}>查看更多 ({alerts.length - 10} 项) →</Text>
          </div>
        )}
      </Spin>
    </Card>
  );
};

export default AlertPanel;
