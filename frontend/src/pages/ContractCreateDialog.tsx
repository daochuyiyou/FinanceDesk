// @ts-nocheck
/**
 * 合同新增/编辑弹窗表单
 *
 * BDD-01 F1.1 H1: 从 ProjectModal 重命名为 ContractCreateDialog
 * - 合同类型（单项/框架）动态切换显示隐藏字段
 * - 合同编号保存前 trim() + upper() 标准化
 * - 保存后不自动创建订单
 */

import React, { useEffect, useState } from 'react';
import { Modal, Form, App, InputNumber, Typography } from 'antd';
import {
  ProFormText,
  ProFormDatePicker,
  ProFormSelect,
  ProFormTextArea,
  ProFormDigit,
  ProFormRadio,
  ProForm,
} from '@ant-design/pro-components';
import dayjs from 'dayjs';
import type {
  ProjectRecord,
  ProjectCreatePayload,
  ProjectUpdatePayload,
} from '../services/project';

const { Text } = Typography;

interface Props {
  open: boolean;
  editingRecord: ProjectRecord | null;
  onClose: () => void;
  onSave: (values: ProjectCreatePayload | ProjectUpdatePayload) => Promise<void>;
}

/** 日期字段名列表 */
const DATE_FIELDS = ['sign_date', 'start_date', 'end_date'] as const;

const ContractCreateDialog: React.FC<Props> = ({ open, editingRecord, onClose, onSave }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!editingRecord;
  const [contractType, setContractType] = useState<string>('框架合同');

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue(editingRecord);
        setContractType(editingRecord.contract_type || '框架合同');
      } else {
        form.resetFields();
        form.setFieldsValue({
          contract_type: '框架合同',
          internal_or_external: '集团内',
          project_type: '其他',
          status: '待执行',
        });
        setContractType('框架合同');
      }
    }
  }, [open, editingRecord, form]);

  const handleTypeChange = (e: any) => {
    const val = e?.target?.value || e;
    setContractType(val);
    if (val === '单项合同') {
      form.setFieldsValue({ framework_parent: undefined });
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // H2: 合同编号标准化 — trim() + upper()
      if (values.contract_no) {
        values.contract_no = String(values.contract_no).trim().toUpperCase();
      }

      // 日期格式化
      for (const field of DATE_FIELDS) {
        if (values[field]) {
          const d = dayjs(values[field]);
          values[field] = d.isValid() ? d.format('YYYY-MM-DD') : values[field];
        }
      }

      // 合同年度默认取签订日期年份
      if (!values.contract_year && values.sign_date) {
        const d = dayjs(values.sign_date);
        if (d.isValid()) values.contract_year = d.year();
      }

      // 框架合同模式下清除不必要的字段
      if (values.contract_type === '单项合同') {
        delete values.framework_parent;
      }

      await onSave(values);
      message.success(isEdit ? '修改成功' : '合同创建成功');
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.message || '操作失败，请重试');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑合同' : '新增合同'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
      width={720}
    >
      <ProForm form={form} submitter={false} style={{ marginTop: 16 }}>
        {/* ── 基本信息 ── */}
        <Text strong style={{ display: 'block', marginBottom: 8 }}>基本信息</Text>

        <ProFormText
          name="contract_no"
          label="合同编号"
          placeholder="请输入合同编号（新增必填，自动转大写）"
          rules={[
            { required: !isEdit, message: '请输入合同编号' },
            { max: 100, message: '最多100个字符' },
          ]}
          fieldProps={{ maxLength: 100 }}
        />

        <ProFormText
          name="framework_name"
          label="合同名称"
          placeholder="请输入合同名称"
          rules={[{ required: true, message: '请输入合同名称' }]}
          fieldProps={{ maxLength: 200 }}
        />

        <ProFormRadio.Group
          name="contract_type"
          label="合同类型"
          options={[
            { label: '框架合同', value: '框架合同' },
            { label: '单项合同', value: '单项合同' },
          ]}
          fieldProps={{ onChange: handleTypeChange }}
          rules={[{ required: true, message: '请选择合同类型' }]}
        />

        {contractType === '框架合同' && (
          <ProFormText
            name="framework_parent"
            label="所属框架"
            placeholder="选择或输入所属框架名称"
            fieldProps={{ maxLength: 200 }}
          />
        )}

        {/* ── 业主信息 ── */}
        <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>业主信息</Text>

        <ProFormText
          name="owner_name"
          label="业主单位"
          placeholder="请输入业主单位名称"
          rules={[{ required: true, message: '请输入业主单位' }]}
          fieldProps={{ maxLength: 200 }}
        />
        <ProFormText name="owner_contact" label="联系人" placeholder="可选" fieldProps={{ maxLength: 100 }} />
        <ProFormText name="owner_phone" label="联系电话" placeholder="可选" fieldProps={{ maxLength: 50 }} />

        {/* ── 合同金额 ── */}
        <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>金额信息</Text>
        <ProFormDigit name="contract_amount" label="合同金额" placeholder="请输入" min={0} fieldProps={{ precision: 2, prefix: '¥' }} />
        <ProFormDigit name="budget_amount" label="预算金额" placeholder="请输入" min={0} fieldProps={{ precision: 2, prefix: '¥' }} />

        {/* ── 时间信息 ── */}
        <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>时间信息</Text>
        <ProFormDatePicker name="sign_date" label="签订日期" placeholder="请选择" />
        <ProForm.Item label="合同年度" name="contract_year">
          <InputNumber placeholder="默认取签订日期年份" min={2000} max={2100} style={{ width: '100%' }} />
        </ProForm.Item>
        <ProFormDatePicker name="start_date" label="合同开始日期" placeholder="请选择" />
        <ProFormDatePicker name="end_date" label="合同结束日期" placeholder="请选择" />

        {/* ── 组织信息 ── */}
        <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>组织信息</Text>
        <ProFormText name="department" label="所属部门" placeholder="可选" fieldProps={{ maxLength: 100 }} />
        <ProFormText name="manager" label="负责人" placeholder="可选" fieldProps={{ maxLength: 100 }} />

        {/* ── 分类信息 ── */}
        <Text strong style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>分类信息</Text>
        <ProFormSelect
          name="internal_or_external" label="集团内外"
          rules={[{ required: true, message: '请选择' }]}
          options={[{ label: '集团内', value: '集团内' }, { label: '集团外', value: '集团外' }]}
        />
        <ProFormText name="project_type" label="项目类型" placeholder="请输入" fieldProps={{ maxLength: 100 }} />
        <ProFormText name="status" label="合同状态" placeholder="待执行" disabled={isEdit} fieldProps={{ maxLength: 50 }} />

        {/* ── 备注 ── */}
        <ProFormTextArea name="remark" label="备注" placeholder="可选" fieldProps={{ rows: 3, maxLength: 500 }} />
      </ProForm>
    </Modal>
  );
};

export default ContractCreateDialog;
