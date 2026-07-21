// @ts-nocheck
/**
 * 供应商年度综合单价管理抽屉（宽表格式）
 * 一行 = 一个供应商 × 一个年度，各工种单价为列
 */

import React, { useEffect, useRef, useState } from 'react';
import { App, Button, Drawer, Space, Popconfirm, Modal, Form, Input, InputNumber, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';

import {
  fetchSupplierYearPrices,
  createSupplierYearPrice,
  updateSupplierYearPrice,
  deleteSupplierYearPrice,
} from '../services/supplierYearPrice';
import type {
  SupplierYearPriceRecord,
  SupplierYearPriceCreatePayload,
  SupplierYearPriceUpdatePayload,
} from '../services/supplierYearPrice';

/* ── 新增/编辑弹窗 ──────────────────────────── */

interface ModalProps {
  open: boolean;
  editingRecord: SupplierYearPriceRecord | null;
  onClose: () => void;
  onSave: (values: SupplierYearPriceCreatePayload | SupplierYearPriceUpdatePayload) => Promise<void>;
}

const YearPriceFormModal: React.FC<ModalProps> = ({ open, editingRecord, onClose, onSave }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue(editingRecord);
      } else {
        form.resetFields();
      }
    }
  }, [open, editingRecord, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
      message.success(editingRecord ? '修改成功' : '新增成功');
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;

      message.error(error?.message || '操作失败，请重试');
    }
  };

  return (
    <Modal
      title={editingRecord ? '编辑年度单价' : '新增年度单价'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
      width={640}
    >
      <Form form={form} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} style={{ marginTop: 16 }}>
        <Form.Item name="year" label="年度" rules={[{ required: true, message: '请输入年度' }]}>
          <InputNumber style={{ width: '100%' }} min={2000} max={2099} precision={0} placeholder="如 2026" />
        </Form.Item>
        <Form.Item name="laborer_unit_price" label="普工单价（元/人天）">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="technician_unit_price" label="技工单价（元/人天）">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="senior_technician_unit_price" label="高级技工单价（元/人天）">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="special_work_type" label="特种作业工种">
          <Input placeholder="如：电焊、高空" maxLength={100} />
        </Form.Item>
        <Form.Item name="special_work_price" label="特种作业单价（元/人天）">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="comprehensive_unit_price" label="综合单价（元/人天）">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="可选备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/* ── 抽屉主组件 ─────────────────────────────── */

interface Props {
  open: boolean;
  vendorId: string;
  vendorName: string;
  onClose: () => void;
}

const SupplierPriceDrawer: React.FC<Props> = ({ open, vendorId, vendorName, onClose }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SupplierYearPriceRecord | null>(null);

  const columns: ProColumns<SupplierYearPriceRecord>[] = [
    { title: '序号', valueType: 'indexBorder', width: 60 },
    { title: '年度', dataIndex: 'year', width: 70 },
    {
      title: '普工单价', dataIndex: 'laborer_unit_price', width: 100, valueType: 'money', search: false,
      render: (_, r) => r.laborer_unit_price != null ? `¥${r.laborer_unit_price.toLocaleString()}` : '-',
    },
    {
      title: '技工单价', dataIndex: 'technician_unit_price', width: 100, valueType: 'money', search: false,
      render: (_, r) => r.technician_unit_price != null ? `¥${r.technician_unit_price.toLocaleString()}` : '-',
    },
    {
      title: '高级技工单价', dataIndex: 'senior_technician_unit_price', width: 110, valueType: 'money', search: false,
      render: (_, r) => r.senior_technician_unit_price != null ? `¥${r.senior_technician_unit_price.toLocaleString()}` : '-',
    },
    {
      title: '特种作业', dataIndex: 'special_work_type', width: 100, search: false,
      render: (_, r) => r.special_work_type || '-',
    },
    {
      title: '综合单价', dataIndex: 'comprehensive_unit_price', width: 100, valueType: 'money', search: false,
      render: (_, r) => r.comprehensive_unit_price != null ? `¥${r.comprehensive_unit_price.toLocaleString()}` : '-',
    },
    { title: '备注', dataIndex: 'remark', width: 160, ellipsis: true, search: false },
    {
      title: '操作', width: 130, fixed: 'right' as const, search: false,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingRecord(record); setModalOpen(true); }}>编辑</Button>
          <Popconfirm title="确认删除" description={`删除${record.year}年单价？`} onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => { setEditingRecord(null); setModalOpen(true); };

  const handleSave = async (values: SupplierYearPriceCreatePayload | SupplierYearPriceUpdatePayload) => {
    if (editingRecord) {
      await updateSupplierYearPrice(vendorId, editingRecord.id, values as SupplierYearPriceUpdatePayload);
    } else {
      await createSupplierYearPrice(vendorId, values as SupplierYearPriceCreatePayload);
    }
    actionRef.current?.reload();
  };

  const handleDelete = async (priceId: string) => {
    await deleteSupplierYearPrice(vendorId, priceId);
    message.success('删除成功');
    actionRef.current?.reload();
  };

  return (
    <>
      <Drawer
        title={<span>供应商年度单价 — <Tag color="blue">{vendorName}</Tag></span>}
        open={open} onClose={onClose} width={960} destroyOnHidden
      >
        <ProTable<SupplierYearPriceRecord>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          params={[vendorId]}
          request={async (params) => {
            const { current, pageSize } = params;
            const res = await fetchSupplierYearPrices(vendorId, current ?? 1, pageSize ?? 20);
            return { data: res.items, total: res.total, success: true };
          }}
          search={false}
          toolBarRender={() => [
            <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增年度单价</Button>,
          ]}
          pagination={{ showSizeChanger: true, defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'] }}
        />
      </Drawer>
      <YearPriceFormModal open={modalOpen} editingRecord={editingRecord} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </>
  );
};

export default SupplierPriceDrawer;