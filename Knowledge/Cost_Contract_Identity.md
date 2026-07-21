# Cost Contract Identity — 成本合同唯一身份

> **BDD-03B 业务冻结 · SSoT**
> 更新时间：2026-07-05

---

## 一、定义

成本合同（Cost Contract）是 FinanceDesk 成本管理体系的**基础身份标识**。

后续所有经营业务（Cost Flow、Payment、ERP、Dashboard）必须引用 **Cost Contract**。

**禁止直接引用 Supplier。**

---

## 二、身份字段

| 字段 | 类型 | 必填 | 唯一 | 说明 |
|:----:|:----:|:----:|:----:|------|
| `cost_contract_no` | String(100) | ✅ | ✅ | **成本合同编号**，格式 `CC-{YYYY}-{NNN}` |
| `contract_year` | Integer | ✅ | — | **所属年度**，合同生效年度 |
| `supplier_id` | Integer | — | — | **供应商主体 ID**（仅作为属性，不作为业务引用键） |
| `supplier_name` | String(200) | ✅ | — | **供应商名称**（冗余，便于展示） |
| `effective_start` | Date | ✅ | — | **有效期开始** |
| `effective_end` | Date | ✅ | — | **有效期结束** |
| `status` | String(50) | ❌ | — | **合同状态**：有效 / 作废 / 到期 |

---

## 三、业务引用关系

```
以前（禁止）:
  Cost Flow ──→ Supplier (direct)
  Payment   ──→ Supplier (direct)
  ERP       ──→ Supplier (direct)
  Dashboard ──→ Supplier (direct)

现在（强制）:
  Cost Flow ──→ Cost Contract ──→ [Supplier 作为属性]
  Payment   ──→ Cost Contract ──→ [Supplier 作为属性]
  ERP       ──→ Cost Contract ──→ [Supplier 作为属性]
  Dashboard ──→ Cost Contract ──→ [Supplier 作为属性]
```

---

## 四、冻结规则

| 规则 | 说明 |
|------|------|
| 经营业务引用 Cost Contract | 禁止直接引用 Supplier |
| Supplier 仅为合同属性 | 不是独立管理对象 |
| cost_contract_no 全局唯一 | 编码规则参考 Identity_Matrix |
| 每年新合同 | 年度变化创建新合同，不修改年度 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始冻结 |
