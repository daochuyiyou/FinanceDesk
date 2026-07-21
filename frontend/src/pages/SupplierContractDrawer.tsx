// @ts-nocheck
/**
 * 供应商框架合同抽屉 — 展示某个 Vendor 下的所有框架合同
 */
import React, { useRef, useState } from 'react';
import { App, Button, Drawer, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/supplier';
import type { SupplierRecord, SupplierCreatePayload, SupplierUpdatePayload } from '../services/supplier';
import SupplierModal from './SupplierModal';

interface Props {
  open: boolean;
  vendorId: string;
  vendorName: string;
  onClose: () => void;
}

const SupplierContractDrawer: React.FC<Props> = ({ open, vendorId, vendorName, onClose }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SupplierRecord | null>(null);

  const columns: ProColumns<SupplierRecord>[] = [
    { title: '\u5e8f\u53f7', valueType: 'indexBorder', width: 60 },
    { title: '\u6240\u5c5e\u6846\u67b6', dataIndex: 'framework', width: 180, ellipsis: true },
    { title: '\u6846\u67b6\u7f16\u53f7', dataIndex: 'framework_no', width: 140 },
    { title: '\u6846\u67b6\u5f00\u59cb', dataIndex: 'framework_start_date', valueType: 'date', width: 110 },
    { title: '\u6846\u67b6\u7ed3\u675f', dataIndex: 'framework_end_date', valueType: 'date', width: 110 },
    { title: '\u5e74\u5ea6', dataIndex: 'year', width: 70, render: (_: any, r: SupplierRecord) => r.year ? r.year + '\u5e74' : '-' },
    { title: '\u521b\u5efa\u65f6\u95f4', dataIndex: 'created_at', valueType: 'dateTime', width: 170, search: false },
    { title: '\u64cd\u4f5c', width: 130, fixed: 'right' as const, search: false,
      render: (_: any, record: SupplierRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingRecord(record); setModalOpen(true); }}>{'\u7f16\u8f91'}</Button>
          <Popconfirm title={'\u786e\u8ba4\u5220\u9664'} description={'\u5220\u9664\u5408\u540c\u300c' + record.framework_no + '\u300d\uff1f'} onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>{'\u5220\u9664'}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => { setEditingRecord(null); setModalOpen(true); };
  const handleSave = async (values: SupplierCreatePayload | SupplierUpdatePayload) => {
    if (editingRecord) {
      await updateSupplier(editingRecord.id, values as SupplierUpdatePayload);
    } else {
      await createSupplier(values as SupplierCreatePayload);
    }
    actionRef.current?.reload();
  };
  const handleDelete = async (id: string) => {
    await deleteSupplier(id);
    message.success('\u5220\u9664\u6210\u529f');
    actionRef.current?.reload();
  };

  return (
    <>
      <Drawer title={<span>{'\u6846\u67b6\u5408\u540c'}<Tag color="blue">{vendorName}</Tag></span>} open={open} onClose={onClose} width={860} destroyOnHidden>
        <ProTable<SupplierRecord>
          actionRef={actionRef} rowKey="id" columns={columns} params={[vendorId]}
          request={async () => {
            const res = await fetchSuppliers(1, 200);
            const items = res.items.filter((s) => s.vendor_id === vendorId);
            return { data: items, total: items.length, success: true };
          }}
          search={false}
          toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>{'\u65b0\u589e\u6846\u67b6\u5408\u540c'}</Button>]}
          pagination={{ showSizeChanger: true, defaultPageSize: 20 }}
        />
      </Drawer>
      <SupplierModal open={modalOpen} vendorId={vendorId} editingRecord={editingRecord} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </>
  );
};

export default SupplierContractDrawer;
