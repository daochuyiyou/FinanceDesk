import React, { useState } from 'react';
import {
  ConfigProvider, Layout, Menu, theme, App as AntApp,
  Input, Badge, Dropdown, Avatar, Space, Button, Typography,
} from 'antd';
import {
  DashboardOutlined, FileTextOutlined, OrderedListOutlined,
  DollarOutlined, ShopOutlined, UploadOutlined, DatabaseOutlined,
  RobotOutlined, SettingOutlined, BellOutlined,
  UserOutlined, SearchOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import Dashboard from './pages/Dashboard';
import ERPImportWorkbench from './pages/ERPImportWorkbench';
import AuditLog from './pages/AuditLog';
import DataImport from './pages/DataImport';
import DataHub from './pages/DataHub';
import ContractBusinessWorkbench from './pages/ContractBusinessWorkbench';
import OrderBusinessWorkbench from './pages/OrderBusinessWorkbench';
import IncomeManagement from './pages/IncomeManagement';
import CostExecution from './pages/CostExecution';
import CollectionManagement from './pages/CollectionManagement';
import PaymentManagement from './pages/PaymentManagement';
import SupplierPage from './pages/SupplierPage';
import SupplierContractManagement from './pages/SupplierContractManagement';
import SupplierUnitPriceManagement from './pages/SupplierUnitPriceManagement';
import BudgetPage from './pages/BudgetPage';
import OrderDetail from './pages/OrderDetail';
import ProjectDetail from './pages/ProjectDetail';
import ErrorBoundary from './components/ErrorBoundary';
import DictionaryCenter from './pages/DictionaryCenter';
import { AnalyzerProvider, BusinessAnalyzer } from './components/BusinessAnalyzer';
import { PageLayout } from './components/PageLayout';
import type { BreadcrumbItem, ToolbarProps } from './components/PageLayout';

const { Header: AntHeader, Sider, Content } = Layout;
const { Text } = Typography;

// ── 菜单配置 ──

const MENU_ITEMS = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '经营看板' },
  { key: 'projects', icon: <FileTextOutlined />, label: '项目合同' },
  { key: 'orders', icon: <OrderedListOutlined />, label: '订单管理' },
  { key: 'incomes', icon: <DollarOutlined />, label: '收入管理' },
  { key: 'costs', icon: <ShopOutlined />, label: '成本执行' },
  { key: 'collections', icon: <DollarOutlined />, label: '回款管理' },
  { key: 'payments', icon: <DollarOutlined />, label: '付款管理' },
  { key: 'budget', icon: <DollarOutlined />, label: '预算管理' },
  {
    key: 'supplier-group', icon: <ShopOutlined />, label: '成本合同库',
    children: [
      { key: 'supplier', label: '合同主体' },
      { key: 'contracts', label: '成本合同' },
      { key: 'unit-prices', label: '单价管理' },
    ],
  },
  {
    key: 'data-center', icon: <DatabaseOutlined />, label: '数据中心',
    children: [
      { key: 'erp-sandbox', label: 'ERP数据导入' },
      { key: 'data-import', label: '快速导入' },
      { key: 'data-hub', label: 'ERP对账' },
    ],
  },
  {
    key: 'basic-group', icon: <SettingOutlined />, label: '基础资料',
    children: [
      { key: 'dictionary', label: '数据字典' },
      { key: 'audit-log', label: '操作日志' },
    ],
  },
];

// ── 路由布局配置（统一管理 Breadcrumb / Title / Toolbar） ──
// 每个业务页面在这里定义，不再允许页面自行设计 Header/Breadcrumb/Toolbar。

interface RouteConfig {
  breadcrumb: BreadcrumbItem[];
  title: string;
  toolbar?: ToolbarProps;
}

const ROUTE_CONFIG: Record<string, RouteConfig> = {
  dashboard: {
    breadcrumb: [{ title: '经营分析' }],
    title: '经营看板',
  },
  'erp-sandbox': {
    breadcrumb: [{ title: '经营分析' }, { title: '数据中心' }, { title: 'ERP数据导入' }],
    title: 'ERP 导入工作台',
  },
  projects: {
    breadcrumb: [{ title: '经营分析' }, { title: '合同中心' }, { title: '项目合同' }],
    title: '合同管理',
    toolbar: { showExport: true },
  },
  orders: {
    breadcrumb: [{ title: '经营分析' }, { title: '合同中心' }, { title: '订单管理' }],
    title: '订单管理',
    toolbar: { showExport: true },
  },
  incomes: {
    breadcrumb: [{ title: '经营分析' }, { title: '收入管理' }],
    title: '收入管理',
    toolbar: { showExport: true },
  },
  costs: {
    breadcrumb: [{ title: '经营分析' }, { title: '成本管理' }],
    title: '成本管理',
    toolbar: { showExport: true },
  },
  supplier: {
    breadcrumb: [{ title: '经营分析' }, { title: '成本合同库' }, { title: '合同主体' }],
    title: '合同主体管理',
  },
  contracts: {
    breadcrumb: [{ title: '经营分析' }, { title: '成本合同库' }, { title: '成本合同' }],
    title: '成本合同管理',
  },
  'unit-prices': {
    breadcrumb: [{ title: '经营分析' }, { title: '成本合同库' }, { title: '单价管理' }],
    title: '单价管理',
  },
  collections: {
    breadcrumb: [{ title: '经营分析' }, { title: '回款管理' }],
    title: '回款管理',
    toolbar: { showExport: true },
  },
  payments: {
    breadcrumb: [{ title: '经营分析' }, { title: '付款管理' }],
    title: '付款管理',
    toolbar: { showExport: true },
  },
  'data-hub': {
    breadcrumb: [{ title: '经营分析' }, { title: '数据中心' }, { title: 'ERP对账' }],
    title: 'ERP对账',
  },
  budget: {
    breadcrumb: [{ title: '经营分析' }, { title: '预算管理' }],
    title: '预算管理',
  },
  'data-import': {
    breadcrumb: [{ title: '经营分析' }, { title: '数据中心' }, { title: '快速导入' }],
    title: '快速导入',
  },
  'audit-log': {
    breadcrumb: [{ title: '系统设置' }, { title: '操作日志' }],
    title: '操作日志',
  },
  dictionary: {
    breadcrumb: [{ title: '基础资料' }, { title: '数据字典' }],
    title: '数据字典',
  },
};

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentKey, setCurrentKey] = useState('dashboard');
  const [navState, setNavState] = useState<any>(null);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 子菜单父级映射：自动展开当前页面所在父菜单
  const PARENT_MAP: Record<string, string> = {
    supplier: 'supplier-group',
    contracts: 'supplier-group',
    'unit-prices': 'supplier-group',
    dictionary: 'basic-group',
    'audit-log': 'basic-group',
    'erp-sandbox': 'data-center',
    'data-import': 'data-center',
    'data-hub': 'data-center',
  };

  const goTo = (key: string, state?: any) => {
    setNavState(state || null);
    setCurrentKey(key);
    // 展开当前页面所属父菜单
    const parent = PARENT_MAP[key];
    if (parent) {
      setOpenKeys(prev => prev.includes(parent) ? prev : [...prev, parent]);
    }
  };
  const goToImport = () => setCurrentKey('erp-sandbox');

  const renderPage = () => {
    const config = ROUTE_CONFIG[currentKey];

    // 无配置的路由直接返回页面（兜底）
    if (!config) {
      return <div style={{ padding: 24, color: '#999' }}>页面开发中…</div>;
    }

    const page = (() => {
      switch (currentKey) {
        case 'dashboard': return <Dashboard onNavigate={goTo} />;
        case 'erp-sandbox': return <ERPImportWorkbench />;
        case 'projects': return <ContractBusinessWorkbench onNavigate={goTo} />;
        case 'orders': return <OrderBusinessWorkbench focusOrderId={navState?.focusOrderId} onNavigate={goTo} />;
        case 'incomes': return <IncomeManagement onNavigate={goTo} />;
        case 'costs': return <CostExecution onNavigate={goTo} />;
        case 'supplier': return <ErrorBoundary><SupplierPage /></ErrorBoundary>;
        case 'contracts': return <SupplierContractManagement />;
        case 'unit-prices': return <SupplierUnitPriceManagement />;
        case 'collections': return <CollectionManagement onNavigate={goTo} />;
        case 'payments': return <PaymentManagement onNavigate={goTo} />;
        case 'data-hub': return <ErrorBoundary><DataHub /></ErrorBoundary>;
        case 'budget': return <BudgetPage />;
        case 'data-import': return <DataImport />;
        case 'audit-log': return <AuditLog />;
        case 'dictionary': return <DictionaryCenter />;
        default: return <div style={{ padding: 24, color: '#999' }}>页面开发中…</div>;
      }
    })();

    return (
      <PageLayout
        breadcrumb={config.breadcrumb}
        title={config.title}
        toolbar={config.toolbar}
        showContextBar={currentKey !== 'audit-log'}
      >
        {page}
      </PageLayout>
    );
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <AnalyzerProvider>
          <Layout style={{ minHeight: '100vh' }}>
            {/* ── Header ── */}
            <AntHeader
              style={{
                height: 56,
                padding: '0 24px',
                background: '#fff',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100,
              }}
            >
              {/* Left: Logo + Collapse */}
              <Space>
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  style={{ fontSize: 16, width: 40, height: 40 }}
                />
                <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
                  FinanceDesk
                </Text>
              </Space>

              {/* Center: Search */}
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索合同、订单、项目…"
                style={{ width: 320, borderRadius: 6 }}
                size="middle"
              />

              {/* Right: ERP Import + Notifications + User */}
              <Space size="middle">
                <Button type="primary" icon={<UploadOutlined />} onClick={goToImport}>
                  ERP 导入
                </Button>
                <Badge count={0} size="small">
                  <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
                </Badge>
                <Dropdown
                  menu={{
                    items: [
                      { type: 'divider' },
                      { key: 'logout', label: '退出登录' },
                    ],
                  }}
                >
                  <Space style={{ cursor: 'pointer' }}>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <Text>一游</Text>
                  </Space>
                </Dropdown>
              </Space>
            </AntHeader>

            {/* ── Business Analyzer（全局） ── */}
            <BusinessAnalyzer />

            <Layout>
              {/* ── Sidebar ── */}
              <Sider
                collapsed={collapsed}
                theme="light"
                width={200}
                collapsedWidth={56}
                style={{
                  borderRight: '1px solid #f0f0f0',
                  overflow: 'auto',
                  height: 'calc(100vh - 56px)',
                  position: 'sticky',
                  top: 56,
                  left: 0,
                }}
              >
                <Menu
                  mode="inline"
                  selectedKeys={[currentKey]}
                  openKeys={openKeys}
                  onOpenChange={setOpenKeys}
                  items={MENU_ITEMS}
                  onClick={({ key }) => {
                    setCurrentKey(key);
                    const parent = PARENT_MAP[key];
                    if (parent) {
                      setOpenKeys(prev => prev.includes(parent) ? prev : [...prev, parent]);
                    }
                  }}
                  style={{ borderRight: 0, marginTop: 4 }}
                />
              </Sider>

              {/* ── Content ── */}
              <Content
                style={{
                  padding: 20,
                  background: '#f5f5f5',
                  minHeight: 'calc(100vh - 56px)',
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    padding: 16,
                    minHeight: 'calc(100vh - 96px)',
                  }}
                >
                  {renderPage()}
                </div>
              </Content>
            </Layout>
          </Layout>
        </AnalyzerProvider>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
