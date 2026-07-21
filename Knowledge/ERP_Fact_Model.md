# ERP Fact Model — ERP 原始流水对象

> **BDD-06A 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **ERP Fact：只保存事实。不得保存经营状态。不得计算利润。不得计算 Gap。不得修改业务数据。全部只读。**

---

## 一、定位

ERP Fact 是 ERP 原始数据的导入层。**不是业务层。**

| 属性 | 值 |
|:----:|-----|
| 角色 | 数据管道入站（Data Pipeline Inbound） |
| 可写 | 仅 Import 模块可写入 |
| 可读 | Business Mapping Engine 可读取 |
| 可改 | ❌ 禁止修改 |
| 可删 | ❌ 禁止删除 |
| 生命周期 | 随 Import Batch 进入 → 匹配后保留 → 永久存档 |

---

## 二、字段定义

| 字段 | 类型 | NULL | 说明 | 来源 |
|:----:|:----:|:----:|------|:----:|
| id | Integer | | 主键 | S |
| voucher_no | String(100) | | **凭证号** | E |
| erp_project_no | String(100) | ✅ | **ERP 项目编号** | E |
| department | String(100) | ✅ | 部门 | E |
| subject | String(200) | ✅ | 科目 | E |
| customer | String(200) | ✅ | 客户 | E |
| supplier | String(200) | ✅ | 供应商 | E |
| amount | Numeric(15,2) | | 金额 | E |
| direction | String(10) | | **方向**：贷方(收入) / 借方(成本) | E |
| business_date | Date | ✅ | **业务发生日期（ERP 侧）** | E |
| summary | Text | ✅ | 摘要 | E |
| import_batch | String(100) | | **导入批次号** | S |
| source_file | String(200) | | **来源文件名** | S |
| match_status | String(50) | ✅ | **匹配状态**：未匹配 / 已匹配 / 差异 | S |
| match_result | Text | ✅ | **匹配结果描述** | S |
| match_order_id | String(36) | ✅ | 匹配到的订单 ID | S |
| is_deleted | Boolean | | 逻辑删除 | S |

---

## 三、核心约束

| 约束 | 说明 |
|:----:|------|
| **只读** | ERP Fact 导入后禁止修改、禁止删除 |
| **事实层** | 仅保存 ERP 原始字段，不增加任何经营字段 |
| **无业务状态** | 不保存利润、Gap、回款率等经营指标 |
| **无计算** | 不进行任何业务计算 |
| **批处理** | 每条记录必须标记 `import_batch` 和 `source_file` |

---

## 四、数据流向

```
Excel / API
    ↓
ERP Fact (import_batch, source_file)
    ↓
Match Status: 未匹配 → 已匹配 → 差异
    ↓
Business Mapping Engine
    ↓
Business Object (Order/Income/Cost/Collection/Payment)
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
