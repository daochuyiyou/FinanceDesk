# Design System — UI 设计系统

> **PDD-00 P7 输出 · 永久文档（Product SSoT）**
> 更新时间：2026-07-06
> **整个系统 UI 规范。禁止各模块自行设计。所有组件必须使用 Ant Design 5。**

---

## 一、颜色系统

| 用途 | Token | 色值 | 说明 |
|:-----|:------|:-----|:------|
| 主色 | `--primary` | `#1677ff` | Ant Design 默认蓝 |
| 成功 | `--success` | `#52c41a` | 绿色 |
| 警告 | `--warning` | `#faad14` | 橙色 |
| 危险 | `--danger` | `#ff4d4f` | 红色 |
| 信息 | `--info` | `#1677ff` | 蓝色 |
| 文本 | `--text` | `#333` | 正文 |
| 次要文本 | `--text-secondary` | `#999` | 辅助 |
| 背景 | `--bg` | `#fff` | 页面背景 |
| 边框 | `--border` | `#f0f0f0` | 表格/卡片边框 |

---

## 二、Typography

| 元素 | 字号 | 字重 | 说明 |
|:-----|:----:|:----:|------|
| 页面标题 | 20px | 600 | 每个页面顶部 |
| 卡片标题 | 16px | 500 | Card title |
| 正文 | 14px | 400 | 默认 |
| 辅助文本 | 12px | 400 | 灰色提示 |
| 统计数字 | 32px | 700 | Statistic value |
| 表格头 | 14px | 500 | Table header |
| 表格体 | 14px | 400 | Table cell |

---

## 三、Spacing

| Token | 值 | 使用场景 |
|:------|:---|:---------|
| `--xs` | 4px | 内联元素间距 |
| `--sm` | 8px | 相邻元素 |
| `--md` | 16px | 卡片内间距 |
| `--lg` | 24px | 区域间距 |
| `--xl` | 32px | 页面间距 |

---

## 四、组件规范

### Button

| 类型 | 使用场景 |
|:-----|:---------|
| **Primary** | 主要操作（确认导入、提交） |
| **Default** | 次要操作（取消、返回） |
| **Danger** | 危险操作（删除、回滚） |
| **Link** | 文字链接（详情） |

### Input

| 类型 | 使用场景 |
|:-----|:---------|
| **Input** | 文本输入 |
| **Select** | 下拉选择 |
| **DatePicker** | 日期选择 |
| **InputNumber** | 金额输入 |

### Table

| 属性 | 值 |
|:-----|:-----|
| 组件 | `ProResizableTable` |
| 行高 | 40px |
| 列宽 | 可拖拽调整 |
| 分页 | 每页 20 条 |
| 多选 | Checkbox 列 |
| 排序 | 点击列头 |

### Card

| 类型 | 使用场景 |
|:-----|:---------|
| **Summary Card** | Dashboard 指标 |
| **Detail Card** | 详情页信息块 |
| **List Card** | 列表项（非表格） |

### Status Tag

| 状态 | 颜色 Tag |
|:-----|:---------|
| 待回款 | `blue` |
| 已回款 | `green` |
| 待支付 | `orange` |
| 已支付 | `green` |
| 已关闭 | `default` |
| 异常 | `red` |

---

## 五、布局约束

| 约束 | 值 |
|:-----|:-----|
| 最大内容宽度 | 1400px |
| 卡片圆角 | 8px |
| 表格边框 | 1px solid `#f0f0f0` |
| 阴影 | 无（antd 默认） |
| 动画 | 0.3s ease |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
---

## 六、Layout

| 区域 | 高度 | 背景 | 说明 |
|:-----|:----:|:----:|------|
| **Header** | 56px | `#fff` | Logo + 搜索 + ERP导入按钮 + 用户 |
| **Sidebar** | 100vh - 56px | `#fff` | 200px 宽，8 个一级菜单 |
| **Breadcrumb** | auto | 无 | 页面顶部路径导航 |
| **Toolbar** | auto | 无 | 标题右侧操作按钮 |
| **Content** | auto | `#f5f5f5` | 页面主体白色卡片 |
| **Page Padding** | 20px | `#f5f5f5` | 页面上下左右间距 |

## 七、Header 规范

| 元素 | 位置 | 说明 |
|:-----|:-----|:------|
| Logo | 左侧 | FinanceDesk 文字标 + 收起按钮 |
| 搜索框 | 居中 | 320px 宽，placeholder "搜索合同、订单、项目" |
| ERP 导入按钮 | 右侧 | Primary 按钮，跳转 ERP Import Workbench |
| 通知 | 右侧 | 🔔 图标 + 未读 Badge |
| 用户 | 右侧 | Avatar + 用户名 + 下拉菜单 |

## 八、Sidebar 规范

| 菜单 | 图标 | 跳转 |
|:-----|:-----|:------|
| 经营看板 | DashboardOutlined | Dashboard |
| ERP 导入 | UploadOutlined | ERP Import Workbench |
| 合同管理 | FileTextOutlined | ProjectList |
| 订单管理 | OrderedListOutlined | OrderPage |
| 收入管理 | DollarOutlined | IncomeManagement |
| 成本执行 | ShopOutlined | CostExecution |
| 成本合同库 | ShopOutlined | Supplier/Contracts/UnitPrices |
| 收款/付款 | DollarOutlined | CollectionManagement/PaymentManagement |

## 九、统一交互规范

| 交互 | 规范 |
|:-----|:------|
| 按钮圆角 | 6px |
| 卡片圆角 | 8px |
| 表格边框 | `#f0f0f0` |
| 页面背景 | `#f5f5f5` |
| 内容卡片 | 白色背景 + 8px 圆角 + 20px padding |
| 表单间距 | 16px |
| 表格分页 | 每页 20 条 |
