/* 🅳-2: BatchActions.tsx - add destroyOnHidden */
import React, { useState } from 'react';
import { Button, Modal, message, Select, Space } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

interface BatchActionsProps {
  selectedRowKeys: React.Key[];
  module: string;
  statusOptions?: Array<{ value: string; label: string }>;
  onSuccess?: () => void;
}

const API_BASE = '/api/v1';

const BatchActions: React.FC<BatchActionsProps> = ({ selectedRowKeys, module, statusOptions, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) { message.warning('请先选择要删除的数据'); return; }
    Modal.confirm({
      title: `确定要删除选中的 ${selectedRowKeys.length} 条数据吗？`,
      okText: '确定删除', okType: 'danger',
      onOk: async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/batch/${module}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedRowKeys }),
          }).then(r => r.json());
          message.success(`成功删除 ${res.deleted} 条数据`);
          onSuccess?.();
        } catch (e: any) { message.error(e.message || '删除失败'); }
        finally { setLoading(false); }
      },
    });
  };

  const handleBatchUpdateStatus = async () => {
    if (!newStatus) { message.warning('请选择目标状态'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/batch/${module}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedRowKeys, status: newStatus }),
      }).then(r => r.json());
      message.success(`成功更新 ${res.updated} 条数据`);
      onSuccess?.();
    } catch (e: any) { message.error(e.message || '更新失败'); }
    finally { setLoading(false); setStatusModalOpen(false); }
  };

  if (selectedRowKeys.length === 0) return null;

  return (
    <Space style={{ marginBottom: 8 }}>
      <span style={{ color: '#1890ff' }}>已选 {selectedRowKeys.length} 项</span>
      <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete} loading={loading}>批量删除</Button>
      {statusOptions && statusOptions.length > 0 && (
        <>
          <Button icon={<EditOutlined />} onClick={() => setStatusModalOpen(true)}>批量更新状态</Button>
          <Modal title="批量更新状态" open={statusModalOpen} onCancel={() => setStatusModalOpen(false)}
            onOk={handleBatchUpdateStatus} confirmLoading={loading} destroyOnHidden>
            <Select placeholder="请选择目标状态" style={{ width: '100%' }} options={statusOptions} onChange={setNewStatus} />
          </Modal>
        </>
      )}
    </Space>
  );
};
export default BatchActions;
