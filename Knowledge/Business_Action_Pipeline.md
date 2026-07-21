# Business Action Pipeline — 业务动作管道

> **BDD-06.8 P3 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **所有模块统一使用该 Pipeline。禁止绕过 Pipeline 直接操作下游。**

---

## 一、Pipeline 定义

Action Pipeline 是 Business Rule Engine 将规则匹配结果转化为**连锁动作**的标准流程。

```
Event
  ↓
① Rule Match — 按 Event Type 查找 Rule Catalog
  ↓
② Condition Check — 执行业务条件判断
  ↓
③ Execute Actions — 协调各 Engine 执行业务操作
  ↓
④ Summary Update — 触发 Order Summary 重新计算
  ↓
⑤ Dashboard Notify — 通知 Dashboard 缓存失效
  ↓
⑥ AI Notify — 将事件推送给 AI Agent（可选）
```

---

## 二、Pipeline 各阶段详述

### ① Rule Match

| 属性 | 说明 |
|:----:|------|
| 输入 | `BusinessEvent.event_type` |
| 匹配方式 | 精确匹配 Rule Catalog 的 `trigger_event` |
| 多规则 | 按 priority 排序，依序执行 |
| 无匹配 | 记录 WARN 日志，Pipeline 继续 |

**伪代码**：
```python
def match_rules(event: BusinessEvent) -> list[BusinessRule]:
    return [
        rule for rule in catalog
        if rule.trigger_event == event.event_type
        and rule.is_active
    ].sorted(key=lambda r: r.priority)
```

### ② Condition Check

| 属性 | 说明 |
|:----:|------|
| 输入 | `BusinessEvent.field_values` |
| 检查方式 | JSON 条件表达式求值 |
| 通过 | 进入下一阶段 |
| 不通过 | 跳过该规则，记录 INFO 日志 |
| 无条件 | 总是执行 |

**条件语法**：
```json
{
  "type": "and",
  "conditions": [
    {"type": "compare", "field": "taxable_amount", "op": ">", "value": 0},
    {"type": "compare", "field": "order_id", "op": "is_not_null"}
  ]
}
```

### ③ Execute Actions

| 属性 | 说明 |
|:----:|------|
| 输入 | 规则定义的 `actions` 列表 |
| 执行方式 | 按序协调各 Engine |
| 错误处理 | 记录 ERROR 日志，不阻断 Pipeline |

**Action 类型**：

| Action | 负责 Engine | 说明 |
|:-------:|:-----------:|------|
| `create_business_object` | Import Engine | 创建业务对象 |
| `update_business_object` | Import Engine | 更新业务对象 |
| `create_reversal` | Import Engine | 创建冲红记录 |
| `logical_delete_all` | Import Engine | 批量逻辑删除 |
| `recalc_order_summary` | Summary Engine | 重新计算订单汇总 |
| `init_order_summary` | Summary Engine | 初始化订单汇总 |
| `update_order_status` | Import Engine | 更新订单状态 |
| `notify_completion` | Notify Gateway | 通知业务完成 |
| `log_rollback` | Audit Gateway | 记录回滚日志 |

### ④ Summary Update

| 属性 | 说明 |
|:----:|------|
| 触发 | `summary_action == "recalc"` 时 |
| 范围 | 按 `matched_order_id` 聚合并重新计算 |
| 处理方 | Summary Engine（Order Summary Model） |
| 落库 | ❌ 不落库，实时计算 |

### ⑤ Dashboard Notify

| 属性 | 说明 |
|:----:|------|
| 触发 | `dashboard_refresh == true` 时 |
| 方式 | 标记 Dashboard 缓存为 stale |
| 效果 | 下次 Dashboard 请求时重新计算 |

### ⑥ AI Notify

| 属性 | 说明 |
|:----:|------|
| 触发 | `ai_trigger == true` 时 |
| 方式 | 事件推送到 AI Message Queue |
| 用途 | AI Agent 可订阅以触发自动分析 |

---

## 三、Pipeline 执行协议

### 同步/异步

| 阶段 | 模式 | 说明 |
|:----:|:----:|------|
| ① Rule Match | 同步 | 立即匹配 |
| ② Condition | 同步 | 立即检查 |
| ③ Actions | 同步 | 在 Import Engine 事务内执行 |
| ④ Summary | 同步 | 在同一事务内计算 |
| ⑤ Dashboard | 异步 | 事务提交后通知 |
| ⑥ AI | 异步 | 事务提交后推送 |

### 事务边界

```
BEGIN TRANSACTION (Import Engine)
  ├── ③ Execute Actions  ← 事务内
  ├── ④ Summary Update   ← 事务内
  └── COMMIT / ROLLBACK
        ↓ (事务提交后)
        ├── ⑤ Dashboard Notify  ← 事务外
        └── ⑥ AI Notify         ← 事务外
```

---

## 四、错误处理

| 场景 | 处理方式 | 影响 |
|:----:|---------|:----:|
| ① Rule Match 无匹配 | WARN 日志 | Pipeline 继续 |
| ② Condition 不满足 | INFO 日志 | 跳过该规则 |
| ③ Action 执行失败 | ERROR 日志 + Import Engine 处理 | 取决于 Import Engine 事务 |
| ④ Summary 计算失败 | ERROR 日志 | 不阻断事务（最终一致） |
| ⑤ Dashboard Notify 失败 | WARN 日志 | Dashboard 最终刷新 |
| ⑥ AI Notify 失败 | WARN 日志 | AI 延迟通知 |

---

## 五、Pipeline 统一入口

```python
class ActionPipeline:
    """业务动作管道 — 所有业务规则的统一执行入口。"""
    
    def execute(self, event: BusinessEvent) -> PipelineResult:
        """执行完整 Pipeline。"""
        # ① Rule Match
        rules = self.rule_engine.match(event)
        
        for rule in rules:
            # ② Condition Check
            if not self.condition_check(rule, event):
                continue
            
            # ③ Execute Actions (within transaction)
            with self.import_engine.transaction():
                for action in rule.actions:
                    self.executor.execute(action, event)
                
                # ④ Summary Update
                if rule.summary_action == "recalc":
                    self.summary_engine.recalc(event.matched_order_id)
            
            # ⑤ Dashboard Notify (async)
            if rule.dashboard_refresh:
                self.dashboard_notifier.mark_stale(event.matched_order_id)
            
            # ⑥ AI Notify (async)
            if rule.ai_trigger:
                self.ai_gateway.push_event(event)
        
        return PipelineResult(...)
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
