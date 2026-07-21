# AHF-04 Event Interface — 事件接口规范

> **AHF-04 P4 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **统一事件输入输出模型。禁止 Engine 之间直接调用，所有跨 Engine 协作通过 Event。**

---

## 一、Event Bus 接口

```python
class EventBus:
    """Event Bus — 事件路由与分发。"""

    def publish(self, event: BusinessEvent) -> None:
        """发布事件到 Event Bus。"""
        ...

    def subscribe(self, event_type: str, handler: Callable) -> None:
        """订阅指定类型的事件。"""
        ...

    def unsubscribe(self, event_type: str, handler: Callable) -> None:
        """取消订阅。"""
        ...
```

---

## 二、Engine 事件接口

### 生产者接口

```python
class EventProducer(ABC):
    """事件生产者 — Engine 实现此接口以发布事件。"""

    @abstractmethod
    def produce_events(self, result: EngineResult) -> list[BusinessEvent]:
        """根据 Engine 执行结果生成事件列表。"""
        ...


class BaseEngineWithEvents(BaseEngine, EventProducer):
    """支持事件生产的 Engine 基类。"""

    def __init__(self, db, event_bus: Optional[EventBus] = None):
        super().__init__(db)
        self.event_bus = event_bus

    def emit(self, event: BusinessEvent) -> None:
        """发布事件到 Event Bus。"""
        if self.event_bus:
            self.event_bus.publish(event)
```

### 消费者接口

```python
class EventConsumer(ABC):
    """事件消费者 — Engine/Service 实现此接口以消费事件。"""

    @abstractmethod
    def handle_event(self, event: BusinessEvent) -> EngineResult:
        """处理到达的事件。"""
        ...
```

---

## 三、事件处理 Pipeline

```
Event Published
    │
    ▼
① Validate Event Schema
    │
    ▼
② Route to Subscribers
    │
    ▼
③ Execute Handler(s)
    │
    ├── Success → Ack
    └── Failed  → Retry / Dead Letter
```

---

## 四、同步 Event 接口（当前模式）

```python
# Engine 中生成同步事件
class ImportEngine(BaseEngine):
    def execute(self, batch_no: str) -> EngineResult:
        repo = IncomeRepository(self.db)
        obj_id = repo.create(fields)
        
        # 生成事件（内存对象）
        event = BusinessEvent(
            event_id=str(uuid4()),
            trace_id=f"import-{batch_no}",
            source="ImportEngine",
            entity="IncomeFlow",
            entity_id=obj_id,
            event_type="IncomeFlow.Created",
            action="Created",
            payload={"order_id": fields["order_id"], "amount": fields["taxable_amount"]},
        )
        
        # 同步消费（调用 Rule Engine）
        rule_result = RuleEngine(self.db).handle_event(event)
        
        return EngineResult(
            success=True, code="SUCCESS",
            message=f"Created {obj_id}",
            data={"event": event, "rule_result": rule_result},
        )
```

---

## 五、异步 Event 接口（预留）

```python
# 异步 Event Handler 注册
event_bus = EventBus()

event_bus.subscribe("IncomeFlow.Created", RuleEngine.handle_event)
event_bus.subscribe("IncomeFlow.Created", SummaryEngine.handle_event)
event_bus.subscribe("CostFlow.Created", SummaryEngine.handle_event)

# 生产者只 publish，不等待消费者
event_bus.publish(event)
```

---

## 六、Event 输入/输出规范

| 方向 | 格式 | 约束 |
|:-----|:-----|:------|
| **输入** | `BusinessEvent` | event_type 必须在 Catalog 注册 |
| **输出** | `EngineResult` | data.events 包含生成的事件列表 |
| **异常** | `EventError` | Schema 校验失败 / 路由失败 |

---

## 七、Event 错误码

| 错误码 | 含义 |
|:-------|:------|
| `EVT-001` | Event Schema 校验失败 |
| `EVT-002` | 未注册的事件类型 |
| `EVT-003` | Payload 缺少必填字段 |
| `EVT-004` | 消费者处理超时 |
| `EVT-005` | 超过最大重试次数（Dead Letter） |

---

## 八、Event 验证清单

| 检查项 | 方法 |
|:-------|:------|
| Engine 之间无直接调用 | `grep "Engine().execute" engines/*.py` 应报 0 |
| 所有跨 Engine 协作通过 Event | 检查 Engine 代码中的 event.publish / event_bus |
| Event 类型在 Catalog 中注册 | Catalog 覆盖全部业务场景 |
| Payload 包含必要字段 | 每个事件类型有 payload 规范 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
