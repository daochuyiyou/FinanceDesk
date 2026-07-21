/* 🅳-4: AuditLog.tsx - cleanup unused Input import + already has destroyOnHidden */
import React, { useState, useEffect } from 'react';
import { Table, Card, Select, Button, Space } from 'antd';
const API_BASE = '/api/v1';
const AuditLogPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ module: '', action: '' });
  const fetchLogs = async (p: number) => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(p), page_size: '20', ...filters });
    const res = await fetch(API_BASE + '/audit-logs?' + q).then(r => r.json());
    setData(res.items || []); setTotal(res.total || 0); setPage(p);
    setLoading(false);
  };
  useEffect(() => { fetchLogs(1); }, [filters]);
  const columns = [
    { title: '时间', dataIndex: 'created_at', width: 180 },
    { title: '操作人', dataIndex: 'username', width: 100 },
    { title: '操作', dataIndex: 'action', width: 80 },
    { title: '模块', dataIndex: 'module', width: 80 },
    { title: '目标', dataIndex: 'target_name', width: 150, ellipsis: true },
    { title: 'IP', dataIndex: 'ip_address', width: 120 },
    { title: '详情', dataIndex: 'changes', ellipsis: true },
  ];
  return (<div style={{ padding: 16 }}>
    <h3 style={{ marginBottom: 12 }}>操作日志</h3>
    <Card>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="模块" allowClear style={{ width: 120 }} onChange={(v) => setFilters(f => ({...f, module: v || ''}))}
          options={['projects','orders','suppliers','income-flows','cost-flows','collection','payment'].map(m => ({value:m,label:m}))} />
        <Select placeholder="操作类型" allowClear style={{ width: 120 }} onChange={(v) => setFilters(f => ({...f, action: v || ''}))}
          options={['CREATE','UPDATE','DELETE','IMPORT','EXPORT'].map(a => ({value:a,label:a}))} />
        <Button type='primary' onClick={() => fetchLogs(1)}>查询</Button>
        <Button onClick={() => setFilters({module:'',action:''})}>重置</Button>
      </Space>
      <Table rowKey='id' columns={columns} dataSource={data} loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: fetchLogs }} size='small' />
    </Card>
  </div>);
};
export default AuditLogPage;
