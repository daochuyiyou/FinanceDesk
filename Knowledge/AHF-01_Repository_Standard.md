# AHF-01 Repository Standard — 仓储层技术标准

> **AHF P1 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **本文件是 FinanceDesk Repository 层的最高技术标准。所有 Repository 实现必须遵循本文件。**
> **如有冲突，Business Constitution 优先。**

---

## 一、Repository 定位

Repository Layer 是 Engine 与 ORM 之间的**唯一数据访问层**。

| 属性 | 值 |
|:----:|-----|
| 角色 | 数据访问隔离层 |
| 调用方 | Engine 层（严禁被 Router / Controller 直接调用） |
| 被调方 | ORM Model |
| 职责 | CRUD + 字段映射 + 存在性检查 |
| 事务 | ❌ 不控制事务边界（由 Engine 管理） |
| 业务规则 | ❌ 不包含 if/else 业务逻辑 |

---

## 二、Repository 职责边界

| 职责 | 属于 Repository | 不属于 Repository |
|:-----|:---------------:|:-----------------:|
| CRUD 操作 | ✅ | — |
| 字段类型转换（int↔VARCHAR） | ✅ | — |
| 存在性检查（去重） | ✅ | — |
| 逻辑删除（is_deleted） | ✅ | — |
| 业务规则判断 | — | ❌ 属于 Engine |
| 事务提交/回滚 | — | ❌ 属于 Engine |
| 业务事件生成 | — | ❌ 属于 Mapping Engine |
| Summary 计算 | — | ❌ 属于 Summary Engine |

---

## 三、Engine 与 Repository 调用关系

```
Engine (execute / rollback / status)
    │
    ├── IncomeRepository(db).create(fields)       → ORM
    ├── CostRepository(db).create(fields)          → ORM
    ├── CollectionRepository(db).create(fields)    → ORM
    ├── PaymentRepository(db).create(fields)       → ORM
    ├── IncomeRepository(db).exists(biz_key)       → ORM (去重)
    ├── IncomeRepository(db).rollback(record_id)   → ORM (is_deleted)
    └── SummaryRepository(db).refresh_batch(ids)   → ORM (实时计算)
```

### 调用规则

| 规则 | 说明 |
|:----:|------|
| **Engine → Repository** | ✅ 允许 |
| **Engine → ORM** | ❌ 禁止 |
| **Router → Repository** | ❌ 禁止 |
| **Service → Repository** | ✅ 允许（如果 Service 层存在） |
| **Repository → Repository** | ❌ 禁止交叉调用 |

---

## 四、Repository 统一接口规范

### 抽象基类

```python
class BaseRepository(ABC):
    def __init__(self, db): ...

    @abstractmethod
    def create(self, fields: dict) -> int: ...         # 返回新记录 ID
    @abstractmethod
    def update(self, id: int, fields: dict) -> bool: ... # 返回是否成功
    @abstractmethod
    def rollback(self, id: int) -> bool: ...              # 逻辑删除
    @abstractmethod
    def find(self, id: int) -> Optional[dict]: ...        # 返回 dict 或 None
    @abstractmethod
    def find_by_business_key(self, key: str) -> Optional[int]: ... # 返回 ID
    @abstractmethod
    def exists(self, key: str) -> bool: ...              # 去重检查
```

### 参数/返回值规范

| 方法 | 输入规范 | 输出规范 |
|:----:|---------|---------|
| `create` | 字段 dict，键为**业务字段名**（非 ORM 字段名） | `int`（新记录 ID） |
| `exists` | 业务键值（如 erp_record_id） | `bool` |
| `rollback` | 记录 ID | `bool` |
| `find` | 记录 ID | `dict`，键为 ORM 列名 |

---

## 五、字段映射规范

所有 ORM 字段差异**仅允许在 Repository 内部处理**。

| 业务字段 | ORM 类型 | Repository 转换 |
|:--------:|:--------:|:---------------:|
| `order_id` (int) | `VARCHAR(36)` | `str(order_id)` |
| `flow_id` (int) | `VARCHAR(36)` | `str(flow_id)` |
| `cost_id` (int) | `VARCHAR(36)` | `str(cost_id)` |

### 转换位置

```python
# ✅ Repository 内部转换
class IncomeRepository(BaseRepository):
    def create(self, fields: dict) -> int:
        orm = dict(fields)
        orm["order_id"] = str(orm["order_id"])  # 转换在此
        obj = IncomeFlow(**orm)
        self.db.add(obj)
        self.db.flush()
        return obj.id

# ❌ Engine 中转换（禁止）
def execute(...):
    fields["order_id"] = str(fields["order_id"])  # 禁止
```

---

## 六、Repository 文件组织规范

```
backend/app/repositories/
├── __init__.py                  # 统一导出所有 Repository
├── base.py                      # BaseRepository 抽象基类
├── income_repository.py         # IncomeFlow CRUD
├── cost_repository.py           # CostFlow CRUD
├── collection_repository.py     # Collection CRUD
├── payment_repository.py        # Payment CRUD
└── summary_repository.py        # Order Summary（不落库）
```

### 命名规范

| 规则 | 标准 | 反例 |
|:----:|:----:|:----:|
| 文件名 | `snake_case` + `_repository.py` | `IncomeRepo.py` |
| 类名 | `PascalCase` + `Repository` | `income_repo` |
| 方法名 | `snake_case` | `CreateRecord` |

---

## 七、Repository 禁止事项

| 禁止 | 原因 | 替代方案 |
|:----|:-----|---------|
| ❌ 被 Router/Controller 直接调用 | 破坏分层 | 通过 Engine 调用 |
| ❌ 包含业务规则判断 | 违反单一职责 | 放到 Engine |
| ❌ 控制事务（commit/rollback） | 事务应由 Engine 管理 | Engine 管理事务 |
| ❌ 交叉调用其他 Repository | 增加耦合 | 由 Engine 编排 |
| ❌ 直接返回 ORM 对象 | 破坏隔离 | 返回 dict 或 int |
| ❌ 包含计算逻辑 | 违反职责 | 放到 Summary Engine |
| ❌ 引用 Engine 或 Service | 循环依赖 | 单向依赖 |

---

## 八、ORM 使用规范

| 规范 | 说明 |
|:----|------|
| **Repository 是唯一使用 ORM 的层** | Engine 和 Service 不得 import ORM Model |
| **仅使用 SQLAlchemy ORM 模式** | 禁止 raw SQL |
| **逻辑删除统一使用 `is_deleted`** | 禁止 `DELETE FROM` |
| **查询必须过滤 `is_deleted == False`** | 防止读取已删除数据 |
| **字段类型转换在 Repository 内** | Engine 不处理类型差异 |

---

## 九、与 Business Constitution 一致性

| 条款 | 要求 | 符合 |
|:----:|------|:----:|
| R003 | ERP 数据只读 | ✅ Repository 不修改 ERP Fact |
| R004 | 来源可追溯 | ✅ 所有 create 返回可追踪 ID |
| R006 | 自动计算不落库 | ✅ SummaryRepository 实时计算 |

---

## 十、与 BADR 一致性

| 决策 | 符合 |
|:----:|:----:|
| BADR-003 归属订单 | ✅ 所有 Repository CRUD 基于 order_id |
| BADR-004 ERP 数据管道 | ✅ Repository 隔离 ERP Fact |
| BADR-014 经营优先 | ✅ Repository 不包含经营计算 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | AHF-01 初始编制 |
