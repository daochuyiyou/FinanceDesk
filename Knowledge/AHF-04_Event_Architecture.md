# AHF-04 Event Architecture — 事件架构标准

> **AHF-04 P1 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **FinanceDesk 全局事件架构。跨 Engine 协作必须通过 Event，禁止 Engine 之间直接调用。**

---

## 一、Event 定位

Business Event 是 FinanceDesk 各 Engine 之间的**唯一异步协作机制**。

| 属性 | 值 |
|:----:|-----|
| 角色 | 跨 Engine 通信载体 |
| 生产者 | Mapping Engine / Import Engine |
| 消费者 | Rule Engine / Summary Engine / Dashboard / AI / Plugin |
| 传递方式 | 同步（事务内）或异步（消息队列预留） |
| 存储 | 内存（当前）→ DB（未来）→ Message Queue（未来） |
| 不可篡改 | 事件一旦生成，不可修改 |

---

## 二、Event 在系统分层中的位置

```
Router (L7)          ── 不生成 Event
Service (L6)         ── ⚠️ 受限（仅在 Engine 上下文中）
Engine (L5)          ── ✅ 生成/消费 Event
Repository (L4)      ── ❌ 不涉及
ORM (L3)             ── ❌ 不涉及
     │
     ▼
Event Bus (L2)
     │
     ▼
Rule Engine ── Summary Engine ── Dashboard ── AI ── Plugin
```

---

## 三、Event 生命周期

```
Created（事件创建）
   │
   ▼
Queued（进入队列）
   │
   ▼
Processing（处理中）
   │
   ├──→ Success（处理成功）
   │        │
   │        ├──→ 触发下游 Event（链式）
   │        └──→ 触发 Summary 更新
   │
   ├──→ Failed（处理失败）
   │        │
   │        └──→ Retry（重试，最多 3 次）
   │                 │
   │                 └──→ Dead Letter（超过重试次数）
   │
   └──→ Rollback（回滚）
            │
            └──→ 生成反向事件（Reverse Event）
```

### 状态说明

| 状态 | 含义 | 转换目标 |
|:-----|:-----|:---------|
| `Created` | 事件已生成 | → Queued |
| `Queued` | 等待处理 | → Processing |
| `Processing` | 正在执行 | → Success / Failed |
| `Success` | 执行成功 | 终态 |
| `Failed` | 执行失败（可重试） | → Processing / Dead Letter |
| `Rollback` | 已回滚 | 终态 |
| `Dead Letter` | 超过重试次数 | 终态（人工干预） |

---

## 四、Event 与 Engine 协作

### 当前：同步 Event（事务内）

```
Import Engine
    │
    ├── execute()
    │       │
    │       ├──→ Create Event: RevenueCreated
    │       ├──→ Repository.create(IncomeFlow)
    │       └──→ Rule Engine 同步匹配规则
    │
    └── commit()  ← 调用方管理
```

### 目标：异步 Event（消息队列）

```
Import Engine
    │
    ├── execute()
    │       └──→ Event Bus.publish(RevenueCreated)
    │
    ▼
Event Bus ──→ Rule Engine ──→ Summary Engine ──→ Dashboard
                 （异步消费）
```

---

## 五、Event 通道

| 通道 | 模式 | 说明 | 当前 |
|:-----|:-----|:------|:----:|
| **同步直连** | Engine → Engine | 事务内直接调用 | ✅ 当前模式 |
| **Event Bus** | Engine → Bus → Engine | 消息队列异步 | 🔜 预留 |
| **DB 持久化** | Event → DB → Consumer | 数据库轮询 | 🔜 预留 |

### 迁移计划

| 阶段 | 模式 | 时序 |
|:----:|:-----|:-----|
| 当前 | 同步直连（Engine 内联调用） | ✅ |
| Phase 1 | 同步 Event（Engine 生成 Event 对象） | ⬅ 本次冻结 |
| Phase 2 | DB 持久化 Event | 未来 |
| Phase 3 | 异步消息队列 | 未来 |

---

## 六、Event 命名规范

| 规则 | 标准 | 示例 |
|:-----|:-----|:------|
| 事件名 | `{BusinessObject}.{Action}` | `IncomeFlow.Created` |
| Action | 过去式 | `Created`, `Updated`, `Reversed`, `RolledBack` |
| 层级 | `{Domain}.{Entity}.{Action}` | `Revenue.IncomeFlow.Created` |
| 长度 | ≤ 64 字符 | — |

### Action 枚举

| Action | 含义 |
|:-------|:------|
| `.Created` | 对象创建 |
| `.Updated` | 对象更新 |
| `.Reversed` | 冲红/冲正 |
| `.RolledBack` | 回滚 |
| `.Imported` | 导入完成 |
| `.Matched` | 匹配成功 |
| `.Closed` | 订单关闭 |
| `.SummaryRefreshed` | 汇总刷新 |
| `.Error` | 异常事件 |

---

## 七、Event 扩展机制

### 新增事件类型

```
1. 在 Event Catalog 注册新事件名（命名规范）
2. 定义 Payload 结构
3. 在生产者 Engine 中生成事件
4. ✅ 完成 — 无需修改 Event Bus
```

### 新增消费者

```
1. 订阅 Event Type
2. 实现消费逻辑
3. ✅ 完成 — 无需修改生产者
```

---

## 八、Event 铁则

| # | 铁则 | 说明 |
|:-:|:-----|:------|
| 1 | **Engine 之间禁止直接调用** | 必须通过 Event |
| 2 | **Event 不可篡改** | 一旦生成，payload 不可修改 |
| 3 | **Event 携带完整上下文** | 消费者不应反查数据库 |
| 4 | **Event 幂等** | 同 Event 多次消费结果一致 |
| 5 | **Event 可追溯** | trace_id 串联事件链 |
| 6 | **禁止 Event → ORM** | Event 不操作数据库 |
| 7 | **禁止 Event → Repository** | Event 不直接数据访问 |

---

## 九、与已冻结标准一致性

| Standard | 符合 | 说明 |
|:---------|:----:|------|
| Business Constitution | ✅ | Event 不修改 ERP Fact |
| BADR | ✅ | BADR-004 Event 作为 Engine 之间桥梁 |
| AHF-01 Repository | ✅ | Event 不操作 ORM |
| AHF-01.5 Dependency | ✅ | Event(L2) 作为 Engine(L5) 之间桥梁 |
| AHF-02 Service | ✅ | Service 可消费 Event（受限） |
| AHF-03 Engine | ✅ | Engine 生成/消费 Event，不直接调其他 Engine |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
