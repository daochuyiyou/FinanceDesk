# Business Event Model — 标准业务事件模型

> **BDD-06.5 P3 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **收入链与成本链保持 Mirror Architecture 一致。Create / Update / Reverse / Rollback 四种标准事件。**

---

## 一、定位

Business Event 是 Mapping Engine 的输出、Import Engine 的输入。每个事件代表一个**原子业务操作**。

| 属性 | 值 |
|:----:|-----|
| 角色 | 业务操作标准载体 |
| 生产者 | Business Mapping Engine |
| 消费者 | ERP Import Engine |
| 事件类型 | `Create` / `Update` / `Reverse` / `Rollback` |
| 不可篡改 | 事件一旦生成，不可修改 |
| 可追溯 | 事件携带源暂存记录 ID 和 Batch No |

---

## 二、事件生命周期

```
[ERPStagingFlow] → [Mapping Engine]
                         ↓
                ┌─ Create Event
                ├─ Update Event
                ├─ Reverse Event
                └─ Rollback Event
                         ↓
                [Import Engine]
                         ↓
                ┌─ Business Object 写入
                ├─ Summary 更新
                └─ Import Log
```

---

## 三、事件类型

### 3.1 Create 事件

**含义**：创建新的业务对象。

| 字段 | 值 |
|:----:|-----|
| business_action | `create` |
| 触发条件 | 新 ERP 记录，匹配成功 |
| 目标表 | IncomeFlow / CostFlow / Collection / Payment |
| 幂等性 | `erp_record_id` 唯一约束保障 |
| 对应规则 | R001, R002, R003, R004 |

#### Mirror 对照

| 收入链 | 成本链 | 一致 |
|:------:|:------:|:----:|
| IncomeFlow.create | CostFlow.create | ✅ |
| Collection.create | Payment.create | ✅ |

### 3.2 Update 事件

**含义**：更新已有业务对象。

| 字段 | 值 |
|:----:|-----|
| business_action | `update` |
| 触发条件 | 同一 `erp_record_id` 的 ERP 记录与已导入记录金额不一致 |
| 目标表 | IncomeFlow / CostFlow / Collection / Payment |
| 幂等性 | 按 ID 更新，存在才能执行 |
| 使用场景 | ERP 修正导入 |

### 3.3 Reverse 事件

**含义**：冲红/冲正——创建与原记录金额相反的抵消记录。

| 字段 | 值 |
|:----:|-----|
| business_action | `reverse` |
| 触发条件 | ERP 含红冲/负数记录 |
| 目标表 | IncomeFlow / CostFlow |
| 金额处理 | 金额取绝对值，方向不变 |
| 幂等性 | 按负值 `erp_record_id` 唯一约束 |
| 对应规则 | R005, R006 |

#### Reverse 处理逻辑

```python
def handle_reverse_event(event: BusinessEvent, db: Session):
    """冲红事件处理。"""
    # 查找原记录
    original = find_original_record(event.field_values["erp_record_id"], db)
    
    # 创建冲红记录（金额为负）
    reversal = create_business_object(
        target=event.business_object,
        values={
            **event.field_values,
            "amount": -abs(original.taxable_amount),
            "remark": f"红冲: {original.remark}",
        },
        db=db,
    )
    
    # Summary 更新会在事务内完成
    return reversal
```

### 3.4 Rollback 事件

**含义**：批量回滚已导入的 Batch。

| 字段 | 值 |
|:----:|-----|
| business_action | `rollback` |
| 触发条件 | 用户触发 Batch Rollback |
| 目标表 | 全部已导入的业务表 |
| 操作 | 逻辑删除（`is_deleted = True`） |
| 幂等性 | 同一 Batch 多次回滚一致 |

---

## 四、事件数据结构

```python
@dataclass
class BusinessEvent:
    """标准业务事件。"""
    # 事件元数据
    event_id: str          # UUID
    event_type: str        # create / update / reverse / rollback
    event_time: datetime   # 事件生成时间
    batch_no: str          # 归属导入批次
    
    # 业务信息
    business_object: str   # IncomeFlow / CostFlow / Collection / Payment
    business_action: str   # create / update / reverse / rollback
    
    # 源数据追踪
    source_flow_id: int    # ERPStagingFlow.id
    source_record_id: str  # ERPStagingFlow.erp_record_id
    matched_order_id: int  # 匹配订单 ID
    matched_project_id: Optional[int]  # 匹配项目 ID
    
    # 映射后的字段值
    field_values: Dict[str, Any]  # 业务表字段名 → 值
    
    # 汇总动作
    summary_action: str  # recalc / skip
    
    # 冲红关联（仅 reverse 事件）
    original_record_id: Optional[int] = None  # 被冲红的业务记录 ID
    original_amount: Optional[Decimal] = None  # 原金额
```

---

## 五、事件序列

### 正常导入事件序列

```
Event 1: Create(IncomeFlow, order_id=1, amount=100000)
Event 2: Create(Collection, order_id=1, amount=100000)
Event 3: Create(CostFlow, order_id=1, amount=50000)
    ↓
Summary: recalc(order_id=1)
    ↓
COMMIT
```

### 红冲事件序列

```
Event 1: Create(IncomeFlow, order_id=1, amount=100000)     ← 原发票
Event 2: Reverse(IncomeFlow, order_id=1, amount=-100000)    ← 红冲
    ↓
Summary: recalc(order_id=1)      ← 净额为 0
    ↓
COMMIT
```

### Rollback 事件序列

```
Event 1: Rollback(batch_no="IMP-20260705-001")
    ↓
查找 Batch 关联的全部业务记录
    ↓
逻辑删除所有关联记录
    ↓
COMMIT
```

---

## 六、Mirror Architecture 事件映射

| 收入链事件 | 成本链事件 | 镜像 |
|:----------:|:----------:|:----:|
| `Create(IncomeFlow)` | `Create(CostFlow)` | ✅ |
| `Create(Collection)` | `Create(Payment)` | ✅ |
| `Reverse(IncomeFlow)` | `Reverse(CostFlow)` | ✅ |
| `Rollback(IncomeFlow)` | `Rollback(CostFlow)` | ✅ |
| `Summary.recalc(revenue)` | `Summary.recalc(cost)` | ✅ |

---

## 七、事件日志

| 字段 | 说明 |
|:----:|------|
| event_id | 事件唯一 ID |
| event_type | 事件类型 |
| business_object | 目标对象 |
| batch_no | 归属批次 |
| status | `pending` / `completed` / `failed` |
| detail | 执行详情 |
| created_at | 生成时间 |
| executed_at | 执行完成时间 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制，4 种事件 + Mirror Architecture 映射 |
