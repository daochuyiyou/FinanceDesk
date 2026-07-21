# ERP Transaction Model — 导入事务模型

> **BDD-06F P2 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **BEGIN → 全部完成 → COMMIT；任何失败 → ROLLBACK**

---

## 一、事务定义

ERP Import Transaction 是一个**原子操作单元**：将一批已匹配的 ERP 暂存数据，整体写入业务表。

| 属性 | 值 |
|:----:|-----|
| 原子性 | 全部成功 或 全部回滚 |
| 一致性 | 写入前后的业务数据满足所有约束 |
| 隔离性 | 导入过程中业务表可读，但导入数据对其他会话不可见 |
| 持久性 | COMMIT 后数据永久保存 |

---

## 二、事务生命周期

```
              ┌─────────────────────────┐
              │ 确认导入 (Phase 2)       │
              │ Batch Created           │
              └──────────┬──────────────┘
                         ↓
              ┌─────────────────────────┐
              │ BEGIN TRANSACTION       │ ← SQLite/PostgreSQL BEGIN
              └──────────┬──────────────┘
                         ↓
    ┌────────────────────┼────────────────────┐
    ↓                    ↓                    ↓
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│ 1.校验   │     │ 2.分流+创建   │     │ 3.Summary    │
│ Validate │     │ Route+Create │     │ Update       │
└──────────┘     └──────────────┘     └──────────────┘
    ↓                    ↓                    ↓
    └────────────────────┼────────────────────┘
                         ↓
              ┌─────────────────────────┐
              │ 4. Import Log           │
              └──────────┬──────────────┘
                         ↓
              ┌─────────────────────────┐
              │ COMMIT / ROLLBACK       │
              └─────────────────────────┘
```

---

## 三、事务边界

### 事务内操作（全部在一个 DB 事务中）

| # | 操作 | 表 | 说明 |
|:-:|------|:--:|------|
| 1 | 去重检查 | `income_flow` / `cost_flow` / `collection` / `payment` | 检查 `invoice_no`/`voucher_no` 是否已存在 |
| 2 | 创建收入 | `income_flow` | 贷方分流 |
| 3 | 创建成本 | `cost_flow` | 借方分流 |
| 4 | 创建收款 | `collection` | 收款类分流 |
| 5 | 创建付款 | `payment` | 付款类分流 |
| 6 | 更新 Summary | `order` / 其他汇总表 | 重新计算 |
| 7 | 写入日志 | `import_log` | 记录每行结果 |
| 8 | 更新 Batch | `import_batch` | 更新成功/失败统计 |

### 事务外操作（不参与事务）

| 操作 | 说明 |
|:----:|------|
| 上传解析 | Phase 1 |
| 匹配预览 | Phase 1 |
| Impact Preview | Phase 2 (Dry Run) |
| 确认导入 | Phase 2 (创建 Batch) |

---

## 四、错误处理

### 错误类型

| 类型 | 示例 | 处理方式 |
|:----:|------|---------|
| 校验错误 | 金额为空、日期无效 | 跳过该行，记录日志，不中断事务 |
| 业务错误 | 找不到匹配订单 | 跳过该行，标记为 failed |
| 系统错误 | 数据库连接断开 | **立即 ROLLBACK 整个事务** |
| 唯一约束冲突 | 重复的 `invoice_no` | 标记为 duplicate，跳过该行 |

### 错误传播

```python
def execute_import(batch_no: str, db: Session):
    """事务性导入引擎。"""
    try:
        flows = get_staging_flows(batch_no, db)
        
        for flow in flows:
            result = validate_and_route(flow, db)
            if result.status == "ERROR":
                log_result("failed", flow, result.reason, db)
                continue  # 跳过，不中断
            
            business_obj = create_business_object(flow, result.target, db)
            log_result("created", flow, business_obj, db)
        
        update_summaries(flows, db)
        update_batch_stats(batch_no, db)
        db.commit()  # 全部成功 → COMMIT
        return {"status": "success", "total": len(flows)}
    
    except Exception as e:
        db.rollback()  # 系统错误 → ROLLBACK 全部
        return {"status": "rolled_back", "error": str(e)}
```

### 回滚边界

| 场景 | 回滚范围 |
|:----:|---------|
| 单行校验失败 | 跳过该行，不回滚 |
| 唯一约束冲突 | 标记为 duplicate，不回滚 |
| 数据库约束违反 | **整个事务 ROLLBACK** |
| 系统异常 | **整个事务 ROLLBACK** |

---

## 五、幂等性

| 场景 | 幂等保证 |
|:----:|---------|
| 重复执行同一 Batch | 去重检查 → 已验证的记录跳过 |
| 部分执行后重试 | 已写入的记录通过唯一键识别跳过 |
| Rollback 后重新导入 | 逻辑删除的记录可重新导入 |

### 去重策略

```python
def is_already_imported(flow: ERPStagingFlow, db: Session) -> bool:
    """检查该暂存记录是否已导入。"""
    # 按 erp_record_id 查找目标表
    if flow.record_type == "collection":
        return db.query(Collection).filter(
            Collection.receipt_no == flow.erp_record_id
        ).first() is not None
    elif flow.amount_in > 0:
        return db.query(IncomeFlow).filter(
            IncomeFlow.invoice_no == flow.erp_record_id
        ).first() is not None
    # ... 其他表同理
```

---

## 六、并发控制

| 场景 | 策略 |
|:----:|------|
| 同一 Batch 重复执行 | 状态检查 `batch.status != 'completed'` |
| 不同 Batch 同时导入 | 无冲突（不同记录） |
| 导入中手工修改业务表 | 事务隔离级别保证一致性 |

---

## 七、Import Log 模型

| 字段 | 类型 | 说明 |
|:----:|:----:|------|
| id | Integer | 主键 |
| batch_no | String | 关联批次号 |
| staging_flow_id | Integer | 对应暂存记录 |
| action | String | `created` / `skipped` / `failed` / `duplicate` |
| target_table | String | 目标业务表名 |
| target_id | Integer | 目标记录 ID |
| detail | Text | 详细信息 |
| created_at | DateTime | 记录时间 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
