// @ts-nocheck
/**
 * 订单管理页面 —— 项目选择器 → 订单 ProTable + 新增/编辑/删除
 *
 * 页面结构：
 *   ┌─ 项目选择器 ──────────────────────────────────┐
 *   │  Select 下拉搜索 → 列出该项目的全部订单        │
 *   └────────────────────────────────────────────────┘
 *   ProTable：项目名称 | 供应商名称 | 订单名称 | 金额 | 创建时间 | 操作
 *   Modal 弹窗：关联项目 + 关联供应商 + 订单名称 + 金额
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  App,
  Button,
  Space,
  Popconfirm,
  Select,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

import { fetchProjects } from '../services/project';
import type { ProjectRecord } from '../services/project';
import { fetchSuppliers } from '../services/supplier';
import type { SupplierRecord } from '../services/supplier';
import {
  fetchOrdersByProject,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../services/order';
import type {
  OrderRecord,
  OrderCreatePayload,
  OrderUpdatePayload,
} from '../services/order';
import OrderModal from './OrderModal';
import ImportModal from '../components/ImportModal';
import { ImportOutlined } from '@ant-design/icons';

/* ════════════════════════════════════════════════════════════════
   主页面
   ════════════════════════════════════════════════════════════════ */

interface OrderPageProps {
  onViewDetail?: (id: number) => void;
}

const OrderPage: React.FC<OrderPageProps> = ({ onViewDetail }) => {
  const { message } = App.useApp();

  /* ── 下拉数据 ────────────────────────────── */
  const [projectList, setProjectList] = useState<ProjectRecord[]>([]);
  const [supplierList, setSupplierList] = useState<SupplierRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);

  /* 加载项目 + 供应商列表 */
  useEffect(() => {
    Promise.all([
      fetchProjects(1, 200).then((r) => setProjectList(r.items)),
      fetchSuppliers(1, 200).then((r) => setSupplierList(r.items)),
    ]);
  }, []);

  /* 加载订单 */
  useEffect(() => {
    if (selectedProjectId) {
      fetchOrdersByProject(selectedProjectId).then(setAllOrders).catch((err) => { console.error(err); message.error('加载订单失败'); });
    } else {
      setAllOrders([]);
    }
  }, [selectedProjectId]);

  /* ── 弹窗状态 ────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OrderRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  /* ── 解析辅助 ────────────────────────────── */

  const getProjectName = (projectId: string) => {
    const p = projectList.find((x) => x.id === projectId);
    return p?.framework_name ?? (projectId?.slice(0, 8) || '未知') + '…';
  };

  const getSupplierName = (supplierId: string) => {
    const s = supplierList.find((x) => x.id === supplierId);
    return s?.name ?? (supplierId?.slice(0, 8) || '未知') + '…';
  };

  /* ── 表格列定义 ────────────────────────────── */

  const STATUS_COLORS: Record<string, string> = {
    '待执行': 'processing',
    '执行中': 'blue',
    '已完成': 'success',
    '已作废': 'default',
  };

  const renderActions = (_: any, record: OrderRecord) => (
    <Space>
      {onViewDetail && <Button type="link" size="small" onClick={() => onViewDetail(record.id)}>详情</Button>}
    </Space>
  );

  const columns: ProColumns<OrderRecord>[] = [
    {
      title: '序号',
      valueType: 'indexBorder',
      width: 60,
    },
    {
      title: '关联项目（框架合同）',
      dataIndex: 'project_id',
      width: 180,
      ellipsis: true,
      render: (_, record) => (
        <Tag color="blue">{getProjectName(record.project_id)}</Tag>
      ),
    },
    {
      title: '订单名称',
      dataIndex: 'order_name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '订单编号',
      dataIndex: 'order_no',
      width: 160,
      copyable: true,
    },
    {
      title: '生成订单日期',
      dataIndex: 'order_date',
      valueType: 'date',
      width: 110,
      search: false,
    },
    {
      title: '金额含税（元）',
      dataIndex: 'amount',
      width: 120,
      valueType: 'money',
      search: false,
    },
    {
      title: '金额不含税（元）',
      dataIndex: 'non_tax_amount',
      width: 120,
      valueType: 'money',
      search: false,
    },
    {
      title: '订单类型',
      dataIndex: 'order_type',
      width: 100,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      search: false,
      render: (_, record) =>
        record.status ? (
          <Tag color={STATUS_COLORS[record.status] || 'default'}>{record.status}</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      width: 170,
      search: false,
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record);
              setModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定删除订单「${record.order_no}」？`}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ── 操作处理 ──────────────────────────────── */

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleSave = async (values: OrderCreatePayload | OrderUpdatePayload) => {
    if (editingRecord) {
      await updateOrder(editingRecord.id, values as OrderUpdatePayload);
    } else {
      await createOrder(values as OrderCreatePayload);
    }
    // 刷新列表
    if (selectedProjectId) {
      const orders = await fetchOrdersByProject(selectedProjectId);
      setAllOrders(orders);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteOrder(id);
    message.success('删除成功');
    if (selectedProjectId) {
      const orders = await fetchOrdersByProject(selectedProjectId);
      setAllOrders(orders);
    }
  };

  /* ── 导出 Excel ──────────────────────────── */
  const handleExport = () => {
    try {
      if (!allOrders || allOrders.length === 0) {
        message.warning('当前项目没有订单可导出');
        return;
      }

      const data = allOrders.map((r) => ({
        '关联项目': getProjectName(r.project_id) || '-',
        '关联供应商': getSupplierName(r.supplier_id) || '-',
        '订单名称': r.order_name || '',
        '订单编号': r.order_no || '-',
        '生成订单日期': r.order_date || '',
        '金额含税（元）': r.amount ?? 0,
        '金额不含税（元）': r.non_tax_amount ?? '',
        'ERP编号': r.erp_no || '',
        '移动项目编号': r.mobile_project_no || '',
        '订单类型': r.order_type || '',
        '移动对接人': r.mobile_contact || '',
        '状态': r.status || '',
        '创建时间': r.created_at ? dayjs(r.created_at).format('YYYY-MM-DD HH:mm') : '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '订单信息');

      const colWidths = Object.keys(data[0] || {}).map((k) => ({
        wch: Math.max(k.length * 2, 14),
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `订单信息_${dayjs().format('YYYYMMDD')}.xlsx`);
      message.success('导出成功');
    } catch (error: any) {

      message.error('导出失败，请检查重试');
    }
  };

  /* ── 渲染 ──────────────────────────────────── */

  const selectedProject = projectList.find((p) => p.id === selectedProjectId);

  return (
    <div>
      {/* 项目选择器 */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>选择项目：</span>
        <Select
          style={{ width: 320 }}
          placeholder="选择一个项目查看其订单"
          showSearch
          allowClear
          value={selectedProjectId}
          onChange={setSelectedProjectId}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={projectList.map((p) => ({
            value: p.id,
            label: p.framework_name,
          }))}
        />
        {selectedProject && (
          <span style={{ color: '#888', fontSize: 13 }}>
            {selectedProjectId && `${allOrders.length} 条订单`}
          </span>
        )}
      </div>

      {/* 无项目提示 */}
      {!selectedProjectId ? (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: '#bbb',
            fontSize: 15,
          }}
        >
          请先从上方下拉框选择一个项目
        </div>
      ) : (
        <ProTable<OrderRecord>
          rowKey="id"
          columns={columns}
          dataSource={allOrders}
          search={{ labelWidth: 'auto', defaultCollapsed: true }}
          toolBarRender={() => [
            <Button key="import" icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>导入</Button>,
            <Button key="export" icon={<ExportOutlined />} onClick={handleExport}>
              导出 Excel
            </Button>,
            <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增订单
            </Button>,
          ]}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            defaultPageSize: 20,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
        />
      )}

      {/* 新增/编辑弹窗 */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="导入订单"
        endpoint="/orders"
        columns={[
          { title: 'project_id', dataIndex: 'project_id', required: true },
          { title: 'supplier_id', dataIndex: 'supplier_id', required: true },
          { title: 'order_no', dataIndex: 'order_no', required: true },
          { title: 'amount', dataIndex: 'amount', valueType: 'number' },
          { title: 'order_name', dataIndex: 'order_name' },
          { title: 'order_date', dataIndex: 'order_date', valueType: 'date' },
          { title: 'erp_no', dataIndex: 'erp_no' },
        ]}
        onSuccess={async () => {
          if (selectedProjectId) {
            const orders = await (await import('../services/order')).fetchOrdersByProject(selectedProjectId);
            setAllOrders(orders);
          }
        }}
      />

      <OrderModal
        open={modalOpen}
        editingRecord={editingRecord}
        defaultProjectId={selectedProjectId}
        projectList={projectList}
        supplierList={supplierList}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default OrderPage;