/**
 * 预算管理页面 —— 项目选择器 + 预算编制/预算调整 两个 Tab
 *
 * 页面结构：
 *   ┌─ 项目选择器（Select）──────────────┐
 *   ├── Tab: 预算编制 ───────────────────┤
 *   │   Table + 新增/编辑/删除 + 导出  │
 *   ├── Tab: 预算调整 ───────────────────┤
 *   │   Table + 新增/编辑/删除 + 导出  │
 *   └────────────────────────────────────┘
 */

import React, { useEffect, useState } from 'react';
import {
  App,
  Button,
  Space,
  Popconfirm,
  Select,
  Tabs,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
} from '@ant-design/icons';

import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

import { fetchProjects } from '../services/project';
import type { ProjectRecord } from '../services/project';
import {
  fetchBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  fetchAdjustments,
  createAdjustment,
  updateAdjustment,
  deleteAdjustment,
} from '../services/budget';
import type {
  BudgetRecord,
  BudgetCreatePayload,
  BudgetUpdatePayload,
  AdjustmentRecord,
  AdjustmentCreatePayload,
  AdjustmentUpdatePayload,
} from '../services/budget';

import ProResizableTable from '../components/ProResizableTable';
import { renderLongText } from '../utils/renderLongText';

/* ════════════════════════════════════════════════════════════════
   子组件：预算编制弹窗
   ════════════════════════════════════════════════════════════════ */

interface BudgetFormModalProps {
  open: boolean;
  editingRecord: BudgetRecord | null;
  onClose: () => void;
  onSave: (values: BudgetCreatePayload | BudgetUpdatePayload) => Promise<void>;
}

const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  open,
  editingRecord,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!editingRecord;
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          preparation_date: editingRecord.preparation_date
            ? dayjs(editingRecord.preparation_date)
            : null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ preparation_date: dayjs() });
      }
      setShowAdvanced(false);
    }
  }, [open, editingRecord, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        preparation_date: values.preparation_date
          ? (values.preparation_date as dayjs.Dayjs).format('YYYY-MM-DD')
          : null,
      };
      await onSave(payload);
      message.success(isEdit ? '修改成功' : '新增成功');
      onClose();
    } catch (error: unknown) {
      const err = error as { errorFields?: unknown; message?: string };
      if (err?.errorFields) return;
      message.error(err?.message || '操作失败，请重试');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑预算编制' : '新增预算编制'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
      width={600}
    >
      <Form
        form={form}
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        style={{ marginTop: 16 }}
      >
        <Form.Item name="budget_type" label="预算类型" initialValue="初始预算">
          <Select>
            <Select.Option value="初始预算">初始预算</Select.Option>
            <Select.Option value="调整预算">调整预算</Select.Option>
            <Select.Option value="结算预算">结算预算</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="labor_budget"
          label="人工费预算（元）"
          initialValue={0}
          rules={[{ required: true, message: '请输入人工费预算' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item
          name="material_budget"
          label="材料费预算（元）"
          initialValue={0}
          rules={[{ required: true, message: '请输入材料费预算' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        
        <div style={{ marginBottom: 16 }}>
          <Button type="link" onClick={() => setShowAdvanced(!showAdvanced)} style={{ padding: 0 }}>
            {showAdvanced ? '收起高级信息' : '展开高级信息'}
          </Button>
        </div>
        
        {showAdvanced && (
          <div>
            <Form.Item
              name="management_budget"
              label="管理费预算（元）"
              initialValue={0}
              rules={[{ required: true, message: '请输入管理费预算' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item name="gross_margin_rate" label="成本管控毛利率（%）">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                precision={2}
                placeholder="例如 15.5"
              />
            </Form.Item>
            <Form.Item name="preparation_date" label="编制日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="preparer" label="编制人">
              <Input placeholder="编制人姓名" maxLength={100} />
            </Form.Item>
          </div>
        )}
      </Form>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════
   子组件：预算调整弹窗
   ════════════════════════════════════════════════════════════════ */

interface AdjustmentFormModalProps {
  open: boolean;
  editingRecord: AdjustmentRecord | null;
  onClose: () => void;
  onSave: (values: AdjustmentCreatePayload | AdjustmentUpdatePayload) => Promise<void>;
}

const AdjustmentFormModal: React.FC<AdjustmentFormModalProps> = ({
  open,
  editingRecord,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!editingRecord;
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          adjustment_date: editingRecord.adjustment_date
            ? dayjs(editingRecord.adjustment_date)
            : null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ adjustment_date: dayjs() });
      }
      setShowAdvanced(false);
    }
  }, [open, editingRecord, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        adjustment_date: values.adjustment_date
          ? (values.adjustment_date as dayjs.Dayjs).format('YYYY-MM-DD')
          : null,
      };
      await onSave(payload);
      message.success(isEdit ? '修改成功' : '新增成功');
      onClose();
    } catch (error: unknown) {
      const err = error as { errorFields?: unknown; message?: string };
      if (err?.errorFields) return;
      message.error(err?.message || '操作失败，请重试');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑预算调整' : '新增预算调整'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
      width={600}
    >
      <Form
        form={form}
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        style={{ marginTop: 16 }}
      >
        <Form.Item name="adjustment_date" label="调整日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="adjustment_reason" label="调整原因">
          <Input.TextArea placeholder="描述调整原因" maxLength={500} rows={3} />
        </Form.Item>
        <Form.Item
          name="adjustment_amount"
          label="调整金额（元）"
          rules={[{ required: true, message: '请输入调整金额' }]}
          initialValue={0}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="正数=调增，负数=调减"
            precision={2}
          />
        </Form.Item>
        
        <div style={{ marginBottom: 16 }}>
          <Button type="link" onClick={() => setShowAdvanced(!showAdvanced)} style={{ padding: 0 }}>
            {showAdvanced ? '收起高级信息' : '展开高级信息'}
          </Button>
        </div>
        
        {showAdvanced && (
          <div>
            <Form.Item name="remark" label="备注">
              <Input.TextArea placeholder="可选备注" rows={2} />
            </Form.Item>
          </div>
        )}
      </Form>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════
   主页面
   ════════════════════════════════════════════════════════════════ */

const BudgetPage: React.FC = () => {
  const { message } = App.useApp();

  /* ── 项目选择 ────────────────────────────── */
  const [projectList, setProjectList] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

  useEffect(() => {
    fetchProjects(1, 200).then((res) => setProjectList(res.items));
  }, []);

  /* ── 预算编制状态 ────────────────────────── */
  const [budgetData, setBudgetData] = useState<BudgetRecord[]>([]);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetTotal, setBudgetTotal] = useState(0);
  const [budgetPage, setBudgetPage] = useState(1);
  const [budgetPageSize, setBudgetPageSize] = useState(20);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetEditRecord, setBudgetEditRecord] = useState<BudgetRecord | null>(null);

  /* ── 预算调整状态 ────────────────────────── */
  const [adjData, setAdjData] = useState<AdjustmentRecord[]>([]);
  const [adjLoading, setAdjLoading] = useState(false);
  const [adjTotal, setAdjTotal] = useState(0);
  const [adjPage, setAdjPage] = useState(1);
  const [adjPageSize, setAdjPageSize] = useState(20);
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjEditRecord, setAdjEditRecord] = useState<AdjustmentRecord | null>(null);

  /* ── 数据加载 ─────────────────────────────── */
  const loadBudgets = async (page: number = budgetPage, pageSize: number = budgetPageSize) => {
    if (!selectedProjectId) return;
    setBudgetLoading(true);
    try {
      const res = await fetchBudgets(selectedProjectId, page, pageSize);
      setBudgetData(res.items);
      setBudgetTotal(res.total);
    } finally {
      setBudgetLoading(false);
    }
  };

  const loadAdjustments = async (page: number = adjPage, pageSize: number = adjPageSize) => {
    if (!selectedProjectId) return;
    setAdjLoading(true);
    try {
      const res = await fetchAdjustments(selectedProjectId, page, pageSize);
      setAdjData(res.items);
      setAdjTotal(res.total);
    } finally {
      setAdjLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      setBudgetPage(1);
      setAdjPage(1);
      loadBudgets(1, budgetPageSize);
      loadAdjustments(1, adjPageSize);
    } else {
      setBudgetData([]);
      setAdjData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  /* ══════════════════════════════════════════════
     预算编制表格
     ══════════════════════════════════════════════ */

  const budgetColumns: TableProps<BudgetRecord>['columns'] = [
    {
      title: '项目名称',
      dataIndex: 'project_id',
      width: 180,
      ellipsis: true,
      render: (_: unknown, record: BudgetRecord) => {
        const p = projectList.find(x => x.id === record.project_id);
        return p ? p.framework_name : '-';
      },
    },
    {
      title: '预算类型',
      dataIndex: 'budget_type',
      width: 110,
    },
    {
      title: '人工费预算',
      dataIndex: 'labor_budget',
      width: 120,
    },
    {
      title: '材料费预算',
      dataIndex: 'material_budget',
      width: 120,
    },
    {
      title: '管理费预算',
      dataIndex: 'management_budget',
      width: 120,
    },
    {
      title: '毛利率（%）',
      dataIndex: 'gross_margin_rate',
      width: 110,
      render: (_: unknown, r: BudgetRecord) =>
        r.gross_margin_rate != null ? `${r.gross_margin_rate}%` : '-',
    },
    {
      title: '编制日期',
      dataIndex: 'preparation_date',
      width: 110,
    },
    {
      title: '编制人',
      dataIndex: 'preparer',
      width: 100,
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: BudgetRecord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setBudgetEditRecord(record);
              setBudgetModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条预算编制记录吗？"
            onConfirm={() => handleDeleteBudget(record.id)}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleDeleteBudget = async (budgetId: string) => {
    if (!selectedProjectId) return;
    await deleteBudget(selectedProjectId, budgetId);
    message.success('删除成功');
    await loadBudgets();
  };

  const handleSaveBudget = async (
    values: BudgetCreatePayload | BudgetUpdatePayload,
  ) => {
    if (!selectedProjectId) return;
    if (budgetEditRecord) {
      await updateBudget(selectedProjectId, budgetEditRecord.id, values as BudgetUpdatePayload);
    } else {
      await createBudget(selectedProjectId, values as BudgetCreatePayload);
    }
    await loadBudgets();
  };

  const exportBudgets = async () => {
    if (!selectedProjectId) return;
    const { items } = await fetchBudgets(selectedProjectId, 1, 200);
    const data = items.map((r) => {
      const p = projectList.find(x => x.id === r.project_id);
      return {
        项目名称: p ? p.framework_name : r.project_id,
        预算类型: r.budget_type,
        人工费: r.labor_budget,
        材料费: r.material_budget,
        管理费: r.management_budget,
        毛利率: r.gross_margin_rate != null ? `${r.gross_margin_rate}%` : '',
        编制日期: r.preparation_date ?? '',
        编制人: r.preparer ?? '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '预算编制');
    ws['!cols'] = Object.keys(data[0] ?? {}).map((k) => ({
      wch: Math.max(k.length * 2, 14),
    }));
    XLSX.writeFile(wb, `预算编制_${dayjs().format('YYYYMMDD')}.xlsx`);
    message.success('导出成功');
  };

  /* ══════════════════════════════════════════════
     预算调整表格
     ══════════════════════════════════════════════ */

  const adjColumns: TableProps<AdjustmentRecord>['columns'] = [
    {
      title: '项目名称',
      dataIndex: 'project_id',
      width: 180,
      ellipsis: true,
      render: (_: unknown, record: AdjustmentRecord) => {
        const p = projectList.find(x => x.id === record.project_id);
        return p ? p.framework_name : '-';
      },
    },
    {
      title: '调整日期',
      dataIndex: 'adjustment_date',
      width: 110,
    },
    {
      title: '调整原因',
      dataIndex: 'adjustment_reason',
      width: 240,
      ellipsis: true,
      render: (_: unknown, r: AdjustmentRecord) => renderLongText(r.adjustment_reason),
    },
    {
      title: '调整金额（元）',
      dataIndex: 'adjustment_amount',
      width: 130,
      render: (_: unknown, r: AdjustmentRecord) => (
        <span style={{ color: r.adjustment_amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {r.adjustment_amount >= 0 ? '+' : ''}
          {(r.adjustment_amount ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 180,
      ellipsis: true,
      render: (_: unknown, r: AdjustmentRecord) => renderLongText(r.remark),
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: AdjustmentRecord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setAdjEditRecord(record);
              setAdjModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条预算调整记录吗？"
            onConfirm={() => handleDeleteAdjustment(record.id)}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleDeleteAdjustment = async (adjId: string) => {
    if (!selectedProjectId) return;
    await deleteAdjustment(selectedProjectId, adjId);
    message.success('删除成功');
    await loadAdjustments();
  };

  const handleSaveAdjustment = async (
    values: AdjustmentCreatePayload | AdjustmentUpdatePayload,
  ) => {
    if (!selectedProjectId) return;
    if (adjEditRecord) {
      await updateAdjustment(
        selectedProjectId,
        adjEditRecord.id,
        values as AdjustmentUpdatePayload,
      );
    } else {
      await createAdjustment(selectedProjectId, values as AdjustmentCreatePayload);
    }
    await loadAdjustments();
  };

  const exportAdjustments = async () => {
    if (!selectedProjectId) return;
    const { items } = await fetchAdjustments(selectedProjectId, 1, 200);
    const data = items.map((r) => {
      const p = projectList.find(x => x.id === r.project_id);
      return {
        项目名称: p ? p.framework_name : r.project_id,
        调整日期: r.adjustment_date ?? '',
        调整原因: r.adjustment_reason ?? '',
        调整金额: r.adjustment_amount,
        备注: r.remark ?? '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '预算调整');
    ws['!cols'] = Object.keys(data[0] ?? {}).map((k) => ({
      wch: Math.max(k.length * 2, 14),
    }));
    XLSX.writeFile(wb, `预算调整_${dayjs().format('YYYYMMDD')}.xlsx`);
    message.success('导出成功');
  };

  /* ══════════════════════════════════════════════
     渲染
     ══════════════════════════════════════════════ */

  const selectedProject = projectList.find((p) => p.id === selectedProjectId);

  const tabItems = [
    {
      key: 'budget',
      label: '预算编制',
      children: (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button icon={<ExportOutlined />} onClick={exportBudgets}>
              导出 Excel
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setBudgetEditRecord(null);
                setBudgetModalOpen(true);
              }}
            >
              新增预算编制
            </Button>
          </div>
          <ProResizableTable<BudgetRecord>
            rowKey="id"
            columns={budgetColumns}
            dataSource={budgetData}
            loading={budgetLoading}
            pagination={{
              current: budgetPage,
              pageSize: budgetPageSize,
              total: budgetTotal,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setBudgetPage(page);
                setBudgetPageSize(pageSize);
                loadBudgets(page, pageSize);
              },
            }}
          />
          <BudgetFormModal
            open={budgetModalOpen}
            editingRecord={budgetEditRecord}
            onClose={() => setBudgetModalOpen(false)}
            onSave={handleSaveBudget}
          />
        </>
      ),
    },
    {
      key: 'adjustment',
      label: '预算调整',
      children: (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button icon={<ExportOutlined />} onClick={exportAdjustments}>
              导出 Excel
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setAdjEditRecord(null);
                setAdjModalOpen(true);
              }}
            >
              新增预算调整
            </Button>
          </div>
          <ProResizableTable<AdjustmentRecord>
            rowKey="id"
            columns={adjColumns}
            dataSource={adjData}
            loading={adjLoading}
            pagination={{
              current: adjPage,
              pageSize: adjPageSize,
              total: adjTotal,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setAdjPage(page);
                setAdjPageSize(pageSize);
                loadAdjustments(page, pageSize);
              },
            }}
          />
          <AdjustmentFormModal
            open={adjModalOpen}
            editingRecord={adjEditRecord}
            onClose={() => setAdjModalOpen(false)}
            onSave={handleSaveAdjustment}
          />
        </>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>选择项目：</span>
        <Select
          style={{ width: 360 }}
          placeholder="请选择一个项目查看预算数据"
          showSearch
          allowClear
          value={selectedProjectId}
          onChange={(val) => {
            setSelectedProjectId(val);
          }}
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
            编号: {String(selectedProject?.id || '').slice(0, 8)}…
          </span>
        )}
      </div>

      {selectedProjectId ? (
        <Tabs defaultActiveKey="budget" items={tabItems} />
      ) : (
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
      )}
    </div>
  );
};

export default BudgetPage;
