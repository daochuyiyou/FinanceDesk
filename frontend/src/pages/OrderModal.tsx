// @ts-nocheck
/**
 * 订单新增/编辑弹窗表单
 *
 * 后端字段（POST /api/v1/orders）：
 *   project_id（必填）, supplier_id（必填）, order_no（必填）
 *   order_name?, order_date?, amount（必填）, non_tax_amount?,
 *   erp_no?, mobile_project_no?, order_type?, mobile_contact?, status?
 */

import React, { useEffect } from 'react';
import { Modal, Form, App, Input } from 'antd';
import {
  ProFormText,
  ProFormDatePicker,
  ProFormSelect,
  ProFormDigit,
  ProForm,
} from '@ant-design/pro-components';
import dayjs from 'dayjs';
import DictSelect from '../components/DictSelect';
import type { ProjectRecord } from '../services/project';
import type {
  OrderRecord,
  OrderCreatePayload,
  OrderUpdatePayload,
} from '../services/order';

interface Props {
  open: boolean;
  editingRecord: OrderRecord | null;
  projectList: ProjectRecord[];
  /** 父页面已选中的项目ID，新增时自动填入并禁用选择 */
  defaultProjectId?: string;
  onClose: () => void;
  onSave: (values: OrderCreatePayload | OrderUpdatePayload) => Promise<void>;
}

const ORDER_TYPE_OPTIONS = [
  { label: '工程施工', value: '工程施工' },
  { label: '维护服务', value: '维护服务' },
  { label: '设备采购', value: '设备采购' },
  { label: '其他', value: '其他' },
];

// 状态由系统自动推导，禁止人工设置

const OrderModal: React.FC<Props> = ({
  open,
  editingRecord,
  projectList,
  defaultProjectId,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!editingRecord;

  // 判断是否应该锁定项目选择：新增模式且有默认项目ID
  const shouldLockProject = !isEdit && !!defaultProjectId;

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        // 编辑模式：回填已有数据
        form.setFieldsValue({
          ...editingRecord,
          order_date: editingRecord.order_date ? dayjs(editingRecord.order_date) : null,
        });
      } else {
        // 新增模式：重置表单，若有默认项目ID则预填
        form.resetFields();
        if (defaultProjectId) {
          form.setFieldsValue({ project_id: defaultProjectId });
        }
      }
    }
  }, [open, editingRecord, form, defaultProjectId]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // 日期格式化：order_date → YYYY-MM-DD
      if (values.order_date) {
        values.order_date = dayjs(values.order_date).isValid()
          ? dayjs(values.order_date).format('YYYY-MM-DD')
          : values.order_date;
      }

      await onSave(values);
      message.success(isEdit ? '修改成功' : '新增成功');
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;

      message.error(error?.message || '操作失败，请重试');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑订单' : '新增订单'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
      width={720}
    >
      <ProForm
        form={form}
        submitter={false}
        style={{ marginTop: 16 }}
      >
        {/* 第一行：关联项目 + 关联供应商 */}
        <ProForm.Group>
          <ProFormSelect
            name="project_id"
            label="关联项目（框架合同）"
            rules={[{ required: true, message: '请选择关联项目' }]}
            placeholder="请选择关联项目"
            // 编辑模式或新增时有默认项目ID则禁用选择
            disabled={isEdit || shouldLockProject}
            showSearch
            width="sm"
            options={projectList.map((p) => ({
              value: p.id,
              label: p.framework_name,
            }))}
          />
        </ProForm.Group>

        {/* 第二行：订单编号 + 订单名称 */}
        <ProForm.Group>
          <ProFormText
            name="order_no"
            label="订单编号"
            placeholder="请输入订单编号"
            rules={[{ required: true, message: '请输入订单编号' }]}
            fieldProps={{ maxLength: 100 }}
            width="sm"
          />
          <ProFormText
            name="order_name"
            label="订单名称"
            placeholder="请输入订单名称"
            fieldProps={{ maxLength: 200 }}
            width="sm"
          />
        </ProForm.Group>

        {/* 第三行：金额含税 + 不含税 + 生成订单日期 */}
        <ProForm.Group>
          <ProFormDigit
            name="amount"
            label="订单金额含税（元）"
            rules={[{ required: true, message: '请输入订单金额' }]}
            placeholder="请输入"
            min={0}
            width="sm"
            fieldProps={{ precision: 2 }}
          />
          <ProFormDigit
            name="non_tax_amount"
            label="订单金额不含税（元）"
            placeholder="请输入"
            min={0}
            width="sm"
            fieldProps={{ precision: 2 }}
          />
          <ProFormDatePicker
            name="order_date"
            label="生成订单日期"
            placeholder="请选择"
            width="sm"
          />
        </ProForm.Group>

        {/* 第四行：ERP编号 + 移动项目编号 */}
        <ProForm.Group>
          <ProFormText
            name="erp_no"
            label="智慧工程ERP编号"
            placeholder="如 ERP-2026-001"
            fieldProps={{ maxLength: 100 }}
            width="sm"
          />
          <ProFormText
            name="mobile_project_no"
            label="移动项目编号"
            placeholder="如 CMTT-GX-2026-001"
            fieldProps={{ maxLength: 100 }}
            width="sm"
          />
        </ProForm.Group>

        {/* 第五行：订单类型 + 移动对接人 + 状态 */}
        <ProForm.Group>
          <Form.Item name="order_type" label="订单类型">
            <DictSelect category="order_type" mode="create" placeholder="请选择或输入订单类型" style={{ width: 220 }} />
          </Form.Item>
          <ProFormText
            name="mobile_contact"
            label="移动对接人"
            placeholder="联系人姓名"
            fieldProps={{ maxLength: 100 }}
            width="sm"
          />
          {/* 状态由系统自动推导，禁止人工设置 */}
        </ProForm.Group>
      </ProForm>
    </Modal>
  );
};

export default OrderModal;
