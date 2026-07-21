# ERP Matching Rules — 统一匹配规则

> **BDD-06D P1 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **所有模块必须引用统一匹配规则。禁止各模块自行实现匹配逻辑。**

---

## 一、匹配状态（冻结）

| 状态 | 含义 | 颜色 | 说明 |
|:----:|------|:----:|------|
| **UNMATCHED** | 未匹配 | 🔴 | ERP 数据未找到对应业务对象 |
| **AUTO_MATCH** | 自动匹配 | 🟢 | 系统自动匹配成功 |
| **MANUAL_MATCH** | 人工匹配 | 🟡 | 人工确认的匹配关系 |
| **MULTI_MATCH** | 多候选匹配 | 🟠 | 匹配到多个候选业务对象 |
| **ERROR** | 异常 | 🔴 | ERP 数据存在异常（金额/日期不一致等） |

---

## 二、匹配优先级（冻结）

| 优先级 | 匹配方式 | 条件 | 说明 |
|:------:|---------|:----:|------|
| **P1** | `order_no` 精确匹配 | `ERP_Fact.voucher_no == Order.order_no` | **最高优先级** |
| **P2** | `contract_no + amount` 组合匹配 | `Project.contract_no + Order.amount` | 按合同+金额 |
| **P3** | `owner_name + business_date` 模糊匹配 | `Project.owner_name + IncomeFlow.invoice_date` | 按业主+日期 |
| **P4** | **人工确认** | 人工选择匹配关系 | 最低优先级 |

### 匹配引擎

```python
MATCHING_PRIORITY = [
    ("P1", "order_no 精确匹配", lambda f, db: match_by_order_no(f, db)),
    ("P2", "contract_no + amount", lambda f, db: match_by_contract_amount(f, db)),
    ("P3", "owner_name + date", lambda f, db: match_by_name_date(f, db)),
    ("P4", "人工确认", lambda f, db: None),  # 交由人工界面处理
]
```

---

## 三、匹配流程

```
ERP Fact 记录
    ↓
P1: order_no 匹配? ── ✅ → AUTO_MATCH
    ↓ 否
P2: contract_no + amount? ── ✅ → AUTO_MATCH
    ↓ 否
P3: owner_name + date? ── ✅ → AUTO_MATCH（低置信度）
    ↓ 否
候选超过 1 个? ── ✅ → MULTI_MATCH（人工选择）
    ↓ 否
P4: 人工确认 ── ✅ → MANUAL_MATCH
    ↓ 否
UNMATCHED
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
