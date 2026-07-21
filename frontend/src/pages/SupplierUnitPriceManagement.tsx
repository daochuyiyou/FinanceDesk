import React, { useState, useCallback, useEffect } from 'react';
import { App, Button, Space, Popconfirm, Table, Modal, Form, Input, InputNumber, Select, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchSupplierUnitPrices, createSupplierUnitPrice, updateSupplierUnitPrice, deleteSupplierUnitPrice, SupplierUnitPriceRecord } from '../services/supplierUnitPrice';
import ImportButton from '../components/ImportButton';
import { fetchSuppliers, SupplierRecord } from '../services/supplier';

const SupplierUnitPriceManagement: React.FC = () => {
  const { message } = App.useApp();
  const [prices, setPrices] = useState<SupplierUnitPriceRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierUnitPriceRecord | null>(null);
  const [filterSupplier, setFilterSupplier] = useState<number | undefined>();
  const [filterYear, setFilterYear] = useState<number | undefined>();
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetchSupplierUnitPrices({ supplier_id: filterSupplier, year: filterYear, page: 1, page_size: 500 }),
        fetchSuppliers(1, 200),
      ]);
      setPrices(pRes.items);
      setSuppliers(sRes.items);
    } catch { message.error('加载失败'); }
    setLoading(false);
  }, [filterSupplier, filterYear, message]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r: SupplierUnitPriceRecord) => {
    setEditing(r);
    form.setFieldsValue(r);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const v = await form.validateFields();
    const payload = {
      supplier_id: Number(v.supplier_id),
      year: Number(v.year),
      laborer_price: v.laborer_price ? Number(v.laborer_price) : null,
      technician_price: v.technician_price ? Number(v.technician_price) : null,
      senior_technician_price: v.senior_technician_price ? Number(v.senior_technician_price) : null,
      special_work_price: v.special_work_price ? Number(v.special_work_price) : null,
      comprehensive_price: v.comprehensive_price ? Number(v.comprehensive_price) : null,
      remark: v.remark || null,
    };
    if (editing) {
      await updateSupplierUnitPrice(editing.id, payload);
      message.success('更新成功');
    } else {
      await createSupplierUnitPrice(payload);
      message.success('创建成功');
    }
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async (r: SupplierUnitPriceRecord) => {
    await deleteSupplierUnitPrice(r.id);
    message.success('已删除');
    loadData();
  };

  const supName = (id: number) => suppliers.find(s => Number(s.id) === id)?.name || `#${id}`;

  const columns = [
    { title: '供应商', render: (_: any, r: SupplierUnitPriceRecord) => supName(r.supplier_id), width: 160 },
    { title: '年度', dataIndex: 'year', width: 80 },
    { title: '普工单价', dataIndex: 'laborer_price', render: (v: number) => v != null ? `¥${v.toLocaleString()}` : '-', width: 100 },
    { title: '技工单价', dataIndex: 'technician_price', render: (v: number) => v != null ? `¥${v.toLocaleString()}` : '-', width: 100 },
    { title: '高级技工单价', dataIndex: 'senior_technician_price', render: (v: number) => v != null ? `¥${v.toLocaleString()}` : '-', width: 110 },
    { title: '特种作业单价', dataIndex: 'special_work_price', render: (v: number) => v != null ? `¥${v.toLocaleString()}` : '-', width: 110 },
    { title: '综合单价', dataIndex: 'comprehensive_price', render: (v: number) => v != null ? `¥${v.toLocaleString()}` : '-', width: 100 },
    { title: '备注', dataIndex: 'remark', render: (v: string) => v || '-', width: 150, ellipsis: true },
    {
      title: '操作', width: 150,
      render: (_: any, r: SupplierUnitPriceRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const yearOptions = [];
  const cy = new Date().getFullYear();
  for (let y = cy - 5; y <= cy + 2; y++) yearOptions.push({ value: y, label: `${y}年` });

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12 }}>单价管理</h3>
      <Card size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16} align="middle">
          <Col span={5}>
            <Select allowClear placeholder="按供应商筛选" style={{ width: '100%' }}
              value={filterSupplier} onChange={setFilterSupplier}
              options={suppliers.map(s => ({ value: Number(s.id), label: s.name }))} />
          </Col>
          <Col span={4}>
            <Select allowClear placeholder="按年度筛选" style={{ width: '100%' }}
              value={filterYear} onChange={setFilterYear}
              options={yearOptions} />
          </Col>
          <Col><ImportButton title="导入单价数据" importAction="/import/supplier-unit-prices" exportAction="/supplier-unit-prices" templateName="单价导入模板.xlsx" onSuccess={loadData} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增单价</Button></Col>
        </Row>
      </Card>
      <Table dataSource={prices} columns={columns} rowKey="id" loading={loading}
        pagination={{ showSizeChanger: true, defaultPageSize: 20 }} size="small" scroll={{ x: 1100 }} />

      <Modal title={editing ? '编辑单价' : '新增单价'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnHidden width={550}>
        <Form form={form} layout="vertical">
          {!editing && (
            <Form.Item name="supplier_id" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
              <Select showSearch placeholder="选择供应商" optionFilterProp="label"
                options={suppliers.map(s => ({ value: Number(s.id), label: s.name }))} />
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="year" label="年度" rules={[{ required: true, message: '请输入年度' }]}>
                <Select options={yearOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="laborer_price" label="普工单价"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="technician_price" label="技工单价"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="senior_technician_price" label="高级技工单价"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="special_work_price" label="特种作业单价"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="comprehensive_price" label="综合单价"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default SupplierUnitPriceManagement;