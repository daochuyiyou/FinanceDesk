// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { App, Button, Space, Popconfirm, Tag, Table, Modal, Form, Input, InputNumber, DatePicker, Select, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchSupplierContracts, createSupplierContract, updateSupplierContract, deleteSupplierContract, SupplierContractRecord } from '../services/supplierContract';
import ImportButton from '../components/ImportButton';
import { fetchSuppliers, SupplierRecord } from '../services/supplier';

const SupplierContractManagement: React.FC = () => {
  const { message } = App.useApp();
  const [contracts, setContracts] = useState<SupplierContractRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierContractRecord | null>(null);
  const [filterSupplier, setFilterSupplier] = useState<number | undefined>();
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        fetchSupplierContracts({ supplier_id: filterSupplier, page: 1, page_size: 500 }),
        fetchSuppliers(1, 200),
      ]);
      setContracts(cRes.items);
      setSuppliers(sRes.items);
    } catch { message.error('加载失败'); }
    setLoading(false);
  }, [filterSupplier, message]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => { setEditing(null); setModalOpen(true); setTimeout(() => form.resetFields(), 0); };
  const openEdit = (r: SupplierContractRecord) => {
    setEditing(r);
    setModalOpen(true);
    setTimeout(() => {
      form.setFieldsValue({
        ...r,
        sign_date: r.sign_date ? dayjs(r.sign_date) : null,
        start_date: r.start_date ? dayjs(r.start_date) : null,
        end_date: r.end_date ? dayjs(r.end_date) : null,
      });
    }, 0);
  };

  const handleSave = async () => {
    const v = await form.validateFields();
    const payload = {
      ...v,
      sign_date: v.sign_date ? v.sign_date.format('YYYY-MM-DD') : null,
      start_date: v.start_date ? v.start_date.format('YYYY-MM-DD') : null,
      end_date: v.end_date ? v.end_date.format('YYYY-MM-DD') : null,
      amount: v.amount ? Number(v.amount) : null,
    };
    if (editing) {
      await updateSupplierContract(editing.id, payload);
      message.success('更新成功');
    } else {
      await createSupplierContract(payload);
      message.success('创建成功');
    }
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async (r: SupplierContractRecord) => {
    await deleteSupplierContract(r.id);
    message.success('已删除');
    loadData();
  };

  const supName = (id: number) => suppliers.find(s => Number(s.id) === id)?.name || `#${id}`;

  const columns = [
    { title: '合同编号', dataIndex: 'contract_no', width: 150 },
    { title: '供应商', render: (_: any, r: SupplierContractRecord) => supName(r.supplier_id), width: 160 },
    { title: '签订日期', dataIndex: 'sign_date', render: (v: string) => v || '-', width: 110 },
    { title: '开始日期', dataIndex: 'start_date', render: (v: string) => v || '-', width: 110 },
    { title: '结束日期', dataIndex: 'end_date', render: (v: string) => v || '-', width: 110 },
    { title: '合同金额', dataIndex: 'amount', render: (v: number) => v != null ? `¥${v.toLocaleString()}` : '-', width: 120 },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '有效' ? 'green' : 'orange'}>{v || '-'}</Tag>, width: 80 },
    { title: '备注', dataIndex: 'remark', render: (v: string) => v || '-', width: 150, ellipsis: true },
    {
      title: '操作', width: 150,
      render: (_: any, r: SupplierContractRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12 }}>合同管理</h3>
      <Card size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Select allowClear placeholder="按供应商筛选" style={{ width: '100%' }}
              value={filterSupplier} onChange={setFilterSupplier}
              options={suppliers.map(s => ({ value: Number(s.id), label: s.name }))} />
          </Col>
          <Col><ImportButton title="导入合同数据" importAction="/import/supplier-contracts" exportAction="/supplier-contracts" templateName="合同导入模板.xlsx" onSuccess={loadData} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增合同</Button></Col>
        </Row>
      </Card>
      <Table dataSource={contracts} columns={columns} rowKey="id" loading={loading}
        pagination={{ showSizeChanger: true, defaultPageSize: 20 }} size="small" scroll={{ x: 1200 }} />

      <Modal title={editing ? '编辑合同' : '新增合同'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnHidden width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="supplier_id" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
            <Select showSearch placeholder="选择供应商" optionFilterProp="label"
              options={suppliers.map(s => ({ value: Number(s.id), label: s.name }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contract_no" label="合同编号" rules={[{ required: true, message: '请输入合同编号' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="合同金额">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="sign_date" label="签订日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="start_date" label="开始日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="end_date" label="结束日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select options={[
                  { value: '有效', label: '有效' },
                  { value: '已终止', label: '已终止' },
                  { value: '已过期', label: '已过期' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default SupplierContractManagement;