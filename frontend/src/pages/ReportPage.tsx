// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import ChartComponent from '../components/Chart';
import { api } from '../services/api';

const API_BASE = '/api/v1';

const ReportPage: React.FC = () => {
  const [profitData, setProfitData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    api.get('/dashboard/project-profit').then((res: any) => {
      setProfitData(res || []);
      const totalIncome = (res || []).reduce((s: number, r: any) => s + (r.total_income || 0), 0);
      const totalCost = (res || []).reduce((s: number, r: any) => s + (r.total_cost || 0), 0);
      setSummary({ totalIncome, totalCost, profit: totalIncome - totalCost, margin: totalIncome > 0 ? ((totalIncome - totalCost) / totalIncome * 100).toFixed(2) : 0 });
    });
  }, []);

  const barOption: any = {
    title: { text: '项目利润分析', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['收入', '成本', '利润'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: profitData.map((r: any) => r.project_name || '未知'), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: '金额（元）' },
    series: [
      { name: '收入', type: 'bar', data: profitData.map((r: any) => r.total_income || 0) },
      { name: '成本', type: 'bar', data: profitData.map((r: any) => r.total_cost || 0) },
      { name: '利润', type: 'line', data: profitData.map((r: any) => r.gross_profit || 0) },
    ],
  };

  const pieOption: any = {
    title: { text: '收入\u5360\u6bd4', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: \u00a5{c} ({d}%)' },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['50%', '55%'],
      data: profitData.filter((r: any) => (r.total_income || 0) > 0).map((r: any) => ({
        name: r.project_name, value: r.total_income,
      })),
      label: { formatter: '{b}: {d}%' },
    }],
  };

  const handleExport = () => {
    const a = document.createElement('a');
    a.href = API_BASE + '/export/project-report';
    a.download = '\u9879\u76ee\u62a5\u8868.xlsx';
    a.click();
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12 }}>报表分析</h3>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title='总收入' value={summary.totalIncome || 0} prefix={'¥'} precision={2} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col span={6}><Card><Statistic title='总成本' value={summary.totalCost || 0} prefix={'¥'} precision={2} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={6}><Card><Statistic title='毛利润' value={summary.profit || 0} prefix={'¥'} precision={2} valueStyle={{ color: summary.profit >= 0 ? '#3f8600' : '#cf1322' }} /></Card></Col>
        <Col span={6}><Card><Statistic title='毛利率' value={summary.margin || 0} suffix='%' precision={2} /></Card></Col>
      </Row>
      <Row gutter={16}>
        <Col span={16}><Card title='项目利润对比'><ChartComponent option={barOption} /></Card></Col>
        <Col span={8}><Card title='收入分布'><ChartComponent option={pieOption} style={{ height: 400 }} /></Card></Col>
      </Row>
      <Row style={{ marginTop: 16 }}>
        <Col><Card><a onClick={handleExport} style={{ cursor: 'pointer' }}>📥 导出 Excel 报表</a></Card></Col>
      </Row>
    </div>
  );
};
export default ReportPage;
