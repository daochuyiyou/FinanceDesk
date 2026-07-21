# Repository Interface — 仓储层接口规范

> **Engine Sprint 1.1 P2 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-06
> **统一接口：create / update / rollback / find / exists / refresh_summary**

---

## 一、BaseRepository 接口

```python
from abc import ABC, abstractmethod
from typing import Any, Optional


class BaseRepository(ABC):
    """所有 Repository 的抽象基类。"""

    def __init__(self, db):
        self.db = db

    @abstractmethod
    def create(self, fields: dict[str, Any]) -> int:
        """创建记录，返回新记录 ID。"""
        ...

    @abstractmethod
    def update(self, record_id: int, fields: dict[str, Any]) -> bool:
        """更新指定记录。"""
        ...

    @abstractmethod
    def rollback(self, record_id: int) -> bool:
        """逻辑删除（is_deleted = True）。"""
        ...

    @abstractmethod
    def find(self, record_id: int) -> Optional[dict]:
        """查询单条记录。"""
        ...

    @abstractmethod
    def find_by_business_key(self, business_key: str) -> Optional[int]:
        """按业务键（如 erp_record_id）查找记录 ID。"""
        ...

    @abstractmethod
    def exists(self, business_key: str) -> bool:
        """检查业务键是否已存在（去重用）。"""
        ...
```

---

## 二、IncomeRepository

| 方法 | 业务键字段 | ORM 表 | 特殊处理 |
|:----:|:----------:|:------:|---------|
| `create` | — | IncomeFlow | order_id → str |
| `exists` | `invoice_no` | IncomeFlow | 按 erp_record_id 查 invoice_no |

```python
class IncomeRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db)
        self._model = IncomeFlow

    def create(self, fields: dict) -> int:
        orm = dict(fields)
        orm["order_id"] = str(orm["order_id"])  # int → VARCHAR
        obj = self._model(**orm)
        self.db.add(obj)
        self.db.flush()
        return obj.id

    def exists(self, business_key: str) -> bool:
        return self.db.query(self._model).filter(
            self._model.invoice_no == business_key,
            self._model.is_deleted == False,
        ).first() is not None
```

---

## 三、CostRepository

| 方法 | 业务键字段 | ORM 表 | 特殊处理 |
|:----:|:----------:|:------:|---------|
| `create` | — | CostFlow | order_id → str；cost_type 默认 "其他" |

```python
class CostRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db)
        self._model = CostFlow

    def create(self, fields: dict) -> int:
        orm = dict(fields)
        orm["order_id"] = str(orm["order_id"])
        obj = self._model(**orm)
        self.db.add(obj)
        self.db.flush()
        return obj.id

    def exists(self, business_key: str) -> bool:
        return self.db.query(self._model).filter(
            self._model.voucher_no == business_key,
            self._model.is_deleted == False,
        ).first() is not None
```

---

## 四、CollectionRepository

| 方法 | 业务键字段 | 特殊处理 |
|:----:|:----------:|---------|
| `create` | — | flow_id → str |
| `exists` | `receipt_no` | — |

```python
class CollectionRepository(BaseRepository):
    def create(self, fields: dict) -> int:
        orm = dict(fields)
        if orm.get("flow_id"):
            orm["flow_id"] = str(orm["flow_id"])
        obj = Collection(**orm)
        self.db.add(obj)
        self.db.flush()
        return obj.id

    def exists(self, business_key: str) -> bool:
        return self.db.query(Collection).filter(
            Collection.receipt_no == business_key,
            Collection.is_deleted == False,
        ).first() is not None
```

---

## 五、PaymentRepository

| 方法 | 业务键字段 | 特殊处理 |
|:----:|:----------:|---------|
| `create` | — | cost_id → str |
| `exists` | `voucher_no` | — |

```python
class PaymentRepository(BaseRepository):
    def create(self, fields: dict) -> int:
        orm = dict(fields)
        if orm.get("cost_id"):
            orm["cost_id"] = str(orm["cost_id"])
        obj = Payment(**orm)
        self.db.add(obj)
        self.db.flush()
        return obj.id

    def exists(self, business_key: str) -> bool:
        return self.db.query(Payment).filter(
            Payment.voucher_no == business_key,
            Payment.is_deleted == False,
        ).first() is not None
```

---

## 六、SummaryRepository

不涉及 CRUD。Order Summary 不落库（设计决策）。

```python
class SummaryRepository:
    def __init__(self, db):
        self.db = db

    def refresh_for_order(self, order_id: int) -> dict:
        """重新计算指定订单的汇总。"""
        rev = self.db.query(
            func.coalesce(func.sum(IncomeFlow.taxable_amount), 0)
        ).filter(
            IncomeFlow.order_id == str(order_id),
            IncomeFlow.is_deleted == False,
        ).scalar() or 0

        cost = self.db.query(
            func.coalesce(func.sum(CostFlow.taxable_amount), 0)
        ).filter(
            CostFlow.order_id == str(order_id),
            CostFlow.is_deleted == False,
        ).scalar() or 0

        return {"order_id": order_id, "revenue": float(rev), "cost": float(cost)}

    def refresh_batch(self, order_ids: set[int]) -> list[dict]:
        return [self.refresh_for_order(oid) for oid in order_ids if oid]
```

---

## 七、Repository 使用示例

### Engine 中（而非 Repository 中）管理事务

```python
# ✅ 正确：Engine 调用 Repository
def execute_batch(batch_no: str, db: Session) -> dict:
    income_repo = IncomeRepository(db)
    cost_repo = CostRepository(db)

    for flow in flows:
        event = interpret_flow(flow)
        if event.business_object == "IncomeFlow":
            obj_id = income_repo.create(event.field_values)  # ← 调 Repository
            results["created"] += 1
        elif event.business_object == "CostFlow":
            obj_id = cost_repo.create(event.field_values)    # ← 调 Repository
            results["created"] += 1

    SummaryRepository(db).refresh_batch(affected_orders)
    # 事务由 Engine 管理：db.commit() / db.rollback()
```

---

## 八、Repository 验证清单

| 检查项 | 方法 |
|:------|:----|
| Engine 无 ORM import | `grep -r "from app.models" backend/app/routers/erp.py` |
| 所有 create 通过 Repository | 检查 Engine 代码无 `IncomeFlow(` 调用 |
| 所有 exists 通过 Repository | Engine 无 `db.query(IncomeFlow).filter` |
| 字段转换在 Repository 内 | Engine 不调用 `str(order_id)` |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
