# AHF-03 Engine Standard — 引擎层技术标准

> **AHF-03 P1 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **Engine = 唯一业务规则执行层（Business Execution Layer）。**
> **Engine 永远不知道 ORM、SQL、FastAPI、HTTP。Engine 只处理 Business Object、Repository Interface、Business Event、Business Rule。**

---

## ① Engine 定位

Engine 是 FinanceDesk 的**唯一业务规则执行层**。

| 属性 | 值 |
|:----:|-----|
| 层号 | L5（Router L7 → Service L6 → **Engine L5** → Repository L4 → ORM L3） |
| 角色 | 业务规则执行器、业务编排器 |
| 输入 | Business Event / 业务参数 |
| 输出 | EngineResult（统一结果模型） |
| 数据访问 | 仅通过 Repository |

---

## ② Engine 不负责

| ❌ 不负责 | 说明 |
|:---------|:------|
| HTTP | 不处理 Request/Response |
| ORM | 不 import ORM Model |
| SQL | 不执行 SQL |
| `commit` | 不控制事务提交（由调用方管理） |
| `rollback` | 不控制事务回滚（由调用方管理） |
| Response | 不返回 HTTP Response |
| UI | 不含 UI 逻辑 |
| API | 不是 API 端点 |
| 解析 | 不解析 Excel/CSV |
| 通知 | 不发送通知 |

---

## ③ Engine 只负责

| ✅ 只负责 | 说明 |
|:---------|:------|
| Business Rules | 执行业务规则判断 |
| Business Decision | 做出业务决策 |
| Business Process | 编排业务处理流程 |
| Business Orchestration | 协调多个 Repository |
| Business Event | 生成/消费业务事件 |

---

## ④ Engine 生命周期

```
创建（初始化）
  ↓
execute(params) → EngineResult
  ├── validate()     ← 参数校验
  ├── process()      ← 核心业务逻辑（调 Repository）
  ├── event()        ← 生成 Business Event
  └── notify()       ← 通知下游（可选）
  ↓
返回 EngineResult
  ↓
销毁
```

### 生命周期铁则

| 阶段 | 规则 |
|:-----|:------|
| **创建** | Engine 实例应一次性使用（或方法调用） |
| **执行** | 一次 execute 调用 = 一个业务操作 |
| **销毁** | Engine 不持有长期资源 |

---

## ⑤ Engine 调用关系

```
Service (L6) / Router (L7)
    │
    ▼
Engine (L5)
    │
    ├──→ Repository (L4) ← 唯一数据访问通道
    ├──→ Event (L2)       ← 生成业务事件
    └──→ Rule Engine      ← 业务规则匹配
    │
    ❌──→ ORM             ← 禁止
    ❌──→ SQL             ← 禁止
    ❌──→ HTTP            ← 禁止
    ❌──→ Service         ← 禁止反向
```

### 调用规则

| 调用路径 | 许可 |
|:---------|:----:|
| Service → Engine | ✅ |
| Engine → Repository | ✅ |
| Engine → Event | ✅ |
| Engine → Rule Engine | ✅ |
| Engine → ORM | ❌ **禁止** |
| Engine → Service | ❌ **禁止反向** |
| Engine → Router | ❌ **禁止反向** |
| Engine → Engine | ⚠️ 仅通过 Event 解耦 |

---

## ⑥ Engine 文件组织

```
backend/app/engines/                    # 推荐（未来）
└── ├── mapping_engine.py
    ├── rule_engine.py
    ├── import_engine.py
    └── summary_engine.py

backend/app/routers/erp.py              # 当前（Engine 内联在 Router）
└── execute_batch, rollback_batch       # 需重构到 engines/ 目录
```

### 迁移路线

| 阶段 | 状态 | Engine 位置 |
|:----:|:----:|:-----------|
| 当前 | ⚠️ 临时 | `routers/erp.py` 中内联 |
| 目标 | ✅ 标准 | `engines/*.py` 独立文件 |

---

## ⑦ Engine 命名规范

| 规则 | 标准 | 反例 |
|:----|:-----|:-----|
| 文件名 | `snake_case_engine.py` | `EngineFile.py` |
| 类名 | `PascalCaseEngine` | `engineClass` |
| 方法名 | `execute`, `rollback`, `validate` | `DoStuff()` |
| 返回类型 | `EngineResult` | `dict`, `ORM 对象` |

---

## ⑧ Engine 返回值规范

**所有 Engine 必须返回 `EngineResult`，禁止返回 dict / ORM / HTTPResponse。**

```python
@dataclass
class EngineResult:
    success: bool                        # 是否成功
    code: str                            # 结果码（SUCCESS / VALIDATION_ERROR / ...）
    message: str                         # 人类可读消息
    data: Optional[dict] = None          # 业务数据
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    summary: Optional[dict] = None       # 执行摘要
    duration_ms: float = 0.0             # 执行耗时
```

---

## ⑨ Engine Error 规范

```python
class EngineException(Exception):
    """所有 Engine 异常的基类。"""
    def __init__(self, code: str, message: str, detail: Optional[dict] = None):
        self.code = code
        self.detail = detail
        super().__init__(message)

class BusinessError(EngineException):     # 业务规则违反
class ValidationError(EngineException):   # 参数校验失败
class RuleError(EngineException):         # 规则匹配异常
class MappingError(EngineException):      # 映射失败
class ImportError(EngineException):       # 导入异常
class SummaryError(EngineException):      # 汇总计算异常
```

### 异常使用规范

| 异常 | 使用场景 | 示例 |
|:-----|:---------|:-----|
| `BusinessError` | 业务规则检查失败 | 订单金额超过合同额 |
| `ValidationError` | 参数格式不正确 | 日期格式错误 |
| `MappingError` | 数据映射失败 | 无法匹配业务对象 |
| `ImportError` | 导入过程异常 | 数据库写入失败 |
| `RuleError` | 规则引擎执行异常 | 规则配置错误 |
| `SummaryError` | 汇总计算异常 | 维度不匹配 |

---

## ⑩ Engine 禁止事项（18 条）

| # | ❌ 禁止 | 原因 | 替代 |
|:-:|:--------|:-----|:-----|
| 1 | `import IncomeFlow` (ORM) | 违反 Repository 隔离 | 调 IncomeRepository |
| 2 | `session.commit()` | Engine 不控制事务 | 由调用方管理 |
| 3 | `session.rollback()` | Engine 不控制事务 | 由调用方管理 |
| 4 | `db.query(...)` | 直接 ORM 查询 | 调 Repository |
| 5 | SQLAlchemy `select()` | 直接 ORM | 调 Repository |
| 6 | FastAPI `Request` | Engine 不是 HTTP 层 | 由 Router 传入参数 |
| 7 | FastAPI `Response` | Engine 不返回 HTTP | 返回 EngineResult |
| 8 | `HTTPException` | Engine 不处理 HTTP | 抛 EngineException |
| 9 | `print()` | 非生产日志 | 使用 Logger |
| 10 | UI 逻辑 | 前后端分离 | 由前端处理 |
| 11 | Dashboard 计算 | 属于 Dashboard Engine | 调用 Summary |
| 12 | ERP 解析 | 属于 Parser Service | 调用 Parser |
| 13 | Excel 生成 | 属于 Export Service | 调用 Export |
| 14 | 通知发送 | 属于 Notification Service | 调用通知 |
| 15 | 缓存逻辑 | 属于 Cache Layer | 由 Router/Service 处理 |
| 16 | 直接返回 dict | 违反 Result 规范 | 返回 EngineResult |
| 17 | 调用其他 Engine | 应通过 Event 解耦 | 生成 Event |
| 18 | 持有长期状态 | 线程不安全 | 无状态设计 |

---

## ⑪ Engine 与 Repository 边界

| 方面 | Engine 职责 | Repository 职责 |
|:-----|:-----------|:----------------|
| 数据访问 | 调用 Repository | 执行 CRUD |
| 字段映射 | 不感知 ORM 字段 | 处理 int↔VARCHAR |
| 业务规则 | 负责判断 | 不包含 |
| 事务 | 不管理 | 不管理 |
| 返回值 | EngineResult | ORM dict / int ID |

### 边界铁则

```
Engine → [调 Repository.create()] → 返回 int ID
Engine → [调 Repository.exists()] → 返回 bool
Engine 不知道 ORM 字段名
```

---

## ⑫ Engine 与 Service 边界

| 方面 | Engine 职责 | Service 职责 |
|:-----|:-----------|:-------------|
| 业务规则 | **核心**业务规则 | 非核心编排 |
| 跨 Engine 编排 | 通过 Event | **直接编排** |
| 存在性 | **必须**（核心业务） | 可选（非核心） |
| 调用 Repository | ✅ | ✅ |
| 调用 ORM | ❌ | ❌ |

---

## ⑬ Engine 与 Rule Engine 边界

| 方面 | Engine 职责 | Rule Engine 职责 |
|:-----|:-----------|:-----------------|
| 规则定义 | 使用规则结果 | 匹配规则 |
| 规则存储 | 不关心 | 管理 Rule Catalog |
| 事件 | 生成事件 | 消费事件 |
| 职责 | 执行业务流程 | 执行规则匹配 |

---

## ⑭ Engine 与 Summary Engine 边界

| 方面 | Engine 职责 | Summary Engine 职责 |
|:-----|:-----------|:--------------------|
| 数据写入 | 创建 IncomeFlow/CostFlow | 不写入 |
| 汇总计算 | 触发汇总 | 实时计算 |
| 落库 | ✅ 业务表 | ❌ 不落库 |
| 数据来源 | Repository | Engine 写入的数据 |

---

## ⑮ Engine 与 Dashboard Engine 边界

| 方面 | Engine 职责 | Dashboard Engine 职责 |
|:-----|:-----------|:----------------------|
| 数据生产 | ✅ 生产者 | ❌ 消费者 |
| 数据读取 | 不涉及 | ✅ 只读 |
| ORM 访问 | ❌ | ❌ |
| 计算 | 业务规则 | 经营指标推导 |

---

## 与已冻结标准一致性

| Standard | 符合 | 说明 |
|:---------|:----:|:------|
| Business Constitution | ✅ | Engine 不修改 ERP Fact，不违反 R003 |
| BADR | ✅ | BADR-003 归属订单，Engine 保障 |
| AHF-01 Repository | ✅ | Engine 零 ORM 引用 |
| AHF-01.5 Dependency | ✅ | Engine→Repository 单向 |
| AHF-02 Service | ✅ | Service→Engine 单向，不反向 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
