# AHF-03 Engine Interface — 引擎层接口规范

> **AHF-03 P2 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **统一接口：execute / rollback / validate / preview / calculate / notify。统一 Result Model。统一异常体系。**

---

## 一、统一 Result Model

```python
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class EngineResult:
    """所有 Engine 必须返回 EngineResult。禁止返回 dict / ORM / HTTPResponse。"""

    success: bool                         # 是否成功
    code: str                             # 结果码
    message: str                          # 人类可读消息

    data: Optional[dict] = None           # 业务数据
    warnings: list[str] = field(default_factory=list)   # 告警
    errors: list[str] = field(default_factory=list)     # 错误明细
    summary: Optional[dict] = None        # 执行摘要
    duration_ms: float = 0.0              # 执行耗时（毫秒）
```

### 结果码规范

| 结果码 | 含义 | 使用场景 |
|:-------|:-----|:---------|
| `SUCCESS` | 执行成功 | 正常完成 |
| `VALIDATION_ERROR` | 参数校验失败 | validate() 阶段 |
| `BUSINESS_ERROR` | 业务规则违反 | 金额超额等 |
| `MAPPING_ERROR` | 映射失败 | 无法匹配业务对象 |
| `IMPORT_ERROR` | 导入异常 | 数据库写入失败 |
| `RULE_ERROR` | 规则异常 | 规则配置错误 |
| `SUMMARY_ERROR` | 汇总异常 | 计算维度不匹配 |
| `NOT_FOUND` | 数据不存在 | 查询为空 |
| `DUPLICATE` | 重复数据 | 唯一键冲突 |
| `TIMEOUT` | 执行超时 | 超过时限 |

---

## 二、统一异常体系

```python
class EngineException(Exception):
    """所有 Engine 异常的基类。"""
    def __init__(self, code: str, message: str, detail: Any = None):
        self.code = code
        self.detail = detail
        super().__init__(message)


class BusinessError(EngineException):
    """业务规则违反。"""
    def __init__(self, message, detail=None):
        super().__init__("BUSINESS_ERROR", message, detail)


class ValidationError(EngineException):
    """参数校验失败。"""
    def __init__(self, message, detail=None):
        super().__init__("VALIDATION_ERROR", message, detail)


class RuleError(EngineException):
    """规则匹配异常。"""
    def __init__(self, message, detail=None):
        super().__init__("RULE_ERROR", message, detail)


class MappingError(EngineException):
    """映射失败。"""
    def __init__(self, message, detail=None):
        super().__init__("MAPPING_ERROR", message, detail)


class ImportError(EngineException):
    """导入异常。"""
    def __init__(self, message, detail=None):
        super().__init__("IMPORT_ERROR", message, detail)


class SummaryError(EngineException):
    """汇总计算异常。"""
    def __init__(self, message, detail=None):
        super().__init__("SUMMARY_ERROR", message, detail)
```

---

## 三、统一 Engine 接口

```python
class BaseEngine(ABC):
    """所有 Engine 的抽象基类。"""

    def __init__(self, db):
        self.db = db

    @abstractmethod
    def execute(self, **kwargs) -> EngineResult:
        """执行核心业务逻辑。"""
        ...

    @abstractmethod
    def validate(self, **kwargs) -> EngineResult:
        """参数校验。"""
        ...

    def rollback(self, **kwargs) -> EngineResult:
        """回滚（可选覆写）。"""
        raise NotImplementedError

    def preview(self, **kwargs) -> EngineResult:
        """预览（可选覆写）。"""
        raise NotImplementedError

    def calculate(self, **kwargs) -> EngineResult:
        """计算（可选覆写）。"""
        raise NotImplementedError

    def notify(self, **kwargs) -> EngineResult:
        """通知（可选覆写）。"""
        raise NotImplementedError
```

---

## 四、标准接口规范

### execute()

```python
def execute(self, **kwargs) -> EngineResult:
    """执行业务逻辑。

    Args:
        **kwargs: 业务参数（基本类型或 Pydantic Schema）

    Returns:
        EngineResult:
            success=True: 执行成功，data 包含业务结果
            success=False: 执行失败，errors 包含错误信息

    Raises:
        ValidationError: 参数校验失败
        BusinessError: 业务规则违反
    """
    # 1. validate
    # 2. process (call Repository)
    # 3. generate event (if needed)
    # 4. return EngineResult
    ...
```

### validate()

```python
def validate(self, **kwargs) -> EngineResult:
    """参数校验。独立于 execute 调用。

    Returns:
        EngineResult(success=True) 或 EngineResult(success=False, errors=[...])
    """
    ...
```

### rollback()

```python
def rollback(self, record_id: int) -> EngineResult:
    """逻辑回滚。设置 is_deleted=True。

    Returns:
        EngineResult(data={"rolled_back": 1})
    """
    ...
```

### preview()

```python
def preview(self, **kwargs) -> EngineResult:
    """执行前预览/估算影响。不修改数据。

    Returns:
        EngineResult(data={"impact": {...}})
    """
    ...
```

---

## 五、Engine 返回值对比

| 返回类型 | Engine 是否允许 | 说明 |
|:---------|:--------------:|:------|
| `EngineResult` | ✅ **必须** | 标准返回 |
| `dict` | ❌ **禁止** | 应封装到 EngineResult.data |
| ORM 对象 | ❌ **禁止** | 违反 Repository 隔离 |
| `HTTPResponse` | ❌ **禁止** | Engine 不是 HTTP 层 |
| `JSONResponse` | ❌ **禁止** | Engine 不是 HTTP 层 |
| `None` | ⚠️ 受限 | 仅 void 场景 |

---

## 六、Engine 代码模板

```python
# engines/import_engine.py
from app.engines.base import BaseEngine, EngineResult
from app.repositories import IncomeRepository


class ImportEngine(BaseEngine):
    """ERP 导入引擎。"""

    def validate(self, batch_no: str) -> EngineResult:
        if not batch_no or not batch_no.startswith("IMP-"):
            return EngineResult(
                success=False, code="VALIDATION_ERROR",
                message=f"无效 Batch No: {batch_no}"
            )
        return EngineResult(success=True, code="SUCCESS", message="参数有效")

    def execute(self, batch_no: str) -> EngineResult:
        # 1. Validate
        validation = self.validate(batch_no)
        if not validation.success:
            return validation

        # 2. Execute business logic via Repository
        repo = IncomeRepository(self.db)
        obj_id = repo.create({"order_id": 1, "amount": 1000})
        data = {"created_id": obj_id}

        # 3. Return result
        return EngineResult(
            success=True, code="SUCCESS",
            message=f"导入成功: {batch_no}",
            data=data,
            summary={"created": 1, "failed": 0},
        )

    def rollback(self, batch_no: str) -> EngineResult:
        repo = IncomeRepository(self.db)
        repo.rollback_by_invoice_no(batch_no)
        return EngineResult(
            success=True, code="SUCCESS",
            message=f"回滚完成: {batch_no}",
            data={"rolled_back": 1},
        )
```

---

## 七、Engine 接口验证清单

| 检查项 | 方法 |
|:-------|:------|
| 返回 EngineResult | `grep "return {" engines/*.py` 应报 0 |
| 无 ORM import | `grep "from app.models" engines/*.py` 应报 0 |
| 无 HTTP import | `grep "from fastapi" engines/*.py` 应报 0 |
| 无 commit/rollback | `grep "\.commit\|\.rollback" engines/*.py` 应报 0 |
| 无 print | `grep "print(" engines/*.py` 应报 0 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
