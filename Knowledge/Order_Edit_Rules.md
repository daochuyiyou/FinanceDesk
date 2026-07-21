# Order Edit Rules — 订单编辑规则

> **BDD-02B F3.5 P1 输出 · 永久冻结**
> 更新时间：2026-07-05

---

## 一、字段编辑权限总表

| 字段 | 创建时 | 编辑时 | 禁止修改 |
|:----:|:------:|:------:|:--------:|
| `order_no` | ✅ 必填 | ❌ 锁定 | **编码一经创建即锁定** |
| `order_name` | ✅ 可选 | ✅ 允许 | — |
| `project_id` | ✅ 必填 | ❌ 锁定 | **订单归属的合同不可变更** |
| `contract_type` | — | — | 自动推导，无此字段 |
| `order_source` | — | — | 系统推导，无此字段 |
| `supplier_id` | ✅ 可选 | ✅ 允许 | — |
| `customer_name` | ✅ 可选 | ✅ 允许 | — |
| `owner_project_name` | ✅ 可选 | ✅ 允许 | — |
| `owner_project_no` | ✅ 可选 | ✅ 允许 | — |
| `amount` | ✅ 可选 | ✅ 允许 | — |
| `non_tax_amount` | ✅ 可选 | ✅ 允许 | — |
| `order_date` | ✅ 可选 | ✅ 允许 | — |
| `order_type` | ✅ 可选 | ✅ 允许 | — |
| `status` | ✅ 默认"待执行" | ⚠️ 有限制 | 仅允许→终止，其他由系统推导 |
| `remark` | ✅ 可选 | ✅ 允许 | — |
| `erp_no` | ✅ 可选 | ❌ 锁定 | **ERP 编号创建后锁定** |
| `mobile_project_no` | ✅ 可选 | ✅ 允许 | — |
| `mobile_contact` | ✅ 可选 | ✅ 允许 | — |

---

## 二、逐字段说明

### 2.1 order_no — 锁定

| 属性 | 值 |
|------|-----|
| 原因 | **甲方订单编号，ERP 主匹配键（Identity_Matrix §2）** |
| 创建后变更影响 | ERP 匹配断裂、对账失败、审计追溯丢失 |
| 处理方式 | 如需修改 → 作废原订单 → 创建新订单 |

### 2.2 project_id — 锁定

| 属性 | 值 |
|------|-----|
| 原因 | **订单归属的经营容器不可变更** |
| 创建后变更影响 | 合同台账 order_count 统计错误、经营分析归属混乱 |
| 处理方式 | 如需变更合同 → 作废原订单 → 在新合同下创建新订单 |

### 2.3 status — 有限制

| 属性 | 值 |
|------|-----|
| 允许 | 仅允许→"终止" |
| 禁止 | 不可从"执行中"人工改为"已完成"（应由系统在收支闭环时自动推导） |
| 原因 | **状态推导是系统职责（BADR-010）** |

### 2.4 erp_no — 锁定

| 属性 | 值 |
|------|-----|
| 原因 | **ERP 来源数据不可修改（R003）** |
| 创建后变更影响 | ERP 匹配键变更，无法追溯原始数据 |

---

## 三、创建时必填 vs 编辑时只读

```
创建时必填：order_no, project_id
创建后立即锁定：order_no, project_id, erp_no
```

---

## 四、UI 展示规则

| 场景 | 表单行为 |
|------|---------|
| 编辑模式打开 | order_no 显示为灰色禁用 Input |
| 编辑模式打开 | project_id 显示为灰色禁用 Select |
| 编辑模式打开 | erp_no 显示为灰色禁用 Input |
| 编辑模式打开 | status 仅提供"终止"选项 |
| 其余字段 | 正常可编辑 |

---

## 五、后端校验

```python
# update_order 中的字段限制
LOCKED_FIELDS = {"order_no", "project_id", "erp_no", "order_source", "contract_type"}
for field in update_data:
    if field in LOCKED_FIELDS:
        raise HTTPException(422, f"字段 '{field}' 不可修改")

# status 限制
if "status" in update_data and update_data["status"] != "终止":
    raise HTTPException(422, "状态仅允许系统推导或手动终止")
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
