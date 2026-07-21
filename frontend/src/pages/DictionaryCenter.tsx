/**
 * 数据字典中心页面
 * PS-012: 统一维护全局字典项
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Select, Modal, Form, Input, InputNumber,
  Popconfirm, Tag, Typography, Space, message, Row, Col,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  fetchCategories,
  fetchDictItems,
  createDictItem,
  updateDictItem,
  deleteDictItem,
  type DictCategory,
  type DictItem,
} from '../services/dict';

const { Text } = Typography;

const DictionaryCenter: React.FC = () => {
  const [categories, setCategories] = useState<DictCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<DictCategory | null>(null);
  const [items, setItems] = useState<DictItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<DictItem | null>(null);
  const [form] = Form.useForm();

  // 加载分类列表
  useEffect(() => {
    loadCategories();
  }, []);

  // 加载当前分类的条目
  useEffect(() => {
    if (activeCategory) {
      loadItems(activeCategory.category);
    }
  }, [activeCategory]);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
      if (data.length > 0 && !activeCategory) {
        setActiveCategory(data[0]);
      }
    } catch (error) {
      message.error('加载分类列表失败');
    }
  };

  const loadItems = async (category: string) => {
    setLoading(true);
    try {
      const data = await fetchDictItems(category);
      setItems(data.items);
    } catch (error) {
      message.error('加载字典条目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditItem(null);
    form.resetFields();
    form.setFieldsValue({
      sort_order: items.length + 1,
      value: '',
      label: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (item: DictItem) => {
    setEditItem(item);
    form.setFieldsValue({
      value: item.value,
      label: item.label || item.value,
      sort_order: item.sort_order || 1,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number, value: string) => {
    if (!activeCategory) return;
    try {
      await deleteDictItem(activeCategory.category, id);
      message.success(`已删除 "${value}"`);
      loadItems(activeCategory.category);
      loadCategories(); // 刷新分类计数
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleModalOk = async () => {
    if (!activeCategory) return;
    try {
      const values = await form.validateFields();
      const payload = {
        category: activeCategory.category,
        value: values.value,
        label: values.label,
        sort_order: values.sort_order,
      };

      if (editItem) {
        await updateDictItem(activeCategory.category, editItem.id, payload);
        message.success('修改成功');
      } else {
        await createDictItem(activeCategory.category, payload);
        message.success('新增成功');
      }

      setModalOpen(false);
      loadItems(activeCategory.category);
      loadCategories(); // 刷新分类计数
    } catch (error: any) {
      if (error?.errorFields) return; // 表单验证错误
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '排序号',
      dataIndex: 'sort_order',
      width: 80,
      align: 'center' as const,
      render: (v: number | null) => v || '-',
    },
    {
      title: '值（编码）',
      dataIndex: 'value',
      width: 200,
    },
    {
      title: '显示名称',
      dataIndex: 'label',
      width: 250,
      render: (v: string | null, record: DictItem) => v || record.value,
    },
    {
      title: '使用状态',
      width: 100,
      render: (_: unknown, record: DictItem) => (
        <Tag color="success">使用中</Tag>
      ),
    },
    {
      title: '操作',
      width: 160,
      render: (_: unknown, record: DictItem) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除？"
            description={`删除 "${record.value}" 后，已使用该值的业务记录不受影响。`}
            onConfirm={() => handleDelete(record.id, record.value)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // KPI 统计
  const totalCategories = categories.length;
  const totalItems = categories.reduce((sum, c) => sum + c.count, 0);
  const activeItems = totalItems; // 所有显示的条目都是使用中的

  return (
    <div>
      {/* KPI 行 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>字典分类数</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#333' }}>{totalCategories}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>字典条目数</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#333' }}>{totalItems}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>使用中条目数</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#333' }}>{activeItems}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>最近更新</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
              {new Date().toLocaleDateString('zh-CN')}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主区域：左侧分类列表 + 右侧条目表格 */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧分类列表 */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <Card
            title="字典分类"
            size="small"
            styles={{ body: { padding: '4px 0' } }}
          >
            {categories.map((cat) => (
              <div
                key={cat.category}
                onClick={() => setActiveCategory(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 2,
                  background: activeCategory?.category === cat.category ? '#e6f4ff' : 'transparent',
                  color: activeCategory?.category === cat.category ? '#1677ff' : undefined,
                  fontWeight: activeCategory?.category === cat.category ? 500 : undefined,
                }}
              >
                <span>{cat.label}</span>
                <span
                  style={{
                    background: activeCategory?.category === cat.category ? '#1677ff' : '#f0f0f0',
                    color: activeCategory?.category === cat.category ? '#fff' : '#666',
                    borderRadius: 10,
                    padding: '0 8px',
                    fontSize: 11,
                  }}
                >
                  {cat.count}
                </span>
              </div>
            ))}
          </Card>
        </div>

        {/* 右侧条目表格 */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
              新增条目
            </Button>
            <span style={{ fontSize: 13, color: '#999', marginLeft: 'auto' }}>
              分类：{activeCategory?.label || '-'}
            </span>
          </div>

          <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
            本页面管理「<Text strong>{activeCategory?.label || '-'}</Text>」的字典条目。修改后保存即时生效。
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={items}
            loading={loading}
            pagination={{
              showSizeChanger: true,
              defaultPageSize: 10,
              showTotal: (total) => `共 ${total} 条`,
            }}
            size="small"
          />
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editItem ? '编辑字典条目' : '新增字典条目'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="字典分类" required>
            <div style={{ padding: '4px 0', color: '#333' }}>
              {activeCategory?.label || '-'}
            </div>
          </Form.Item>
          <Form.Item
            label="值（编码）"
            name="value"
            rules={[{ required: true, message: '请输入值' }]}
          >
            <Input placeholder="如 contract_type，建议英文或数字" />
          </Form.Item>
          <Form.Item
            label="显示名称"
            name="label"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder={'用户看到的名称，如"合同类型"'}/>
          </Form.Item>
          <Form.Item
            label="排序号"
            name="sort_order"
            rules={[{ required: true, message: '请输入排序号' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DictionaryCenter;
