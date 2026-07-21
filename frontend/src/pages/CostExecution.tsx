/**
 * 成本执行管理 —— 供应商必选模式。
 * 供应商移出高级信息区，设为必选。
 */

import React, { useEffect, useState, useCallback } from 'react';
import { App, Button, Space, Popconfirm, Tag, Modal, Form, Input, InputNumber, Row, Col, Select, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAnalyzer } from '../components/BusinessAnalyzer';
import dayjs from 'dayjs';
import { fetchCostFlows, createCostFlow, updateCostFlow, deleteCostFlow, CostFlow } from '../services/cost';
import ImportButton from '../components/ImportButton';
import { fetchOrders, OrderRecord } from '../services/order';
import { fetchSuppliers, SupplierRecord } from '../services/supplier';
import DictSelect from '../components/DictSelect';
import ProResizableTable from '../components/ProResizableTable';
import { renderLongText } from '../utils/renderLongText';

interface Props {
  projectId?: number;
  onNavigate?: (key: string, state?: any) => void;
}

const CostExecution: React.FC<Props> = ({ projectId, onNavigate }) => {
  const { message } = App.useApp();
  const [costs, setCosts] = useState<CostFlow[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<CostFlow | null>(null);
  const [form] = Form.useForm();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const analyzer = useAnalyzer();
  const effectiveProjectId = projectId ?? (
    analyzer.state.objectId && ['project', 'contract'].includes(analyzer.state.dimension)
      ? Number(analyzer.state.objectId)
      : undefined
  );

  const loadData = useCallback(async () => {
    void analyzer.state;
    setLoading(true);
    try {
      const [cRes, oRes, sRes] = await Promise.all([
        fetchCostFlows({ page: 1, page_size: 500 }),
        fetchOrders(1, 500),
        fetchSuppliers(1, 500),
      ]);
      let items = cRes.items || [];
      if (effectiveProjectId) {
        const projOrderIds = (oRes.items || [])
          .filter((o: any) => String(o.project_id) === String(effectiveProjectId))
          .map((o) => String(o.id));
        if (projOrderIds.length === 0) { setCosts([]); setOrders(oRes.items || []); setSuppliers(sRes.items || []); setLoading(false); return; }
        items = items.filter((i: any) => projOrderIds.includes(String(i.order_id)));
      }
      setCosts(items);
      setOrders(oRes.items || []);
      setSuppliers(sRes.items || []);
    } catch { message.error('加载成本数据失败'); }
    setLoading(false);
  }, [message, effectiveProjectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingFlow(null);
    form.resetFields();
    form.setFieldsValue({ business_date: dayjs() });
    setShowAdvanced(false);
    setModalOpen(true);
  };

  const openEdit = (r: CostFlow) => {
    setEditingFlow(r);
    form.setFieldsValue({
      ...r,
      order_id: Number(r.order_id),
      supplier_id: r.supplier_id ? Number(r.supplier_id) : undefined,
    });
    setShowAdvanced(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();

      const payload = {
        cost_type: v.cost_type,
        tax_rate: v.tax_rate ?? null,
        taxable_amount: v.taxable_amount ?? 0,
        non_taxable_amount: v.non_taxable_amount ?? 0,
        cost_subject: v.cost_subject ?? null,
        supplier_id: v.supplier_id ? String(v.supplier_id) : null,
        cost_stage: v.cost_stage || null,
        cost_reason: v.cost_reason || null,
        business_date: v.business_date ? dayjs(v.business_date).format('YYYY-MM-DD') : null,
        expected_payment_date: v.expected_payment_date ? dayjs(v.expected_payment_date).format('YYYY-MM-DD') : null,
        business_owner: v.business_owner || null,
      };

      if (editingFlow) {
        await updateCostFlow(Number(editingFlow.order_id), editingFlow.id, payload);
        message.success('更新成功');
      } else {
        await createCostFlow(Number(v.order_id), payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      setEditingFlow(null);
      form.resetFields();
      loadData();
    } catch (err: any) {

      if (err.status === 422) {
        message.error(`请求参数错误: ${err.message}`);
      } else {
        message.error(err.message || '保存失败');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const flow = costs.find(c => c.id === id);
      if (!flow) { message.error('记录不存在'); return; }
      await deleteCostFlow(Number(flow.order_id), id);
      message.success('已删除');
      loadData();
    } catch (err: any) {

      message.error(err.message || '删除失败');
    }
  };

  const columns: any[] = [
    { title: '关联订单', dataIndex: 'order_id', key: 'order_id', width: 100, render: (v: string) => { const o = orders.find(x => String(x.id) === String(v)); return o ? <a onClick={() => onNavigate?.('orders', { focusOrderId: Number(o.id) })} style={{ cursor: 'pointer' }}>{o.order_no} — {o.order_name || ''}</a> : '-'; } },
    { title: '成本类型', dataIndex: 'cost_type', key: 'cost_type', width: 100 },
    { title: '供应商', dataIndex: 'supplier_id', key: 'supplier_id', width: 120, render: (v: number) => { const s = suppliers.find(x => Number(x.id) === v); return s?.name || '-' } },
    { title: '含税金额', dataIndex: 'taxable_amount', key: 'taxable_amount', width: 120, align: 'right' as const, render: (v: string) => `¥${Number(v||0).toLocaleString()}` },
    { title: '不含税金额', dataIndex: 'non_taxable_amount', key: 'non_taxable_amount', width: 120, align: 'right' as const, render: (v: string) => `¥${Number(v||0).toLocaleString()}` },
    { title: '成本科目', dataIndex: 'cost_subject', key: 'cost_subject', width: 160, render: renderLongText },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => <Tag>{v || '待支付'}</Tag> },
    {
      title: '操作', width: 120,
      render: (_: any, r: CostFlow) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 8 }} wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增成本流水</Button>
        <ImportButton
          title="导入成本流水"
          importAction="/import/cost-flows"
          exportAction="/cost-flows"
          templateName="成本流水导入模板.xlsx"
          onSuccess={loadData}
        />
      </Space>
      <ProResizableTable
        rowKey="id"
        columns={columns}
        dataSource={costs}
        loading={loading}
        pagination={{ showSizeChanger: true, defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total) => `共 ${total} 条` }}
      />
      <Modal
        title={editingFlow ? '编辑成本流水' : '新增成本流水'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); setEditingFlow(null); form.resetFields(); }}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="order_id" label="关联订单" rules={[{ required: true }]}>
                <Select showSearch placeholder="选择订单" optionFilterProp="label"
                  options={orders.map(o => ({ value: Number(o.id), label: `${o.order_no} - ${o.order_name || ''}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cost_type" label="成本类型" rules={[{ required: true }]}>
                <DictSelect category="cost_type" mode="create" placeholder="选择或输入成本类型" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="taxable_amount" label="含税金额">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tax_rate" label="税率(%)">
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>

          {/* 供应商 — 必选，在主表单区域 */}
          <Form.Item name="supplier_id" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
            <Select showSearch placeholder="搜索并选择供应商" optionFilterProp="label"
              options={suppliers.map(s => ({ value: s.id, label: s.name }))} />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Button type="link" onClick={() => setShowAdvanced(!showAdvanced)} style={{ padding: 0 }}>
              {showAdvanced ? '收起高级信息' : '展开高级信息'}
            </Button>
          </div>

          {showAdvanced && (
            <div>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="non_taxable_amount" label="不含税金额">
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="cost_subject" label="成本科目">
                    <Input placeholder="输入成本科目" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={8}>
                  <Form.Item name="cost_stage" label="成本阶段">
                    <DictSelect category="cost_stage" mode="create" placeholder="选择成本阶段" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="cost_reason" label="成本原因">
                    <DictSelect category="cost_reason" mode="create" placeholder="选择成本原因" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="business_owner" label="经营责任人">
                    <Input placeholder="责任人" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item name="business_date" label="经营发生日期">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="expected_payment_date" label="预计付款日期">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default CostExecution;
