// @ts-nocheck
/**
 * 收款/付款页面 —— 项目选择器 → 订单选择器 → 收入管理/成本执行 双 Tab
 *
 * 页面结构：
 *   ┌─ 项目选择器 ──→ 订单选择器 ─────────────────────┐
 *   ├── Tab: 收入管理 ───────────────────────────────┤
 *   │   ProTable: 收入流水（带状态彩色标签）           │
 *   │   行操作：编辑 / 删除 / 录入回款（级联弹窗）     │
 *   ├── Tab: 成本执行 ───────────────────────────────┤
 *   │   ProTable: 成本流水（带状态彩色标签）           │
 *   │   行操作：编辑 / 删除 / 录入支付（级联弹窗）     │
 *   └────────────────────────────────────────────────┘
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  App,
  Button,
  Space,
  Popconfirm,
  Select,
  Tabs,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Table,
  Descriptions,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  MoneyCollectOutlined,
} from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import DictSelect from '../components/DictSelect';

import { fetchProjects } from '../services/project';
import type { ProjectRecord } from '../services/project';
import {
  fetchOrdersByProject,
  fetchIncomeFlows,
  createIncomeFlow,
  updateIncomeFlow,
  deleteIncomeFlow,
  fetchCostFlows,
  createCostFlow,
  updateCostFlow,
  deleteCostFlow,
  fetchCollections,
  createCollection,
  fetchPayments,
  createPayment,
} from '../services/collection';
import type {
  OrderRecord,
  IncomeFlowRecord,
  IncomeFlowCreatePayload,
  IncomeFlowUpdatePayload,
  CostFlowRecord,
  CostFlowCreatePayload,
  CostFlowUpdatePayload,
  CollectionRecord,
  CollectionCreatePayload,
  PaymentRecord,
  PaymentCreatePayload,
} from '../services/collection';

/* ════════════════════════════════════════════════════════════════
   状态彩色标签
   ════════════════════════════════════════════════════════════════ */

const STATUS_COLORS: Record<string, string> = {
  待回款: 'orange',
  部分回款: 'processing',
  已回款: 'success',
  已作废: 'default',
  待支付: 'orange',
  部分支付: 'processing',
  已支付: 'success',
};

/* ════════════════════════════════════════════════════════════════
   子组件：收入流水编辑弹窗
   ════════════════════════════════════════════════════════════════ */

interface IncomeFlowModalProps {
  open: boolean;
  editingRecord: IncomeFlowRecord | null;
  onClose: () => void;
  onSave: (values: IncomeFlowCreatePayload | IncomeFlowUpdatePayload) => Promise<void>;
}

const IncomeFlowModal: React.FC<IncomeFlowModalProps> = ({
  open,
  editingRecord,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!editingRecord;

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          invoice_date: editingRecord.invoice_date
            ? dayjs(editingRecord.invoice_date)
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
        invoice_date: values.invoice_date
          ? (values.invoice_date as dayjs.Dayjs).format('YYYY-MM-DD')
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
      title={isEdit ? '编辑收入流水' : '新增收入流水'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
      width={640}
    >
      <Form
        form={form}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="invoice_count"
          label="开票次数"
          initialValue={1}
          rules={[{ required: true, message: '请输入开票次数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={1} precision={0} />
        </Form.Item>
        <Form.Item name="tax_rate" label="税率（%）">
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={100}
            precision={2}
            placeholder="如 9.0"
          />
        </Form.Item>
        <Form.Item
          name="taxable_amount"
          label="开票金额含税（元）"
          initialValue={0}
          rules={[{ required: true, message: '请输入含税金额' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item
          name="non_taxable_amount"
          label="开票金额不含税（元）"
          initialValue={0}
          rules={[{ required: true, message: '请输入不含税金额' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item name="invoice_date" label="开票时间">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="invoice_no" label="发票号码">
          <Input placeholder="发票号码" maxLength={200} />
        </Form.Item>
        <Form.Item name="status" label="状态" initialValue="待回款">
          <DictSelect category="income_status" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════
   子组件：成本流水编辑弹窗
   ════════════════════════════════════════════════════════════════ */

interface CostFlowModalProps {
  open: boolean;
  editingRecord: CostFlowRecord | null;
  onClose: () => void;
  onSave: (values: CostFlowCreatePayload | CostFlowUpdatePayload) => Promise<void>;
}

const CostFlowModal: React.FC<CostFlowModalProps> = ({
  open,
  editingRecord,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!editingRecord;

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
      message.success(isEdit ? '修改成功' : '新增成功');
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;

      message.error(error?.message || '操作失败，请重试');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑成本流水' : '新增成本流水'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
      width={640}
    >
      <Form
        form={form}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ marginTop: 16 }}
      >
        <Form.Item name="cost_party" label="成本方">
          <Input placeholder="供应商/个人/内部" maxLength={200} />
        </Form.Item>
        <Form.Item
          name="cost_type"
          label="成本类型"
          initialValue="其他"
          rules={[{ required: true, message: '请选择成本类型' }]}
        >
          <Select>
            <Select.Option value="施工费">施工费</Select.Option>
            <Select.Option value="材料费">材料费</Select.Option>
            <Select.Option value="管理费">管理费</Select.Option>
            <Select.Option value="设备费">设备费</Select.Option>
            <Select.Option value="其他">其他</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="tax_rate" label="税率（%）">
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={100}
            precision={2}
            placeholder="如 9.0"
          />
        </Form.Item>
        <Form.Item
          name="taxable_amount"
          label="成本金额含税（元）"
          initialValue={0}
          rules={[{ required: true, message: '请输入含税金额' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item
          name="non_taxable_amount"
          label="成本金额不含税（元）"
          initialValue={0}
          rules={[{ required: true, message: '请输入不含税金额' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item name="cost_subject" label="成本科目">
          <Input placeholder="成本科目" maxLength={200} />
        </Form.Item>
        <Form.Item name="budget_item" label="对应预算项">
          <Input placeholder="对应预算项" maxLength={200} />
        </Form.Item>
        <Form.Item name="status" label="状态" initialValue="待支付">
          <DictSelect category="cost_status" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════
   子组件：回款录入弹窗（级联关联对应收入流水）
   ════════════════════════════════════════════════════════════════ */

interface CollectionModalProps {
  open: boolean;
  orderId: string;
  incomeFlow: IncomeFlowRecord;
  onClose: () => void;
}

const CollectionModal: React.FC<CollectionModalProps> = ({
  open,
  orderId,
  incomeFlow,
  onClose,
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && incomeFlow) {
      setLoading(true);
      fetchCollections(orderId, incomeFlow.id)
        .then((res) => setCollections(res.items))
        .finally(() => setLoading(false));
      form.resetFields();
    }
  }, [open, incomeFlow, orderId, form]);

  const handleAddCollection = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        collection_date: values.collection_date
          ? (values.collection_date as dayjs.Dayjs).format('YYYY-MM-DD')
          : null,
      };
      await createCollection(orderId, incomeFlow.id, payload);
      message.success('回款录入成功');
      form.resetFields();
      // 刷新回款列表
      const res = await fetchCollections(orderId, incomeFlow.id);
      setCollections(res.items);
    } catch (error: any) {
      if (error?.errorFields) return;

      message.error(error?.message || '操作失败，请重试');
    }
  };

  const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);
  const remaining = (incomeFlow.taxable_amount ?? 0) - totalCollected;

  const colColumns = [
    { title: '回款日期', dataIndex: 'collection_date', width: 110 },
    { title: '金额（元）', dataIndex: 'amount', width: 120 },
    { title: '收款凭证号', dataIndex: 'receipt_no', ellipsis: true },
  ];

  return (
    <Modal
      title={`回款录入 — ${incomeFlow.invoice_no || String(incomeFlow.id).slice(0, 8)}`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={700}
      destroyOnHidden
    >
      <Descriptions column={3} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="发票号码">{incomeFlow.invoice_no || '-'}</Descriptions.Item>
        <Descriptions.Item label="含税金额">
          ¥{(incomeFlow.taxable_amount ?? 0).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={STATUS_COLORS[incomeFlow.status] || 'default'}>
            {incomeFlow.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="已回款合计">
          <span style={{ color: '#52c41a', fontWeight: 600 }}>
            ¥{totalCollected.toLocaleString()}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="未回款">
          <span
            style={{
              color: remaining > 0 ? '#ff4d4f' : '#52c41a',
              fontWeight: 600,
            }}
          >
            ¥{remaining.toLocaleString()}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="开票日期">{incomeFlow.invoice_date || '-'}</Descriptions.Item>
      </Descriptions>

      <Divider>已有回款记录</Divider>
      <Table
        rowKey="id"
        columns={colColumns}
        dataSource={collections}
        loading={loading}
        pagination={false}
        size="small"
        locale={{ emptyText: '暂无回款记录' }}
        style={{ marginBottom: 16 }}
      />

      <Divider>录入新回款</Divider>
      <Form form={form} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
        <Form.Item name="collection_date" label="日期">
          <DatePicker />
        </Form.Item>
        <Form.Item
          name="amount"
          label="金额"
          rules={[
            { required: true, message: '必填' },
            { type: 'number', min: 0.01, message: '金额必须大于0' },
          ]}
        >
          <InputNumber precision={2} min={0.01} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="receipt_no" label="凭证号">
          <Input placeholder="收款凭证号" maxLength={200} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" icon={<MoneyCollectOutlined />} onClick={handleAddCollection}>
            保存回款
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════
   子组件：支付录入弹窗（级联关联对应成本流水）
   ════════════════════════════════════════════════════════════════ */

interface PaymentModalProps {
  open: boolean;
  orderId: string;
  costFlow: CostFlowRecord;
  onClose: () => void;
}

const PaymentModalComponent: React.FC<PaymentModalProps> = ({
  open,
  orderId,
  costFlow,
  onClose,
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && costFlow) {
      setLoading(true);
      fetchPayments(orderId, costFlow.id)
        .then((res) => setPayments(res.items))
        .finally(() => setLoading(false));
      form.resetFields();
    }
  }, [open, costFlow, orderId, form]);

  const handleAddPayment = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        payment_date: values.payment_date
          ? (values.payment_date as dayjs.Dayjs).format('YYYY-MM-DD')
          : null,
      };
      await createPayment(orderId, costFlow.id, payload);
      message.success('支付录入成功');
      form.resetFields();
      const res = await fetchPayments(orderId, costFlow.id);
      setPayments(res.items);
    } catch (error: any) {
      if (error?.errorFields) return;

      message.error(error?.message || '操作失败，请重试');
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = (costFlow.taxable_amount ?? 0) - totalPaid;

  const pmtColumns = [
    { title: '支付日期', dataIndex: 'payment_date', width: 110 },
    { title: '金额（元）', dataIndex: 'amount', width: 120 },
    { title: '支付对象', dataIndex: 'payee', ellipsis: true },
    { title: '支付凭证', dataIndex: 'voucher_no', ellipsis: true },
  ];

  return (
    <Modal
      title={`支付录入 — ${costFlow.cost_type}（${costFlow.cost_party || '未指定'}）`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={700}
      destroyOnHidden
    >
      <Descriptions column={3} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="成本类型">{costFlow.cost_type}</Descriptions.Item>
        <Descriptions.Item label="含税金额">
          ¥{(costFlow.taxable_amount ?? 0).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={STATUS_COLORS[costFlow.status] || 'default'}>
            {costFlow.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="已支付合计">
          <span style={{ color: '#52c41a', fontWeight: 600 }}>
            ¥{totalPaid.toLocaleString()}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="未支付">
          <span
            style={{
              color: remaining > 0 ? '#ff4d4f' : '#52c41a',
              fontWeight: 600,
            }}
          >
            ¥{remaining.toLocaleString()}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="成本方">{costFlow.cost_party || '-'}</Descriptions.Item>
      </Descriptions>

      <Divider>已有支付记录</Divider>
      <Table
        rowKey="id"
        columns={pmtColumns}
        dataSource={payments}
        loading={loading}
        pagination={false}
        size="small"
        locale={{ emptyText: '暂无支付记录' }}
        style={{ marginBottom: 16 }}
      />

      <Divider>录入新支付</Divider>
      <Form form={form} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
        <Form.Item name="payment_date" label="日期">
          <DatePicker />
        </Form.Item>
        <Form.Item
          name="amount"
          label="金额"
          rules={[
            { required: true, message: '必填' },
            { type: 'number', min: 0.01, message: '金额必须大于0' },
          ]}
        >
          <InputNumber precision={2} min={0.01} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="payee" label="支付对象">
          <Input placeholder="收款方" maxLength={200} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="voucher_no" label="凭证号">
          <Input placeholder="支付凭证" maxLength={200} style={{ width: 140 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" icon={<DollarOutlined />} onClick={handleAddPayment}>
            保存支付
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════
   主页面
   ════════════════════════════════════════════════════════════════ */

const CollectionPage: React.FC = () => {
  const { message } = App.useApp();

  /* ── 项目 / 订单选择 ────────────────────── */
  const [projectList, setProjectList] = useState<ProjectRecord[]>([]);
  const [orderList, setOrderList] = useState<OrderRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();

  useEffect(() => {
    fetchProjects(1, 200).then((res) => setProjectList(res.items));
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchOrdersByProject(selectedProjectId).then(setOrderList);
    } else {
      setOrderList([]);
    }
    setSelectedOrderId(undefined);
  }, [selectedProjectId]);

  /* ── 收入流水状态 ────────────────────────── */
  const incomeActionRef = useRef<ActionType>(null);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [incomeEditRecord, setIncomeEditRecord] = useState<IncomeFlowRecord | null>(null);

  /* ── 成本流水状态 ────────────────────────── */
  const costActionRef = useRef<ActionType>(null);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [costEditRecord, setCostEditRecord] = useState<CostFlowRecord | null>(null);

  /* ── 回款 / 支付弹窗状态 ────────────────── */
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionTarget, setCollectionTarget] = useState<IncomeFlowRecord | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<CostFlowRecord | null>(null);

  /* ══════════════════════════════════════════════
     收入流水表格
     ══════════════════════════════════════════════ */

  const incomeColumns: ProColumns<IncomeFlowRecord>[] = [
    { title: '序号', valueType: 'indexBorder', width: 60 },
    {
      title: '开票次数',
      dataIndex: 'invoice_count',
      width: 80,
      search: false,
    },
    {
      title: '税率',
      dataIndex: 'tax_rate',
      width: 70,
      search: false,
      render: (_, r) => (r.tax_rate != null ? `${r.tax_rate}%` : '-'),
    },
    {
      title: '含税金额（元）',
      dataIndex: 'taxable_amount',
      width: 130,
      valueType: 'money',
      search: false,
    },
    {
      title: '不含税金额（元）',
      dataIndex: 'non_taxable_amount',
      width: 130,
      valueType: 'money',
      search: false,
    },
    {
      title: '开票时间',
      dataIndex: 'invoice_date',
      valueType: 'date',
      width: 110,
    },
    {
      title: '发票号码',
      dataIndex: 'invoice_no',
      width: 160,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, r) => (
        <Tag color={STATUS_COLORS[r.status] || 'default'}>{r.status}</Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 150,
      ellipsis: true,
      search: false,
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<MoneyCollectOutlined />}
            onClick={() => {
              setCollectionTarget(record);
              setCollectionModalOpen(true);
            }}
          >
            回款
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setIncomeEditRecord(record);
              setIncomeModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定删除此收入流水？`}
            onConfirm={() => handleDeleteIncome(record.id)}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleDeleteIncome = async (flowId: string) => {
    if (!selectedOrderId) return;
    await deleteIncomeFlow(selectedOrderId, flowId);
    message.success('删除成功');
    incomeActionRef.current?.reload();
  };

  const handleSaveIncome = async (
    values: IncomeFlowCreatePayload | IncomeFlowUpdatePayload,
  ) => {
    if (!selectedOrderId) return;
    if (incomeEditRecord) {
      await updateIncomeFlow(
        selectedOrderId,
        incomeEditRecord.id,
        values as IncomeFlowUpdatePayload,
      );
    } else {
      await createIncomeFlow(selectedOrderId, values as IncomeFlowCreatePayload);
    }
    incomeActionRef.current?.reload();
  };

  /* ══════════════════════════════════════════════
     成本流水表格
     ══════════════════════════════════════════════ */

  const costColumns: ProColumns<CostFlowRecord>[] = [
    { title: '序号', valueType: 'indexBorder', width: 60 },
    {
      title: '成本方',
      dataIndex: 'cost_party',
      width: 140,
      ellipsis: true,
    },
    {
      title: '成本类型',
      dataIndex: 'cost_type',
      width: 100,
    },
    {
      title: '税率',
      dataIndex: 'tax_rate',
      width: 70,
      search: false,
      render: (_, r) => (r.tax_rate != null ? `${r.tax_rate}%` : '-'),
    },
    {
      title: '含税金额（元）',
      dataIndex: 'taxable_amount',
      width: 130,
      valueType: 'money',
      search: false,
    },
    {
      title: '不含税金额（元）',
      dataIndex: 'non_taxable_amount',
      width: 130,
      valueType: 'money',
      search: false,
    },
    {
      title: '成本科目',
      dataIndex: 'cost_subject',
      width: 120,
      ellipsis: true,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, r) => (
        <Tag color={STATUS_COLORS[r.status] || 'default'}>{r.status}</Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 150,
      ellipsis: true,
      search: false,
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => {
              setPaymentTarget(record);
              setPaymentModalOpen(true);
            }}
          >
            支付
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setCostEditRecord(record);
              setCostModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定删除此成本流水？`}
            onConfirm={() => handleDeleteCost(record.id)}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleDeleteCost = async (flowId: string) => {
    if (!selectedOrderId) return;
    await deleteCostFlow(selectedOrderId, flowId);
    message.success('删除成功');
    costActionRef.current?.reload();
  };

  const handleSaveCost = async (
    values: CostFlowCreatePayload | CostFlowUpdatePayload,
  ) => {
    if (!selectedOrderId) return;
    if (costEditRecord) {
      await updateCostFlow(
        selectedOrderId,
        costEditRecord.id,
        values as CostFlowUpdatePayload,
      );
    } else {
      await createCostFlow(selectedOrderId, values as CostFlowCreatePayload);
    }
    costActionRef.current?.reload();
  };

  /* ══════════════════════════════════════════════
     渲染
     ══════════════════════════════════════════════ */

  const selectedProject = projectList.find((p) => p.id === selectedProjectId);
  const selectedOrder = orderList.find((o) => o.id === selectedOrderId);

  const tabItems = [
    {
      key: 'income',
      label: '收入管理',
      children: (
        <>
          <ProTable<IncomeFlowRecord>
            actionRef={incomeActionRef}
            rowKey="id"
            columns={incomeColumns}
            params={[selectedOrderId]}
            request={async (params) => {
              if (!selectedOrderId) {
                return { data: [], total: 0, success: true };
              }
              const { current, pageSize } = params;
              const res = await fetchIncomeFlows(
                selectedOrderId,
                current ?? 1,
                pageSize ?? 20,
              );
              return { data: res.items, total: res.total, success: true };
            }}
            search={{ labelWidth: 'auto', defaultCollapsed: true }}
            toolBarRender={() => [
              <Button
                key="add"
                type="primary"
                icon={<PlusOutlined />}
                disabled={!selectedOrderId}
                onClick={() => {
                  setIncomeEditRecord(null);
                  setIncomeModalOpen(true);
                }}
              >
                新增收入流水
              </Button>,
            ]}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              defaultPageSize: 20,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
          />
          <IncomeFlowModal
            open={incomeModalOpen}
            editingRecord={incomeEditRecord}
            onClose={() => setIncomeModalOpen(false)}
            onSave={handleSaveIncome}
          />
        </>
      ),
    },
    {
      key: 'cost',
      label: '成本执行',
      children: (
        <>
          <ProTable<CostFlowRecord>
            actionRef={costActionRef}
            rowKey="id"
            columns={costColumns}
            params={[selectedOrderId]}
            request={async (params) => {
              if (!selectedOrderId) {
                return { data: [], total: 0, success: true };
              }
              const { current, pageSize } = params;
              const res = await fetchCostFlows(
                selectedOrderId,
                current ?? 1,
                pageSize ?? 20,
              );
              return { data: res.items, total: res.total, success: true };
            }}
            search={{ labelWidth: 'auto', defaultCollapsed: true }}
            toolBarRender={() => [
              <Button
                key="add"
                type="primary"
                icon={<PlusOutlined />}
                disabled={!selectedOrderId}
                onClick={() => {
                  setCostEditRecord(null);
                  setCostModalOpen(true);
                }}
              >
                新增成本流水
              </Button>,
            ]}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              defaultPageSize: 20,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
          />
          <CostFlowModal
            open={costModalOpen}
            editingRecord={costEditRecord}
            onClose={() => setCostModalOpen(false)}
            onSave={handleSaveCost}
          />
        </>
      ),
    },
  ];

  return (
    <div>
      {/* 级联选择器 */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>项目：</span>
        <Select
          style={{ width: 280 }}
          placeholder="选择项目"
          showSearch
          allowClear
          value={selectedProjectId}
          onChange={(val) => setSelectedProjectId(val)}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={projectList.map((p) => ({
            value: p.id,
            label: p.framework_name,
          }))}
        />

        <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
          订单：
        </span>
        <Select
          style={{ width: 260 }}
          placeholder={selectedProjectId ? '选择订单' : '请先选择项目'}
          showSearch
          allowClear
          value={selectedOrderId}
          disabled={!selectedProjectId}
          onChange={(val) => {
            setSelectedOrderId(val);
            incomeActionRef.current?.reload();
            costActionRef.current?.reload();
          }}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={orderList.map((o) => ({
            value: o.id,
            label: `${o.order_no}（¥${(o.amount ?? 0).toLocaleString()}）`,
          }))}
        />

        {selectedProject && (
          <span style={{ color: '#888', fontSize: 13 }}>
            {selectedProject.framework_name}
          </span>
        )}
        {selectedOrder && (
          <span style={{ color: '#888', fontSize: 13 }}>
            订单金额 ¥{(selectedOrder.amount ?? 0).toLocaleString()}
          </span>
        )}
      </div>

      {selectedOrderId ? (
        <Tabs defaultActiveKey="income" items={tabItems} />
      ) : (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: '#bbb',
            fontSize: 15,
          }}
        >
          请先选择项目和订单
        </div>
      )}

      {/* 回款录入弹窗 */}
      {collectionTarget && (
        <CollectionModal
          open={collectionModalOpen}
          orderId={selectedOrderId!}
          incomeFlow={collectionTarget}
          onClose={() => {
            setCollectionModalOpen(false);
            setCollectionTarget(null);
            incomeActionRef.current?.reload();
          }}
        />
      )}

      {/* 支付录入弹窗 */}
      {paymentTarget && (
        <PaymentModalComponent
          open={paymentModalOpen}
          orderId={selectedOrderId!}
          costFlow={paymentTarget}
          onClose={() => {
            setPaymentModalOpen(false);
            setPaymentTarget(null);
            costActionRef.current?.reload();
          }}
        />
      )}
    </div>
  );
};

export default CollectionPage;
