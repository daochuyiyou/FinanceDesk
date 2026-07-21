// @ts-nocheck
/**
 * 供应商新增/编辑弹窗表单
 */

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, App } from 'antd';
import dayjs from 'dayjs';

import type {
  SupplierRecord,
  SupplierCreatePayload,
  SupplierUpdatePayload,
} from '../services/supplier';

interface Props {
  open: boolean;
  editingRecord: SupplierRecord | null; // null → 新增模式
  onClose: () => void;
  onSave: (values: SupplierCreatePayload | SupplierUpdatePayload) => Promise<void>;
}

const layout = { labelCol: { span: 6 }, wrapperCol: { span: 18 } };

const SupplierModal: React.FC<Props> = ({ open, editingRecord, onClose, onSave }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!editingRecord;

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          framework_start_date: editingRecord.framework_start_date
            ? dayjs(editingRecord.framework_start_date)
            : null,
          framework_end_date: editingRecord.framework_end_date
            ? dayjs(editingRecord.framework_end_date)
            : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingRecord, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        framework_start_date: values.framework_start_date
          ? (values.framework_start_date as dayjs.Dayjs).format("YYYY-MM-DD")
          : null,
        framework_end_date: values.framework_end_date
          ? (values.framework_end_date as dayjs.Dayjs).format("YYYY-MM-DD")
          : null,
      };
      await onSave(payload);
      message.success(isEdit ? '修改成功' : '新增成功');
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;

      message.error(error?.message || '操作失败，请重试');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑供应商' : '新增供应商'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
      width={600}
    >
      <Form form={form} {...layout} style={{ marginTop: 16 }}>

        <Form.Item
          name="name"
          label="供应商名称"
          rules={[{ required: true, message: '请输入供应商名称' }]}
        >
          <Input placeholder="请输入供应商名称" maxLength={200} />
        </Form.Item>

        <Form.Item name="framework" label="所属框架">
          <Input placeholder="例如：中移建设框架合同" maxLength={200} />
        </Form.Item>

        <Form.Item
          name="framework_no"
          label="框架编号"
          rules={[{ required: true, message: '请输入框架编号' }]}
        >
          <Input placeholder="请输入框架编号" maxLength={100} />
        </Form.Item>

        <Form.Item name="framework_start_date" label="框架开始时间">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="framework_end_date" label="框架结束时间">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="year" label="年度">
          <InputNumber
            style={{ width: '100%' }}
            placeholder="例如：2026"
            min={2000}
            max={2099}
            precision={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SupplierModal;
