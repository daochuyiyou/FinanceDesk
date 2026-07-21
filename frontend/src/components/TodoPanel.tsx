/**
 * TodoPanel — 今日待办面板
 * PS-001: 点击跳转订单工作台
 */
import React, { useEffect, useState } from 'react';
import { Card, Tag, Typography, Spin, Row, Col, Empty } from 'antd';
import { CheckCircleFilled, ClockCircleFilled, RightCircleFilled } from '@ant-design/icons';
import { api } from '../services/api';

const { Text } = Typography;

interface TodoItem {
  type: string;
  title: string;
  count: number;
  severity: string;
  action: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  view_incomes: <CheckCircleFilled style={{ color: '#52c41a' }} />,
  view_costs: <CheckCircleFilled style={{ color: '#1677ff' }} />,
  view_payments: <ClockCircleFilled style={{ color: '#faad14' }} />,
  view_erp: <ClockCircleFilled style={{ color: '#faad14' }} />,
};

const ACTION_LABELS: Record<string, string> = {
  view_incomes: '录收入',
  view_costs: '录成本',
  view_payments: '安排付款',
  view_erp: '去匹配',
};

interface Props {
  onTodoClick?: (orderId: number) => void;
}

const TodoPanel: React.FC<Props> = ({ onTodoClick }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<TodoItem[]>('/dashboard/todos')
      .then(data => setTodos(data || []))
      .catch(() => setTodos([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card
      title={
        <span>
          <ClockCircleFilled style={{ color: '#1677ff', marginRight: 8 }} />
          今日待办
        </span>
      }
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '4px 12px 12px', maxHeight: 420, overflow: 'auto' }}
    >
      <Spin spinning={loading}>
        {todos.length === 0 && !loading && (
          <Empty description="暂无待办事项" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '24px 0' }} />
        )}
        {todos.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '10px 0',
              borderBottom: idx < todos.length - 1 ? '1px solid #f5f5f5' : 'none',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (onTodoClick) onTodoClick(idx + 1);
            }}
          >
            <Row align="middle" gutter={12}>
              <Col>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: item.severity === 'warning' ? '#fff7e6' : '#e6f4ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {ACTION_ICONS[item.action] || <RightCircleFilled style={{ color: '#1677ff' }} />}
                </div>
              </Col>
              <Col flex="auto">
                <Text strong style={{ fontSize: 14, display: 'block' }}>{item.title}</Text>
                <Tag color={item.severity === 'warning' ? 'orange' : 'blue'} style={{ fontSize: 11, marginTop: 2 }}>
                  {item.count > 0 ? `${item.count} 项待处理` : '处理中'}
                </Tag>
              </Col>
              <Col>
                <Tag color="default" style={{ cursor: 'pointer' }}>
                  {ACTION_LABELS[item.action] || '处理'}
                </Tag>
              </Col>
            </Row>
          </div>
        ))}
      </Spin>
    </Card>
  );
};

export default TodoPanel;
