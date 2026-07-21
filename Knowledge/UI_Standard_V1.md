# FinanceDesk UI Standard（全站 UI 规范）

> 版本 V1 — PS-011 UX-000
> 本规范是 PS-011 后续所有 UX 工作的统一基准。
> 所有页面必须遵循本规范，禁止自行设计交互。

---

## 1. Dialog（弹窗）

### 1.1 通用规则
| 属性 | 规范值 | 依据 |
|------|--------|------|
| 宽度 | **500px**（窄）、**600px**（宽） | 当前多数字段使用 500/600 |
| 标题格式 | `新增{业务名称}` / `编辑{业务名称}` | |
| 关闭方式 | 右上角 X + `onCancel` | |
| `destroyOnClose` | 一律 `destroyOnClose`（旧版 `destroyOnHidden` 也接受） | |
| `footer` | **不显式设置**，使用 antd 默认 `[取消, 确定]` | |

### 1.2 按钮顺序
```
[取消] [确定]
```
- 取消在左，确定在右（antd 默认行为）
- 确定为 `type="primary"`
- 取消为 `type="default"`
- 禁止修改按钮顺序

### 1.3 表单字段折叠
```
基础信息（可见） → 高级信息（折叠）
```
- 基础字段：4~6 个最常用字段
- 高级字段：通过 `展开高级信息` / `收起高级信息` 按钮切换
- 默认高级信息折叠
- 关闭弹窗时重置折叠状态

---

## 2. Toolbar（工具栏）

### 2.1 位置
- 位于页面内容区域顶部，Table 上方
- 使用 `<Space>` 包裹按钮组

### 2.2 布局标准
```
[新增]  [导入]  [模板]  [导出]  [筛选控件...]
```
- **最左侧**：主要操作按钮（新增 type="primary"）
- **中间**：次要操作（导入、模板、导出）
- **最右侧**：筛选控件（Select、Search 等）
- 禁止使用 `<Card>` + `<Row>` + `<Col>` 包裹工具栏

### 2.3 按钮类型
| 操作 | 按钮类型 |
|------|---------|
| 新增 | `type="primary"` + `PlusOutlined` |
| 导入 | `type="default"` + `UploadOutlined` / `ImportOutlined` |
| 导出 | `type="default"` + `DownloadOutlined` / `ExportOutlined` |
| 编辑 | `type="link"` + `EditOutlined` |
| 删除 | `type="link"` + `danger` + `DeleteOutlined` |
| 刷新 | `type="text"` + `ReloadOutlined` |

---

## 3. Table（表格）

### 3.1 分页标准
```tsx
pagination={{
  showSizeChanger: true,
  defaultPageSize: 20,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total) => `共 ${total} 条`,
}}
```
- `size="small"` 统一
- `defaultPageSize`: **20**（非 10）
- 禁止省略 `showSizeChanger`
- 禁止每页写不同的 pagination 配置

### 3.2 空状态
- 使用 antd `<Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />`
- 禁止直接写 `暂无数据` 文本
- 禁止使用表格默认空状态（建议显式设置）

### 3.3 列操作
- **编辑**：`<Button type="link" size="small" icon={<EditOutlined />}>`
- **删除**：`<Popconfirm title="确认删除？">` + `<Button type="link" size="small" danger>`
- 禁止把编辑/删除放在单独的"操作"列之外

### 3.4 关联对象显示
```
{编号} — {名称}
```
例：`ORD-PS008-001 — PS-008 E2E Order`
- 禁止仅显示编码或数字 ID
- 参见 PS-011 UX-004 关联对象统一规范

---

## 4. Search（搜索）

### 4.1 全局搜索
- 位于顶部 Header
- placeholder: `搜索合同、订单、项目…`
- 使用 antd `<Input prefix={<SearchOutlined />}>`

### 4.2 列表搜索/筛选
- 位于 Table 上方工具栏
- 使用 `<Select showSearch>` 支持关键字过滤
- 统一格式：`{编号} - {名称}` 作为选项 label
- 禁止使用原生 `<select>`
- `filterOption` 使用不区分大小写的 `includes` 匹配

### 4.3 搜索默认行为
- 所有 Select 默认 `allowClear`
- 选项 **客户端过滤**，不发起 API 调用

---

## 5. Button（按钮）

### 5.1 尺寸
- 工具栏按钮：`size="middle"`（默认）
- Table 行内按钮：`size="small"`
- 表单按钮：`size="middle"`（默认）

### 5.2 层级
| 层级 | 类型 | 示例 |
|------|------|------|
| 主要操作 | `type="primary"` | 新增、确定、保存、导入 |
| 次要操作 | `type="default"` | 导出、模板、取消 |
| 文字操作 | `type="link"` | 编辑、详情 |
| 危险操作 | `type="link" danger` | 删除 |
| 纯图标 | `type="text"` | 刷新、折叠 |

---

## 6. Form（表单）

### 6.1 标签
- 使用中文标签
- layout 统一为 `layout="vertical"`（纵向排列）
- 标签在字段上方

### 6.2 必填
- 使用 `rules={[{ required: true, message: '请输入...' }]}`
- 不依赖 `label` 上的星号，antd Form.Item 自动渲染

### 6.3 校验提示
- 使用 antd 默认校验提示样式
- message 为中文：`'请输入{字段名称}'` / `'请选择{字段名称}'`

### 6.4 字段折叠
- 基础信息 → 高级信息折叠
- 折叠按钮使用 `<Button type="link">` + 纯文本
- 格式：`展开高级信息` / `收起高级信息`

---

## 7. KPI 卡片

### 7.1 布局
- 使用 `<SummaryKpi>` 组件（`frontend/src/components/SummaryKpi.tsx`）
- 禁止直接使用 `<Card>` 手写 KPI
- 默认 `columns={3}`（一行三张）

### 7.2 辅助函数
| 函数 | 颜色 | 用途 |
|------|------|------|
| `moneyKpi(label, value, onClick, color?)` | 正数 #333，负数 #ff4d4f，可覆盖 | 金额 |
| `countKpi(label, value, suffix?, onClick?)` | 默认 #333 | 数量 |
| `percentKpi(label, value, onClick?)` | 正 #52c41a，负 #ff4d4f | 百分比 |

### 7.3 颜色规约
| 数据方向 | 颜色 |
|---------|------|
| 收入/回款 | `#1677ff`（antd primary） |
| 成本/支出 | `#ff4d4f`（红色） |
| 利润正 | `#52c41a`（绿色） |
| 利润负 | `#ff4d4f`（红色） |
| 中性/总数 | `#333` |

---

## 8. Badge / Tag

### 8.1 Tag 状态色
| 状态 | 颜色 |
|------|------|
| 正常/已完成 | `success` |
| 待处理/待开票 | `default` |
| 进行中 | `processing` / `blue` |
| 警告 | `warning` / `orange` |
| 异常/超支 | `red` |
| 已作废 | `default` |

### 8.2 Badge
- 使用 antd `<Badge>`，统一 `size="small"`
- 仅用于通知计数，不用于状态标识

---

## 9. Layout（布局）

### 9.1 页面结构
```
┌─ Header（全局导航）────────────┐
│ Logo | 搜索 | ERP导入 | Bell | 用户  │
├─ Analyzer（全局筛选）───────────┤
│ 经营期间 | 经营对象 | ▶ 高级筛选    │
├─ Content ─────────────────────┤
│ PageLayout                   │
│ ├─ Breadcrumb                 │
│ ├─ Title                      │
│ ├─ Toolbar                   │
│ └─ Page Content              │
└───────────────────────────────┘
```

### 9.2 ContextBar
- 显示当前 Analyzer 上下文（期间、维度、对象）
- 由 `<PageLayout>` 统一管理
- 禁止页面自行显示

---

## 10. 颜色规约

| 用途 | 色值 | antd token |
|------|------|-----------|
| 品牌主色 | `#1677ff` | `colorPrimary` |
| 成功 | `#52c41a` | `colorSuccess` |
| 警告 | `#faad14` | `colorWarning` |
| 错误 | `#ff4d4f` | `colorError` |
| 文字主色 | `#333` | `colorText` |
| 文字次要 | `#666` | `colorTextSecondary` |
| 背景灰 | `#f5f5f5` | `colorBgLayout` |

---

## 附录：审计发现的不一致项

| # | 页面 | 问题 | 整改 |
|---|------|------|------|
| A1 | `PaymentManagement.tsx` | 工具栏使用 `<Card>`+`<Row>`+`<Col>` 包裹 | 改为 `<Space>` |
| A2 | `CollectionManagement.tsx` | 工具栏使用 `<Card>`+`<Row>`+`<Col>` 包裹 | 改为 `<Space>` |
| A3 | `IncomeManagement.tsx` | 工具栏使用 `<Card>`+`<Row>`+`<Col>` 包裹 | 改为 `<Space>` |
| A4 | `CostExecution.tsx` | 工具栏使用 `<Row>`+`<Col>` | 改为 `<Space>` |
| A5 | `Dashboard.tsx` | KPI 使用 `columns={3}` | 应统一规范（已符合） |
| A6 | `Dashboard.tsx` | 分页使用 `showTotal` 字符串拼接 | 改为模板字符串 `共 ${t} 条` |
| A7 | `Dashboard.tsx` | AR/利润表格 pagination 配置与标准不一致（pageSize=10） | 改为 20 |
| A8 | 多个页面 | pagination 配置不统一 | 统一遵循 §3.1 标准 |
| A9 | `CollectionPage.tsx` | 旧版多 Tab 页面，代码较长 | 后续重构时统一 |
