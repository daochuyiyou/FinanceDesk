import React, { useState } from 'react';
import { App, Button, Modal, Upload, Table, Alert, Space, Tag } from 'antd';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { api } from '../services/api';

const { Dragger } = Upload;

export interface ImportColumn {
  title: string;
  dataIndex: string;
  valueType?: 'string' | 'number' | 'date';
  required?: boolean;
  description?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  endpoint?: string;
  columns: ImportColumn[];
  onSuccess?: (count: number) => void;
  customImportHandler?: (data: any[]) => Promise<{ success: number; fail: number; errors: string[] }>;
}

const ImportModal: React.FC<Props> = ({ open, onClose, title, endpoint, columns, onSuccess, customImportHandler }) => {
  const { message } = App.useApp();
  const [preview, setPreview] = useState<any[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; fail: number; errors: string[] } | null>(null);

  const getFileName = () => {
    const t = title || 'Excel \u5bfc\u5165';
    const match = t.match(/^(.*?)\u5bfc\u5165/);
    const prefix = match ? match[1].trim() : t.trim();
    return prefix + '\u5bfc\u5165\u6a21\u677f.xlsx';
  };

  const handleDownloadTemplate = () => {
    const headers = columns.map(c => c.title);
    const exampleRow: Record<string, string> = {};
    columns.forEach(c => { exampleRow[c.title] = ''; });
    const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '\u6a21\u677f');
    XLSX.writeFile(wb, getFileName());
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[];
        if (json.length === 0) { message.warning('\u6587\u4ef6\u4e3a\u7a7a'); return; }

        const headerMap: Record<string, string> = {};
        columns.forEach(c => { headerMap[c.title] = c.dataIndex; headerMap[c.dataIndex] = c.dataIndex; });
        const mappedJson = json.map((row: any) => {
          const newRow: any = {};
          Object.keys(row).forEach(key => { newRow[headerMap[key.trim()] || key.trim()] = row[key]; });
          return newRow;
        });
        const headers = Object.keys(mappedJson[0]);
        const missing = columns.filter(c => c.required).map(c => c.dataIndex).filter(h => !headers.includes(h));
        if (missing.length > 0) {
          const names = missing.map(m => columns.find(c => c.dataIndex === m)?.title || m);
          message.error('\u7f3a\u5c11\u5fc5\u586b\u5217: ' + names.join(', '));
          return;
        }
        setPreview(mappedJson.slice(0, 10));
        setResult(null);
        (window as any).__importData = mappedJson;
      } catch (err: any) { message.error('\u6587\u4ef6\u89e3\u6790\u5931\u8d25: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleImport = async () => {
    const rows = (window as any).__importData;
    if (!rows || rows.length === 0) return;
    setImporting(true);
    let resultData: { success: number; fail: number; errors: string[] };

    if (customImportHandler) {
      try { resultData = await customImportHandler(rows); }
      catch (err: any) { resultData = { success: 0, fail: rows.length, errors: [err.message || '\u6279\u91cf\u5bfc\u5165\u63a5\u53e3\u5f02\u5e38'] }; }
    } else {
      let success = 0; let fail = 0; const errors: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i]; const payload: any = {};
          for (const col of columns) {
            let val = row[col.dataIndex];
            if (col.valueType === 'number' && val !== '' && val != null) val = Number(val);
            if (val !== '' && val != null) payload[col.dataIndex] = val;
          }
          await api.post(endpoint!, payload); success++;
        } catch (err: any) { fail++; errors.push('\u7b2c ' + (i + 2) + ' \u884c: ' + (err.message || '\u5bfc\u5165\u5931\u8d25')); }
      }
      resultData = { success, fail, errors: errors.slice(0, 20) };
    }

    setResult(resultData); setImporting(false);
    (window as any).__importData = null;
    if (onSuccess) onSuccess(resultData.success);
    message.success('\u5bfc\u5165\u5b8c\u6210: \u6210\u529f ' + resultData.success + ' \u6761' + (resultData.fail > 0 ? '\uff0c\u5931\u8d25 ' + resultData.fail + ' \u6761' : ''));
  };

  const previewColumns = columns.map(col => ({
    title: col.title, dataIndex: col.dataIndex, ellipsis: true,
    render: (v: any) => col.valueType === 'number' && v != null ? '\u00a5' + Number(v).toLocaleString() : String(v ?? ''),
  }));

  const descCols = [
    { title: '\u5b57\u6bb5\u540d\u79f0', dataIndex: 'title', width: 140 },
    { title: '\u5fc5\u586b', dataIndex: 'required', width: 80, render: (v: boolean) => v ? <Tag color="red">{'\u5fc5\u586b'}</Tag> : <Tag>{'\u53ef\u9009'}</Tag> },
    { title: '\u8bf4\u660e', dataIndex: 'description', render: (_: any, r: ImportColumn) => r.description || (r.valueType === 'date' ? '\u683c\u5f0f\uff1aYYYY-MM-DD' : r.valueType === 'number' ? '\u6570\u5b57' : '\u6587\u672c') },
  ];

  return (
    <Modal title={title || 'Excel \u5bfc\u5165'} open={open} onCancel={() => { setPreview(null); setResult(null); onClose(); }}
      footer={null} width={760} destroyOnHidden>
      {!preview && !result && (
        <>
          <Alert message={'\u5b57\u6bb5\u8bf4\u660e\uff08Excel \u8868\u5934\u53ef\u4f7f\u7528\u4e2d\u6587\u6216\u82f1\u6587\u5b57\u6bb5\u540d\uff09'} type="info" showIcon style={{ marginBottom: 12 }} />
          <Table rowKey="dataIndex" columns={descCols} dataSource={columns} pagination={false} size="small" bordered style={{ marginBottom: 16 }} />
          <Space style={{ marginBottom: 16 }}>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>{'\u4e0b\u8f7d Excel \u6a21\u677f'}</Button>
          </Space>
          <Dragger accept=".xlsx,.xls,.csv" beforeUpload={(f) => { handleFile(f); return false; }} showUploadList={false}>
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">{'\u70b9\u51fb\u6216\u62d6\u62fd Excel \u6587\u4ef6\u5230\u6b64\u533a\u57df'}</p>
            <p className="ant-upload-hint">{'\u652f\u6301 .xlsx / .xls / .csv\uff0c\u5217\u5934\u9700\u5339\u914d\u4e0a\u65b9\u8bf4\u660e'}</p>
          </Dragger>
        </>
      )}
      {preview && !result && (
        <>
          <Alert message={'\u5df2\u89e3\u6790 ' + ((window as any).__importData?.length || 0) + ' \u884c\uff0c\u9884\u89c8\u524d 10 \u884c'} type="info" showIcon style={{ marginBottom: 12 }} />
          <Table rowKey={(_, i) => String(i)} columns={previewColumns} dataSource={preview} pagination={false} size="small" scroll={{ x: 'max-content' }} />
          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => { setPreview(null); setResult(null); }}>{'\u8fd4\u56de'}</Button>
            <Button type="primary" loading={importing} onClick={handleImport}>{'\u786e\u8ba4\u5bfc\u5165 ' + ((window as any).__importData?.length || 0) + ' \u6761'}</Button>
          </Space>
        </>
      )}
      {result && (
        <>
          <Alert type={result.fail > 0 ? 'warning' : 'success'}
            message={'\u5bfc\u5165\u5b8c\u6210: \u6210\u529f ' + result.success + ' \u6761' + (result.fail > 0 ? '\uff0c\u5931\u8d25 ' + result.fail + ' \u6761' : '')} showIcon style={{ marginBottom: 12 }} />
          {result.errors.length > 0 && (
            <div style={{ maxHeight: 200, overflow: 'auto', fontSize: 12, color: '#ff4d4f' }}>
              {result.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
          <Button type="primary" onClick={onClose} style={{ marginTop: 12 }}>{'\u5173\u95ed'}</Button>
        </>
      )}
    </Modal>
  );
};

export default ImportModal;
