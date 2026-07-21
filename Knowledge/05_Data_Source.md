# FinanceDesk 数据源

> **永久文档 · Single Source of Truth**
> 更新时间：2026-07-04
> 交叉引用：[02_Business_Model](./02_Business_Model.md) · [04_Data_Model](./04_Data_Model.md) · [06_ERP_Integration](./06_ERP_Integration.md)

---

## 1. 数据来源分类

| 来源类型 | 方式 | 使用者 | 频次 |
|---------|------|--------|------|
| **手工录入** | 前端 CRUD 页面 | 项目经理/财务 | 按需 |
| **Excel 导入** | 9 种模板批量导入 | 财务人员 | 批量/月度 |
| **ERP 对接** | 智慧工程平台双轨 ETL | 自动同步 | 增量 |

## 2. 手工录入

所有 7 个核心模块均支持前端 CRUD 操作，通过 RESTful API 直接写入数据库。

## 3. Excel 批量导入

### 3.1 导入模板（9 种）

| # | 模板文件 | 目标表 | 导入路由 |
|---|---------|--------|---------|
| 1 | 项目导入模板.xlsx | project | ProjectImport |
| 2 | 供应商导入模板.xlsx | supplier | SupplierImport |
| 3 | 订单导入模板.xlsx | order | OrderImport |
| 4 | 收入流水导入模板.xlsx | income_flow | IncomeFlowImport |
| 5 | 成本流水导入模板.xlsx | cost_flow | CostFlowImport |
| 6 | 回款导入模板.xlsx | collection | CollectionImport |
| 7 | 付款导入模板.xlsx | payment | PaymentImport |
| 8 | 合同导入模板.xlsx | supplier_contract | SupplierContractImport |
| 9 | 单价导入模板.xlsx | supplier_unit_price | SupplierUnitPriceImport |

### 3.2 导入流程

```python
# 导入处理核心流水线
Excel文件 → pandas + openpyxl → 矢量化切片 → bulk insert ON CONFLICT DO NOTHING
```

- **双列分流**：贷方/借方 → 收入池/成本池
- **单列符号**：正数 → 收入，负数 → 成本(取abs)
- **日期处理**：`str → date.fromisoformat` for SQLite bulk

### 3.3 导入规范

详见 [08_Development_Constitution](./08_Development_Constitution.md) 第 5 节：

- Pydantic 模型用**英文字段**，模板用**中文列头**
- `process_excel` 入口必须调用 `translate_headers()` 将中文 → 英文
- 禁止 `iterrows()` 逐行遍历 → 使用矢量化操作
- 禁止修改现有业务表 → 新数据走暂存表（双轨架构）

## 4. 导入模板存放

```
backend/templates/
├── 项目导入模板.xlsx
├── 供应商导入模板.xlsx
├── 订单导入模板.xlsx
├── 收入流水导入模板.xlsx
├── 成本流水导入模板.xlsx
├── 回款导入模板.xlsx
├── 付款导入模板.xlsx
├── 合同导入模板.xlsx
└── 单价导入模板.xlsx
```

## 5. ERP 对接

详见 [06_ERP_Integration](./06_ERP_Integration.md)。
