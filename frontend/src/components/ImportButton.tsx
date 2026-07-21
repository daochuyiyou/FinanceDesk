/* 🅳-3: ImportButton.tsx Spin fix + 🅳-4 unused import cleanup */
import React, { useState } from 'react';
import { Button, Modal, Upload, message, Alert, Spin, Space } from 'antd';
import { InboxOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Dragger } = Upload;
const API_BASE = '/api/v1';

interface ImportButtonProps {
  title: string;
  importAction: string;
  exportAction?: string;
  templateName?: string;
  onSuccess?: () => void;
}

const validateExcelFile = (file: File, expectedHeaders: string[]): Promise<{ valid: boolean; errors: string[] }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array((e.target as any).result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);
        if (jsonData.length === 0) {
          resolve({ valid: false, errors: ['文件为空，请填写数据后上传'] });
          return;
        }
        const actualHeaders = Object.keys(jsonData[0]);
        const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
        if (missingHeaders.length > 0) {
          resolve({ valid: false, errors: [`缺少表头列: ${missingHeaders.join(', ')}`] });
          return;
        }
        resolve({ valid: true, errors: [] });
      } catch { resolve({ valid: false, errors: ['文件解析失败'] }); }
    };
    reader.readAsArrayBuffer(file);
  });
};

const HEADER_MAP: Record<string, string[]> = {
  '/import/projects': ['框架合同名称', '签订时间', '合同开始时间', '合同结束时间', '集团内外', '项目类型'],
  '/import/suppliers': ['供应商名称', '所属框架', '框架编号', '框架开始时间', '框架结束时间', '年度'],
  '/import/orders': ['项目ID', '订单编号', '订单名称', '甲方单位', '含税金额', '不含税金额', '签订日期', '订单类型', '状态'],
  '/import/income-flows': ['订单ID', '税率', '含税金额', '不含税金额', '开票日期', '发票号码', '备注'],
  '/import/cost-flows': ['订单ID', '供应商ID', '成本类型', '税率', '含税金额', '不含税金额', '成本科目', '备注'],
  '/import/supplier-contracts': ['供应商ID', '合同编号', '合同金额', '签订日期', '开始日期', '结束日期', '状态', '备注'],
  '/import/supplier-unit-prices': ['供应商ID', '年度', '普工单价', '技工单价', '高级技工单价', '特种作业单价', '综合单价', '备注'],
};

const ImportButton: React.FC<ImportButtonProps> = ({
  title, importAction, exportAction, templateName, onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; total: number; errors: string[] } | null>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setResult(null);
    const expectedHeaders = HEADER_MAP[importAction];
    if (expectedHeaders) {
      const validation = await validateExcelFile(file, expectedHeaders);
      if (!validation.valid) {
        setResult({ success: 0, total: 0, errors: validation.errors });
        setLoading(false);
        return false;
      }
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(API_BASE + importAction, { method: 'POST', body: fd }).then(r => r.json());
      setResult(res);
      if (res.success > 0) { message.success(`成功导入 ${res.success} 条数据`); onSuccess?.(); }
      if (res.errors?.length > 0) message.warning(`导入完成，${res.errors.length} 条有错误`);
    } catch (e: any) { message.error(e.message || '导入失败'); }
    finally { setLoading(false); }
    return false;
  };

  const handleDownloadTemplate = async () => {
    if (!templateName) return;
    const resp = await fetch(`${API_BASE}/export/templates/${encodeURIComponent(templateName)}`);
    if (!resp.ok) { message.error('模板下载失败'); return; }
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = templateName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!exportAction) return;
    const resp = await fetch(`${API_BASE}/export${exportAction}`);
    if (!resp.ok) { message.error('导出失败'); return; }
    const blob = await resp.blob();
    const disp = resp.headers.get('content-disposition') || '';
    const fn = disp.split('filename=')[1] || 'export.xlsx';
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fn;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Space>
        <Button onClick={() => setOpen(true)}><InboxOutlined /> 导入</Button>
        {templateName && <Button onClick={handleDownloadTemplate}><DownloadOutlined /> 模板</Button>}
        {exportAction && <Button onClick={handleExport}><FileExcelOutlined /> 导出</Button>}
      </Space>
      <Modal title={title} open={open} onCancel={() => { setOpen(false); setResult(null); }} footer={null} width={600}>
        <div style={{ marginBottom: 16, color: '#999' }}>请先下载模板，按模板格式填写数据后上传</div>
        <Dragger accept=".xlsx,.xls" beforeUpload={handleUpload} disabled={loading} showUploadList={false}>
          <p><InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} /></p>
          <p>点击或拖拽上传 Excel 文件</p>
          <p style={{ color: '#999' }}>支持 .xlsx, .xls 格式</p>
        </Dragger>
        {loading && <div style={{ textAlign: 'center', marginTop: 16 }}><Spin tip="导入中..."><div style={{ padding: '20px' }}></div></Spin></div>}
        {result && result.errors?.length > 0 && (
          <Alert style={{ marginTop: 16 }} type="warning" message={`成功 ${result.success} 条，失败 ${result.errors.length} 条`}
            description={<ul style={{ margin: 0, paddingLeft: 16, maxHeight: 150, overflow: 'auto' }}>{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>} />
        )}
        {result && result.errors?.length === 0 && result.success > 0 && (
          <Alert style={{ marginTop: 16 }} type="success" message={`成功导入 ${result.success} 条数据`} />
        )}
      </Modal>
    </>
  );
};
export default ImportButton;
