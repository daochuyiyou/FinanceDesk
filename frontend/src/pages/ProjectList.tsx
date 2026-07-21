// @ts-nocheck
/**
 * 合同台账（Contract Register）
 *
 * BDD-01 F2：仅展示合同层数据，不展示经营指标。
 * 经营指标全部留给订单中心和 Dashboard。
 */

import React, { useState, useCallback, useEffect } from 'react';
import { App, Button, Space, Tag, Typography } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, OrderedListOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';

import { fetchProjects, createProject, updateProject, ProjectRecord } from '../services/project';
import ContractCreateDialog from './ContractCreateDialog';
import ProResizableTable from '../components/ProResizableTable';
import ImportButton from '../components/ImportButton';
import { renderLongText } from '../utils/renderLongText';

const { Text } = Typography;

const ContractRegister: React.FC<{
  onViewProjectDetail?: (id: number) => void;
  onViewOrderDetail?: (id: number) => void;
}> = ({ onViewProjectDetail, onViewOrderDetail }) => {
  const { message } = App.useApp();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const loadData = useCallback(async (p: number, ps: number) => {
    setLoading(true);
    try {
      const res = await fetchProjects(p, ps);
      setProjects(res.items);
      setTotal(res.total);
    } catch {
      message.error('加载合同数据失败');
    }
    setLoading(false);
  }, [message]);

  useEffect(() => { loadData(page, pageSize); }, [page, pageSize, loadData]);

  const handleSave = async (values: any) => {
    if (editingRecord) {
      await updateProject(editingRecord.id, values);
      message.success('合同更新成功');
    } else {
      await createProject(values);
      message.success('合同创建成功');
    }
    setModalOpen(false);
    setEditingRecord(null);
    loadData(page, pageSize);
  };

  const columns: ProColumns<ProjectRecord>[] = [
    {
      title: '合同编号', dataIndex: 'contract_no', width: 140,
      render: (v: any) => v ? <Text code>{String(v)}</Text> : '-',
    },
    {
      title: '合同名称', dataIndex: 'framework_name', width: 200,
      render: (v: any, _: any) => renderLongText(v, undefined, undefined) || '-',
    },
    {
      title: '合同类型', dataIndex: 'contract_type', width: 100,
      render: (v: any) => v === '框架合同'
        ? <Tag color="blue">框架</Tag> : <Tag color="green">单项</Tag>,
    },
    {
      title: '业主单位', dataIndex: 'owner_name', width: 160,
      render: (v: any) => v || '-',
    },
    {
      title: '所属年度', dataIndex: 'contract_year', width: 100,
      render: (v: any) => v ? `${v}年` : '-',
    },
    {
      title: '合同金额', dataIndex: 'contract_amount', width: 130, align: 'right',
      render: (v: any) => v ? `¥${Number(v).toLocaleString()}` : '-',
    },
    {
      title: '预算金额', dataIndex: 'budget_amount', width: 130, align: 'right',
      render: (v: any) => v ? `¥${Number(v).toLocaleString()}` : '-',
    },
    {
      title: '订单数量', dataIndex: 'order_count', width: 100, align: 'center',
      render: (v: any) => v != null ? <Tag color="processing">{v}</Tag> : '0',
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: any) => {
        if (!v || v === '待执行') return <Tag>{v || '待执行'}</Tag>;
        if (v === '执行中') return <Tag color="processing">执行中</Tag>;
        if (v === '已完成') return <Tag color="success">已完成</Tag>;
        if (v === '终止') return <Tag color="error">终止</Tag>;
        return <Tag>{v}</Tag>;
      },
    },
    {
      title: '创建时间', dataIndex: 'created_at', width: 160,
      render: (v: any) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作', width: 220, fixed: 'right',
      render: (_: any, record: ProjectRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}
            onClick={() => onViewProjectDetail?.(Number(record.id))}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => { setEditingRecord(record); setModalOpen(true); }}>编辑</Button>
          <Button type="link" size="small" icon={<OrderedListOutlined />}
            onClick={() => { if (onViewOrderDetail && record.id) onViewOrderDetail(Number(record.id)); }}>订单</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProResizableTable
        rowKey="id"
        columns={columns}
        dataSource={projects}
        loading={loading}
        pagination={{
          showSizeChanger: true,
          defaultPageSize: 20,
          pageSizeOptions: ['10', '20', '50', '100'],
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: (p: number, ps: number) => { setPage(p); setPageSize(ps); },
        }}
        headerTitle="合同台账"
        toolBarRender={() => [
          <ImportButton key="import" title="导入合同数据"
            importAction="/import/projects" exportAction="/projects"
            templateName="合同导入模板.xlsx"
            onSuccess={() => loadData(page, pageSize)} />,
          <Button key="create" type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditingRecord(null); setModalOpen(true); }}>
            新增合同
          </Button>,
        ]}
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

export default ContractRegister;
