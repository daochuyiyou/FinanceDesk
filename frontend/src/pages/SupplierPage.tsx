// @ts-nocheck
/**
 * 供应商管理页面 —— 支持年度概况导出 + 三合一导入
 */
import React, { useRef, useState } from 'react';
import { App, Button, Space, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExportOutlined, DollarOutlined, FolderOpenOutlined, ImportOutlined } from '@ant-design/icons';

import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { fetchSupplierOverview, batchImportSuppliers } from '../services/supplierOverview';
import { createSupplier, updateSupplier, fetchSuppliers, deleteSupplier } from '../services/supplier';
import ImportButton from '../components/ImportButton';
import type { SupplierRecord } from '../services/supplier';
import SupplierContractDrawer from './SupplierContractDrawer';
import SupplierPriceDrawer from './SupplierPriceDrawer';
import SupplierModal from './SupplierModal';
import ImportModal from '../components/ImportModal';
import ProResizableTable from '../components/ProResizableTable';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { renderLongText } from '../utils/renderLongText';

const SupplierPage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SupplierRecord | null>(null);
  const [priceDrawerOpen, setPriceDrawerOpen] = useState(false);
  const [contractDrawerOpen, setContractDrawerOpen] = useState(false);
  const [priceDrawerVendor, setPriceDrawerVendor] = useState<SupplierRecord | null>(null);
  const [contractDrawerVendor, setContractDrawerVendor] = useState<SupplierRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportYear, setExportYear] = useState<number>(dayjs().year());

  const columns: ProColumns<SupplierRecord>[] = [
    { title: '\u5e8f\u53f7', valueType: 'indexBorder', width: 60 },
    { title: '\u4f9b\u5e94\u5546\u540d\u79f0', dataIndex: 'name', width: 220, render: renderLongText },
    { title: '\u5907\u6ce8', dataIndex: 'remark', width: 200, render: renderLongText, search: false },
    { title: '\u521b\u5efa\u65f6\u95f4', dataIndex: 'created_at', valueType: 'dateTime', width: 170, search: false },
    { title: '\u64cd\u4f5c', width: 220, fixed: 'right' as const, search: false,
      render: (_: any, record: SupplierRecord) => (
        <Space>
          <Button type="link" size="small" icon={<FolderOpenOutlined />} onClick={() => { setContractDrawerVendor(record); setContractDrawerOpen(true); }}>{'\u5408\u540c'}</Button>
          <Button type="link" size="small" icon={<DollarOutlined />} onClick={() => { setPriceDrawerVendor(record); setPriceDrawerOpen(true); }}>{'\u5355\u4ef7'}</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingRecord(record); setModalOpen(true); }}>{'\u7f16\u8f91'}</Button>
          <Popconfirm title={'\u786e\u8ba4\u5220\u9664'} description={'\u5220\u9664\u8be5\u4f9b\u5e94\u5546\uff1f'} onConfirm={() => { deleteSupplier(record.id).then(() => { message.success('\u5220\u9664\u6210\u529f'); actionRef.current?.reload(); }); }}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>{'\u5220\u9664'}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSupplierSave = async (values: any) => {
    if (editingRecord) { await updateSupplier(editingRecord.id, values); }
    else { await createSupplier(values); }
    actionRef.current?.reload();
  };

  const handleExport = async () => {
    try {
      const res = await fetchSupplierOverview(exportYear);
      const items = res || [];
      if (items.length === 0) {
        message.warning(exportYear + '\u5e74\u5ea6\u6ca1\u6709\u53ef\u5bfc\u51fa\u7684\u6570\u636e');
        return;
      }
      const data = items.map((r: any) => ({
        '\u4f9b\u5e94\u5546\u540d\u79f0': r.vendor_name || '-',
        '\u72b6\u6001': r.status === 'NEW' ? '\u65b0\u589e' : r.status === 'RENEWED' ? '\u7eed\u7ea6' : '\u9000\u51fa',
        '\u6846\u67b6\u5408\u540c\u7f16\u53f7': r.framework_no || '-',
        '\u6846\u67b6\u5f00\u59cb\u65e5\u671f': r.framework_start_date || '',
        '\u6846\u67b6\u7ed3\u675f\u65e5\u671f': r.framework_end_date || '',
        '\u666e\u5de5\u5355\u4ef7(\u5143/\u4eba\u5929)': r.laborer_unit_price ?? '',
        '\u6280\u5de5\u5355\u4ef7(\u5143/\u4eba\u5929)': r.technician_unit_price ?? '',
        '\u9ad8\u7ea7\u6280\u5de5\u5355\u4ef7(\u5143/\u4eba\u5929)': r.senior_technician_unit_price ?? '',
        '\u7efc\u5408\u5355\u4ef7(\u5143/\u4eba\u5929)': r.comprehensive_unit_price ?? '',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '\u4f9b\u5e94\u5546\u5e74\u5ea6\u6982\u51b5');
      const colWidths = Object.keys(data[0] || {}).map((k: string) => ({ wch: Math.max(k.length * 2, 14) }));
      ws['!cols'] = colWidths;
      XLSX.writeFile(wb, '\u4f9b\u5e94\u5546\u5e74\u5ea6\u6982\u51b5_' + exportYear + '_' + dayjs().format('YYYYMMDD') + '.xlsx');
      message.success('\u5bfc\u51fa\u6210\u529f');
    } catch (error: any) {

      message.error('\u5bfc\u51fa\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u6216\u8054\u7cfb\u7ba1\u7406\u5458');
    }
  };

  return (
    <>
      <ProResizableTable
        rowKey="id" columns={columns}
        request={async (params) => { const { current, pageSize } = params; const res = await fetchSuppliers(current ?? 1, pageSize ?? 20); return { data: res.items, total: res.total, success: true }; }}
        search={{ labelWidth: 'auto', defaultCollapsed: true }}
        toolBarRender={() => [
          <DatePicker key="year" picker="year" value={dayjs().year(exportYear) as any} onChange={(d: any) => setExportYear(d ? d.year() : dayjs().year())} allowClear={false} style={{ width: 120 }} />,
          <Button key="import" icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>{'\u5bfc\u5165'}</Button>,
          <Button key="export" icon={<ExportOutlined />} onClick={handleExport}>{'\u5bfc\u51fa Excel'}</Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); setModalOpen(true); }}>{'\u65b0\u589e\u4f9b\u5e94\u5546'}</Button>,
        ]}
        pagination={{ showSizeChanger: true, defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'] }}
      />
      <ImportModal
        open={importOpen} onClose={() => setImportOpen(false)}
        title={'\u5bfc\u5165 ' + exportYear + ' \u5e74\u5ea6\u4f9b\u5e94\u5546\u6982\u51b5\uff08\u4e09\u5408\u4e00\uff09'}
        columns={[
          { title: '\u4f9b\u5e94\u5546\u540d\u79f0', dataIndex: 'vendor_name', required: true, description: '\u4f9b\u5e94\u5546\u5168\u79f0\uff0c\u82e5\u4e0d\u5b58\u5728\u5219\u81ea\u52a8\u521b\u5efa' },
          { title: '\u6846\u67b6\u5408\u540c\u7f16\u53f7', dataIndex: 'framework_no', required: true, description: '\u6846\u67b6\u5408\u540c\u552f\u4e00\u7f16\u53f7' },
          { title: '\u6846\u67b6\u5f00\u59cb\u65e5\u671f', dataIndex: 'framework_start_date', valueType: 'date', description: '\u683c\u5f0f\uff1aYYYY-MM-DD' },
          { title: '\u6846\u67b6\u7ed3\u675f\u65e5\u671f', dataIndex: 'framework_end_date', valueType: 'date', description: '\u683c\u5f0f\uff1aYYYY-MM-DD' },
          { title: '\u666e\u5de5\u5355\u4ef7', dataIndex: 'laborer_unit_price', valueType: 'number', description: '\u5143/\u4eba\u5929' },
          { title: '\u6280\u5de5\u5355\u4ef7', dataIndex: 'technician_unit_price', valueType: 'number', description: '\u5143/\u4eba\u5929' },
          { title: '\u7efc\u5408\u5355\u4ef7', dataIndex: 'comprehensive_unit_price', valueType: 'number', description: '\u5143/\u4eba\u5929' },
        ]}
        customImportHandler={async (data) => { return batchImportSuppliers(exportYear, data); }}
        onSuccess={() => actionRef.current?.reload()}
      />
      {contractDrawerVendor && <SupplierContractDrawer open={contractDrawerOpen} vendorId={contractDrawerVendor.id} vendorName={contractDrawerVendor.name} onClose={() => { setContractDrawerOpen(false); setContractDrawerVendor(null); }} />}
      <SupplierModal open={modalOpen} editingRecord={editingRecord as any} onClose={() => { setModalOpen(false); setEditingRecord(null); }} onSave={handleSupplierSave} />
      {priceDrawerVendor && <SupplierPriceDrawer open={priceDrawerOpen} vendorId={priceDrawerVendor.id} vendorName={priceDrawerVendor.name} onClose={() => { setPriceDrawerOpen(false); setPriceDrawerVendor(null); }} />}
    </>
  );
};
export default SupplierPage;
