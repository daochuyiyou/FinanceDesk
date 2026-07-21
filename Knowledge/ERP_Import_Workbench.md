# ERP Import Workbench — 导入工作台

> **BDD-06E Phase 2 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **企业级导入体验优先于导入速度。数据可信优先于功能数量。**

---

## 一、定位

ERP Import Workbench 是企业级 ERP 数据导入的统一入口。覆盖从文件上传到导入结果的全流程。

| 属性 | 值 |
|:----:|-----|
| 角色 | 导入工作台（非数据层） |
| 职责 | 上传 → 解析 → 预览 → 匹配 → 影响评估 → 确认 → 结果 |
| 禁止 | ❌ 跳过 Preview / ❌ 未确认直接写库 / ❌ 直接操作业务表 |

---

## 二、完整工作流

```
Upload
  ↓
Field Parse（列映射校验）
  ↓
ERP Fact Preview（解析结果）
  ↓
Business Match Preview（匹配结果）
  ↓
Import Impact Preview（干燥运行 — Dry Run）
  ↓
Confirm Import（确认对话框）
  ↓
Import Result（导入结果）
```

### 流程规则

| 规则 | 说明 |
|:----:|------|
| **不可跳过** | 每一步必须经过，禁止跳过 Preview |
| **Dry Run** | 所有统计基于模拟计算，不写入数据库 |
| **确认后才创建 Batch** | 点击确认后才生成 Import Batch 记录 |
| **确认不可撤销** | 确认后 Batch 不可删除 |

---

## 三、Field Parse

### 输入

| 字段 | 说明 |
|:----:|------|
| Excel 文件 | .xlsx / .xls 格式 |

### 输出

| 项 | 说明 |
|:---:|------|
| 工作表 | 检测到的 Sheet |
| 列映射 | 中文列头 → 英文字段映射状态 |
| 有效行数 | 过滤空行/合计行后的行数 |
| 告警 | 列未匹配、格式异常等 |

---

## 四、ERP Fact Preview

展示解析后的原始数据预览（前 N 条样本）。

| 字段 | 说明 |
|:----:|------|
| occur_date | 发生日期 |
| erp_record_id | 凭证号 |
| summary | 摘要 |
| amount_in | 贷方金额(收入) |
| amount_out | 借方金额(支出) |
| raw_project_name | 项目/业主名称 |

---

## 五、Business Match Preview

引用 BDD-06D 匹配规则：

| 优先级 | 匹配方式 | 说明 |
|:------:|---------|------|
| P1 | `order_no` 精确匹配 | voucher_no == order_no |
| P2 | `contract_no + amount` 组合匹配 | 合同+金额 |
| P3 | `owner_name + business_date` 模糊匹配 | 业主+日期 |
| P4 | 人工确认 | 人工选择 |

---

## 六、Import Impact Preview（Dry Run）

### 13 项评估指标

| # | 指标 | 说明 | 计算方式 |
|:-:|------|------|---------|
| 1 | 总记录数 | 有效行数合计 | `count(*)` |
| 2 | 收入新增数量 | `amount_in > 0` 的记录数 | `count(where amount_in > 0)` |
| 3 | 成本新增数量 | `amount_out > 0` 的记录数 | `count(where amount_out > 0)` |
| 4 | 收款新增数量 | record_type='collection' | `count(where record_type='collection')` |
| 5 | 付款新增数量 | record_type='payment' | `count(where record_type='payment')` |
| 6 | 自动匹配数量 | P1+P2+P3 匹配成功 | 模拟执行匹配引擎 |
| 7 | 人工确认数量 | P4 待确认 | 未匹配数 |
| 8 | 重复数量 | `erp_record_id` 已存在 | `SELECT COUNT(*) FROM erp_staging_flow WHERE erp_record_id IN (...)` |
| 9 | 失败数量 | 金额/日期解析异常 | 校验失败数 |
| 10 | 预计影响订单数量 | 匹配到的唯一 Order 数 | `COUNT(DISTINCT match_order_id)` |
| 11 | 预计更新 Revenue Summary | 涉及 IncomeFlow 的记录数 | `COUNT(where direction='贷方')` |
| 12 | 预计更新 Cost Summary | 涉及 CostFlow 的记录数 | `COUNT(where direction='借方')` |
| 13 | 预计更新 Order Summary | 涉及订单的 Summary 更新数 | `COUNT(DISTINCT order_id)` |

### Dry Run 原则

```
Dry Run（模拟计算）
  ↓
不写入数据库
  ↓
不创建 Batch
  ↓
不锁定数据
  ↓
可重复执行
```

---

## 七、Confirm Dialog

### 确认对话框信息

| 项 | 说明 |
|:--:|------|
| Import Batch | 系统生成的批次号 `IMP-{YYYYMMDD}-{NNN}` |
| 导入文件 | 来源文件名 |
| 总记录数 | 将导入的行数 |
| 预计影响订单 | 将影响的订单数 |
| 风险等级 | LOW / MEDIUM / HIGH（基于失败/重复比例） |

### 风险等级判定

| 条件 | 等级 |
|:----:|:----:|
| 失败率 < 5% 且 重复率 < 10% | 🟢 LOW |
| 失败率 < 20% 或 重复率 < 30% | 🟡 MEDIUM |
| 失败率 >= 20% 或 重复率 >= 30% | 🔴 HIGH |

### 按钮

| 按钮 | 行为 |
|:----:|------|
| **确认导入** | 创建 Batch 记录，数据进入暂存表，返回 Batch No |
| **取消** | 关闭对话框，返回 Impact Preview |

---

## 八、Import Result

### 结果展示

| 项 | 说明 |
|:--:|------|
| ✅ 成功 | 成功导入暂存表的记录数 |
| ❌ 失败 | 导入失败的记录数 |
| 🔄 重复 | 因 `erp_record_id` 唯一约束跳过的记录数 |
| 👤 人工确认 | 标记为 P4 待人工确认的记录数 |
| ⏱ 耗时 | 从上传到确认的总耗时 |
| 📦 Import Batch | 批次号 `IMP-{YYYYMMDD}-{NNN}` |
| 📄 导入日志 | 本次导入的详细日志（可查看） |

### Import Batch 记录

| 字段 | 说明 |
|:----:|------|
| batch_no | `IMP-{YYYYMMDD}-{NNN}` |
| import_time | 确认导入时间 |
| source_file | 来源文件名 |
| import_user | 导入人 |
| total_count | 总记录数 |
| success_count | 成功数 |
| failed_count | 失败数 |
| duplicate_count | 重复数 |
| manual_match_count | 人工确认数 |

---

## 九、API 接口

| 方法 | 路径 | 说明 |
|:----:|------|------|
| POST | `/api/v1/erp/sandbox/upload-preview` | 上传并解析预览 |
| POST | `/api/v1/erp/sandbox/match-preview` | 匹配预览 |
| POST | `/api/v1/erp/sandbox/impact-preview` | Dry Run 影响评估（13 项指标） |
| POST | `/api/v1/erp/sandbox/confirm-import` | 确认导入，创建 Batch |
| GET | `/api/v1/erp/sandbox/import-result/{batch_no}` | 查询导入结果 |
| GET | `/api/v1/erp/sandbox/batches` | 历史 Batch 列表 |

---

## 十、约束

| 规则 | 说明 |
|:----:|------|
| **Dry Run 不写库** | 所有 Preview 操作不写入数据库 |
| **确认不可撤销** | 确认后 Batch 记录不可删除 |
| **Batch 唯一性** | 同一天 Batch No 从 001 开始自增 |
| **日志可追溯** | 每个 Batch 关联完整导入日志 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
