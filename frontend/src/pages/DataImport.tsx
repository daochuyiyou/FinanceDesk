import React, { useState } from 'react';
import { App, Upload, Table, Card, Tabs, Alert, Button } from 'antd';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';

const { Dragger } = Upload;
const API_BASE = '/api/v1';

const IMPORT_TARGETS = [
  { key: 'projects', label: 'Contract（合同）', apiPath: '/import/projects' },
  { key: 'orders', label: 'Order（订单）', apiPath: '/import/orders' },
  { key: 'suppliers', label: 'Supplier（供应商）', apiPath: '/import/suppliers' },
  { key: 'income-flows', label: 'Revenue（收入流水）', apiPath: '/import/income-flows' },
  { key: 'cost-flows', label: 'Cost（成本流水）', apiPath: '/import/cost-flows' },
  { key: 'collections', label: 'Collection（回款）', apiPath: '/import/collections' },
  { key: 'payments', label: 'Payment（付款）', apiPath: '/import/payments' },
];

const DataImport: React.FC = () => {
  const { message } = App.useApp();
  const [importResult, setImportResult] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleUpload = async (file: File, apiPath: string, tabKey: string) => {
    setLoading(prev => ({ ...prev, [tabKey]: true }));
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(API_BASE + apiPath, { method: 'POST', body: formData }).then(r => r.json());
      setImportResult(prev => ({ ...prev, [tabKey]: response }));
      message.success(`成功导入 ${response.success} 条数据（共 ${response.total} 条）`);
    } catch (error: any) {
      message.error(error?.message || '导入失败');
    } finally {
      setLoading(prev => ({ ...prev, [tabKey]: false }));
    }
    return false;
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12 }}>数据导入</h3>
      <Alert
        message="提示"
        description="您也可以在对应业务页面（项目/订单/收入/成本）的工具栏中直接点击'导入'按钮，就近导入数据。"
        type="info" showIcon style={{ marginBottom: 16 }}
      />
      <Tabs
        defaultActiveKey="projects"
        items={IMPORT_TARGETS.map(tab => {
          const result = importResult[tab.key];
          return {
            key: tab.key,
            label: tab.label,
            children: (
              <Card>
                <div style={{ textAlign: 'right', marginBottom: 8 }}>
                  <Button icon={<DownloadOutlined />} size="small"
                    onClick={() => {
                      const MAP: Record<string, string> = {
                        'projects': '合同导入模板.xlsx',
                        'orders': '订单导入模板.xlsx',
                        'income-flows': '收入流水导入模板.xlsx',
                        'cost-flows': '成本流水导入模板.xlsx',
                        'collections': '回款导入模板.xlsx',
                        'payments': '付款导入模板.xlsx',
                        'suppliers': '供应商导入模板.xlsx',
                      };
                      window.open('/api/v1/export/templates/' + encodeURIComponent(MAP[tab.key] || (tab.key + '.xlsx')), '_blank');
                    }}>
                    下载模板
                  </Button>
                </div>
                <Dragger accept=".xlsx,.xls" beforeUpload={(f) => handleUpload(f, tab.apiPath, tab.key)}
                  disabled={loading[tab.key]} showUploadList={false}>
                  <p><InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} /></p>
                  <p>点击或拖拽上传 Excel 文件</p>
                  <p style={{ color: '#999' }}>支持 .xlsx, .xls 格式</p>
                </Dragger>
                {result && (
                  <div style={{ marginTop: 16 }}>
                    <p>成功: {result.success} / 总计: {result.total}</p>
                    {result.errors?.length > 0 && (
                      <Table dataSource={result.errors.map((e: string, i: number) => ({ key: i, error: e }))}
                        columns={[{ title: '导入错误明细', dataIndex: 'error' }]}
                        pagination={false} size="small" />
                    )}
                  </div>
                )}
              </Card>
            ),
          };
        })}
      />
    </div>
  );
};
export default DataImport;
