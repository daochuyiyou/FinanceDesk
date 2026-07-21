// @ts-nocheck
/**
 * 订单列表（Order List）
 *
 * BDD-02B F2：订单台账列表，展示订单基础信息 + 合同信息。
 * 经营指标全部留给订单详情和 Dashboard。
 */

import React, { useEffect, useState, useCallback } from 'react';
import { App, Button, Space, Tag, Table, Select, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, OrderedListOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchOrders, OrderRecord } from '../services/order';
import { fetchProjects } from '../services/project';
import ImportButton from '../components/ImportButton';
import type { ColumnsType } from 'antd/es/table';

interface Props {
  onViewDetail?: (id: number) => void;
}

const OrderList: React.FC<Props> = ({ onViewDetail }) => {
  const { message } = App.useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [projectOpts, setProjectOpts] = useState<{ value: number; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterProject, setFilterProject] = useState<number | undefined>();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, pRes] = await Promise.all([
        fetchOrders(1, 500, filterProject),
        fetchProjects(1, 200),
      ]);
      // Enrich with project info from the response (contract_name, contract_type already in response)
      setOrders(oRes.items);
      setProjectOpts(pRes.items.map(p => ({ value: p.id, label: p.framework_name })));
    } catch { message.error('加载数据失败'); }
    setLoading(false);
  }, [filterProject, message]);

  useEffect(() => { loadData(); }, [loadData]);

  const contractTypeTag = (v: string) => {
    if (v === '框架合同') return <Tag color="blue">框架</Tag>;
    if (v === '单项合同') return <Tag color="green">单项</Tag>;
    return <Tag>{v}</Tag>;
  };

  const statusTag = (v: string) => {
    if (!v || v === '待执行') return <Tag>{v || '待执行'}</Tag>;
    if (v === '执行中') return <Tag color="processing">执行中</Tag>;
    if (v === '已完成') return <Tag color="success">已完成</Tag>;
    if (v === '已作废') return <Tag color="error">已作废</Tag>;
    return <Tag>{v}</Tag>;
  };

  const sourceTag = (v: string) => {
    if (v === '框架合同') return <Tag color="blue">框架</Tag>;
    if (v === '单项合同') return <Tag color="green">单项</Tag>;
    return <Tag>{v}</Tag>;
  };

  const columns: ColumnsType<any> = [
    { title: '订单编号', dataIndex: 'order_no', width: 150, render: (v: string) => <code>{v}</code> },
    { title: '订单名称', dataIndex: 'order_name', width: 200 },
    {
      title: '所属合同', dataIndex: 'contract_name', width: 180,
      render: (v: string) => v || '-',
    },
    {
      title: '合同类型', dataIndex: 'contract_type', width: 100,
      render: (v: string) => contractTypeTag(v),
    },
    {
      title: '订单来源', dataIndex: 'order_source', width: 100,
      render: (v: string) => sourceTag(v),
    },
    {
      title: '订单状态', dataIndex: 'status', width: 100,
      render: (v: string) => statusTag(v),
    },
    {
      title: '经营状态', dataIndex: 'settlement_status', width: 110,
      render: () => <Tag style={{ opacity: 0.5 }}>冻结中</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_at', width: 160,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作', width: 120, fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}
            onClick={() => onViewDetail?.(r.id)}>详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16} align="middle">
          <Col span={4}><Statistic title="订单总数" value={orders.length} prefix={<OrderedListOutlined />} /></Col>
          <Col span={6}>
            <Select allowClear placeholder="按合同筛选" style={{ width: '100%' }}
              value={filterProject} onChange={setFilterProject}
              options={projectOpts} />
          </Col>
          <Col><ImportButton title="导入订单" importAction="/import/orders"
            exportAction="/orders" templateName="订单导入模板.xlsx"
            onSuccess={loadData} /></Col>
          <Col><Button type="primary" icon={<PlusOutlined />}>新增订单</Button></Col>
        </Row>
      </Card>
      <Table dataSource={orders} columns={columns} rowKey="id" loading={loading}
        pagination={{ showSizeChanger: true, defaultPageSize: 20 }} size="small"
        scroll={{ x: 1300 }} />
    </div>
  );
};
export default OrderList;
