# Business Rule Engine — 业务规则引擎

> **BDD-06.8 P1 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **Rule Engine 不负责 CRUD，仅负责规则执行。Rule Engine 不直接操作数据库，仅协调业务规则执行。**

---

## 一、定位

Business Rule Engine 是 FinanceDesk 的**统一业务规则执行层**。它监听标准业务事件，匹配规则，触发连锁动作。

| 属性 | 值 |
|:----:|-----|
| 角色 | 规则执行协调器（Executor），非数据操作层 |
| 输入 | `BusinessEvent`（标准业务事件） |
| 输出 | 协调的连锁动作（Summary / Dashboard / AI 等） |
| 规则来源 | `Business_Rule_Catalog.md`（统一规则目录） |
| 执行模式 | 事件驱动（Event Driven） |
| 操作数据库 | ❌ 不直接操作，通过 Import Engine / API 执行 |

### 禁止

| 行为 | 后果 |
|:----:|------|
| 规则散落在 CRUD 代码中 | 不可维护，不一致 |
| 直接监听 ERP | 绕过业务校验 |
| 直接操作数据库 | 绕过事务管理 |
| 跳过 Pipeline | 动作不可追踪 |

---

## 二、Event → Rule → Action → Summary 执行链

```
Business Event（来自 Mapping Engine）
    │
    ▼
┌─────────────────────────────┐
│   Rule Engine               │
│                             │
│   1. Rule Match             │ ← 按 Event Type 匹配 Rule Catalog
│   2. Condition Check         │ ← 业务条件判断
│   3. Execute Actions         │ ← 协调各 Engine 执行
│   4. Summary Update          │ ← 触发 Summary recal
│   5. Dashboard Notify        │ ← 通知 Dashboard 刷新
│   6. AI Notify               │ ← 未来 AI Agent 入口
└─────────────────────────────┘
    │
    ▼
Coordinated Actions（跨 Engine 协调）
```

### 各步骤职责

| 步骤 | 职责 | 处理方 |
|:----:|------|:------:|
| **Rule Match** | 按 Event Type 查找匹配规则 | Rule Engine |
| **Condition Check** | 验证业务条件是否满足 | Rule Engine |
| **Execute Actions** | 协调各 Engine 执行业务操作 | Import Engine / API |
| **Summary Update** | 触发 Order Summary 重新计算 | Summary Engine |
| **Dashboard Notify** | 通知 Dashboard 数据变更 | Dashboard Notifier |
| **AI Notify** | 将事件推送给 AI Agent | AI Gateway |

---

## 三、Rule Engine 与各 Engine 关系

```
Mapping Engine ──→ Business Event ──→ Rule Engine
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
            Import Engine           Summary Engine          AI Gateway
                    │                       │                       │
                    ▼                       ▼                       ▼
          Business Object           Order Summary            Agent Notify
          (Income/Cost/...)        (实时计算)
                    │                       │
                    └───────────┬───────────┘
                                ▼
                        Dashboard
```

### 职责边界

| Engine | 职责 | 写库 |
|:------:|------|:----:|
| **Mapping Engine** | 将 ERP 数据转换为标准事件 | ❌ |
| **Rule Engine** | 匹配规则，协调动作 | ❌ |
| **Import Engine** | 事务性执行业务写入 | ✅ |
| **Summary Engine** | 实时计算经营指标 | ❌（不落库） |
| **Dashboard** | 只读分析展示 | ❌ |

---

## 四、Rule Execution 协议

### 输入

```python
@dataclass
class RuleExecutionInput:
    event: BusinessEvent          # 触发事件
    rule: BusinessRule            # 匹配到的规则
    db: Session                   # 数据库会话（只读/写入通过 Engine）
```

### 输出

```python
@dataclass
class RuleExecutionResult:
    rule_id: str
    event_id: str
    actions_executed: list[str]   # 已执行的动作列表
    summary_updated: bool         # Summary 是否更新
    dashboard_notified: bool      # Dashboard 是否通知
    ai_notified: bool             # AI 是否通知
    errors: list[str]             # 执行中的错误（非阻断）
```

---

## 五、设计约束

| 约束 | 说明 |
|:----:|------|
| **事件驱动** | Rule Engine 仅响应 BusinessEvent，不主动轮询 |
| **规则配置化** | 所有规则来自 Rule Catalog，不硬编码 |
| **无 CRUD** | Engine 不直接写数据库，通过 Import Engine |
| **可扩展** | 新增规则只需加 Catalog 行 |
| **无阻塞** | 规则执行失败不阻断 Import Engine 事务 |
| **AI 入口** | Rule Engine 为未来 AI Agent 的唯一业务入口 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
