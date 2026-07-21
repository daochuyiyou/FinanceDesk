# Repository Architecture — 仓储层架构

> **Engine Sprint 1.1 P1 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-06
> **Engine 不允许直接访问 ORM。所有数据访问通过 Repository。**

---

## 一、定位

Repository Layer 是 Engine 与 ORM 之间的**唯一数据访问层**。

| 属性 | 值 |
|:----:|-----|
| 角色 | 数据访问隔离层 |
| 调用方 | Engine（execute / rollback / status） |
| 被调方 | ORM Model（IncomeFlow / CostFlow 等） |
| 职责 | CRUD + 字段映射 + 存在性检查 + Summary 刷新 |
| 禁止 | ❌ 被 Controller / Router 直接调用 / ❌ 包含业务规则 |

---

## 二、层级关系

```
Router (API)
    ↓
Engine (execute / rollback / status)
    ↓                          ← Engine 只认识 Repository 接口
Repository Layer
    ├── income_repository.py
    ├── cost_repository.py
    ├── collection_repository.py
    ├── payment_repository.py
    └── summary_repository.py
    ↓                          ← Repository 处理 ORM 差异
ORM Models
    ├── IncomeFlow
    ├── CostFlow
    ├── Collection
    ├── Payment
    └── ERPStagingFlow
    ↓
SQLite / PostgreSQL
```

### 禁止路径

```
Engine ──✗──→ ORM Model         ← 禁止
Engine ──✗──→ session.query()   ← 禁止
Engine ──✗──→ Model(**fields)   ← 禁止
```

---

## 三、职责边界

| 层 | 职责 | 不应做的 |
|:--:|------|---------|
| **Engine** | 编排业务逻辑、协调事务 | 直接操作 ORM、字段转换 |
| **Repository** | 数据读写、字段映射、存在性检查 | 业务规则判断、跨表事务 |
| **ORM Model** | 表结构映射、约束 | 业务逻辑、转换逻辑 |

---

## 四、Repository 统一接口

所有 Repository 实现以下接口：

| 方法 | 参数 | 返回 | 说明 |
|:----:|------|:----:|------|
| `create(fields: dict)` | 业务字段键值对 | `int` (新记录 ID) | 创建记录，返回 ID |
| `update(record_id, fields)` | 记录 ID + 更新字段 | `bool` | 更新记录 |
| `rollback(record_id)` | 记录 ID | `bool` | 逻辑删除 |
| `find(record_id)` | 记录 ID | `dict` or `None` | 查找单条 |
| `find_by_business_key(key)` | 业务键（如 erp_record_id） | `int` or `None` | 按业务键查找 ID |
| `exists(business_key)` | 业务键 | `bool` | 存在性检查（去重用） |

---

## 五、字段映射

所有 ORM 字段差异**仅限 Repository 内部处理**。

| 业务字段 | ORM IncomeFlow | ORM CostFlow | 处理位置 |
|:--------:|:--------------:|:------------:|:--------:|
| `order_id` (int) | `VARCHAR(36)` | `VARCHAR(36)` | Repository → `str()` |
| `flow_id` | `VARCHAR(36)` | — | Repository 字符串化 |
| `cost_id` | — | `VARCHAR(36)` | Repository 字符串化 |
| `erp_record_id` | `invoice_no` | — | Engine 不感知 |

### 示例

```python
# Engine 调用（只认业务字段）
repo.create({"order_id": 25, "amount": 100000})

# Repository 内部（处理 ORM 差异）
class IncomeRepository:
    def create(self, fields):
        orm_fields = {k: str(v) if k == "order_id" else v for k, v in fields.items()}
        obj = IncomeFlow(**orm_fields)
        db.add(obj)
        db.flush()
        return obj.id
```

---

## 六、Repository 文件结构

```
backend/app/repositories/
├── __init__.py                    # 统一导出
├── income_repository.py           # IncomeFlow CRUD
├── cost_repository.py             # CostFlow CRUD
├── collection_repository.py       # Collection CRUD
├── payment_repository.py          # Payment CRUD
└── summary_repository.py          # Order Summary 刷新
```

---

## 七、设计约束

| 约束 | 说明 |
|:----:|------|
| **Engine 零 ORM 引用** | Engine 代码中无 `import ...Model` |
| **单一职责** | Repository 只做数据读写，不做业务判断 |
| **字段转换内聚** | 所有 ORM 字段差异在 Repository 内处理 |
| **事务由 Engine 管理** | Repository 不控制事务边界 |
| **无业务规则** | Repository 不包含 if/else 业务逻辑 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
