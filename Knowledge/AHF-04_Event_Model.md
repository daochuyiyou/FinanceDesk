# AHF-04 Event Model — 标准业务事件模型

> **AHF-04 P2 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **统一 BusinessEvent 模型定义。包含 event_id、trace_id、payload 等 13+ 字段。**

---

## 一、BusinessEvent 模型

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional


@dataclass
class BusinessEvent:
    """标准业务事件 — 所有 Engine 之间协作的原子单元。"""

    # ── 事件标识 ──
    event_id: str                          # UUID，全局唯一
    trace_id: str                          # 追踪链 ID（串联整个业务流程）
    parent_event_id: Optional[str] = None  # 父事件 ID（用于事件链追溯）

    # ── 业务归属 ──
    batch_no: Optional[str] = None         # 归属导入批次（ERP Import 场景）
    source: str                            # 事件来源（Engine 名 / Service 名）
    entity: str                            # 业务实体名（IncomeFlow / CostFlow / Order）
    entity_id: Optional[int] = None        # 业务实体 ID

    # ── 事件类型 ──
    event_type: str                        # 事件类型标识（如 "IncomeFlow.Created"）
    action: str                            # 动作（Created / Updated / Reversed / RolledBack）

    # ── 数据 ──
    payload: dict = field(default_factory=dict)       # 业务数据（JSON）
    metadata: dict = field(default_factory=dict)      # 元数据（trace 信息、版本等）

    # ── 时间戳 ──
    created_at: datetime = field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None       # 创建者（system / user / ai）
```

---

## 二、字段说明

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|------|
| `event_id` | `str` (UUID) | ✅ | 全局唯一事件 ID |
| `trace_id` | `str` (UUID) | ✅ | 追踪链 ID，同一次业务流程 trace_id 一致 |
| `parent_event_id` | `str` / `None` | ❌ | 父事件 ID，用于事件链构建 |
| `batch_no` | `str` / `None` | ❌ | ERP 导入批次号 |
| `source` | `str` | ✅ | 生产者标识（如 `ImportEngine`） |
| `entity` | `str` | ✅ | 业务实体名（如 `IncomeFlow`） |
| `entity_id` | `int` / `None` | ❌ | 业务记录 ID |
| `event_type` | `str` | ✅ | 完整事件类型（如 `IncomeFlow.Created`） |
| `action` | `str` | ✅ | 动作（`Created` / `Updated` / `Reversed` / `RolledBack`） |
| `payload` | `dict` | ✅ | 业务数据（最少包含必要字段） |
| `metadata` | `dict` | ✅ | 元数据 |
| `created_at` | `datetime` | ✅ | 创建时间戳 |
| `created_by` | `str` / `None` | ❌ | 创建者 |

---

## 三、Payload 最小规范

### IncomeFlow.Created

```json
{
  "event_type": "IncomeFlow.Created",
  "payload": {
    "order_id": 25,
    "invoice_no": "CG-2025-001",
    "taxable_amount": 100000.00,
    "matched_batch_no": "IMP-20260705-001"
  }
}
```

### CostFlow.Created

```json
{
  "event_type": "CostFlow.Created",
  "payload": {
    "order_id": 25,
    "cost_type": "ERP导入",
    "taxable_amount": 50000.00
  }
}
```

### Order.SummaryRefreshed

```json
{
  "event_type": "Order.SummaryRefreshed",
  "payload": {
    "order_id": 25,
    "revenue_amount": 100000.00,
    "cost_amount": 50000.00
  }
}
```

---

## 四、Metadata 规范

| 元数据字段 | 说明 |
|:-----------|:------|
| `version` | Event 模型版本号 |
| `source_ip` | 生产者 IP（未来） |
| `user_agent` | 客户端标识（未来） |
| `latency_ms` | 处理耗时（未来） |
| `retry_count` | 重试次数（未来） |

---

## 五、Event 示例

```python
event = BusinessEvent(
    event_id="evt-001a-20260706-xxxx",
    trace_id="trace-20260706-001",
    source="ImportEngine",
    entity="IncomeFlow",
    entity_id=42,
    event_type="IncomeFlow.Created",
    action="Created",
    payload={
        "order_id": 25,
        "invoice_no": "CG-2025-001",
        "taxable_amount": 100000.00,
    },
    metadata={"version": "1.0"},
    created_by="system",
)
```

---

## 六、Event 不可变原则

| 规则 | 说明 |
|:-----|:------|
| **event_id 不可变** | 一旦生成不可修改 |
| **payload 不可变** | 消费者不得修改 payload |
| **trace_id 不可变** | 链上所有事件 trace_id 一致 |
| **created_at 不可变** | 生成时写入，不可后改 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
