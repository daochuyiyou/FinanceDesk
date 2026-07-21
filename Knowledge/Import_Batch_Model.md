# Import Batch Model — 导入批次模型

> **BDD-06D P3 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **所有导入必须生成唯一 Batch。**

---

## 一、Import Batch 对象定义

| 字段 | 类型 | NULL | 说明 | 来源 |
|:----:|:----:|:----:|------|:----:|
| batch_no | String(100) | | **批次号**，格式 `IMP-{YYYYMMDD}-{NNN}` | S |
| import_time | DateTime | | **导入时间** | S |
| source_file | String(200) | ✅ | **来源文件名** | M |
| import_user | String(100) | ✅ | **导入人** | M |
| total_count | Integer | | 总记录数 | S |
| success_count | Integer | | 成功导入数 | S |
| failed_count | Integer | | 导入失败数 | S |
| duplicate_count | Integer | | 重复记录数 | S |
| manual_match_count | Integer | | 人工匹配数 | S |

---

## 二、命名规则

| 属性 | 值 |
|:----:|-----|
| 格式 | `IMP-{YYYYMMDD}-{NNN}` |
| 示例 | `IMP-20260705-001` |
| 自增 | 同一天从 001 开始自增 |

---

## 三、生命周期

```
Batch Created（batch_no 生成）
    ↓
ERP Data Read（每条记录挂载 batch_no）
    ↓
Matching（ERP Matching Rules）
    ↓
Batch Closed（success/failed/duplicate/manual_match 统计完成）
    ↓
Batch Archived（统计数据永久保存）
```

---

## 四、约束

| 规则 | 说明 |
|:----:|------|
| 每次导入生成唯一 Batch | 禁止在已有 Batch 上追加 |
| 所有 ERP Fact 记录必须挂载 batch_no | 追溯用 |
| Batch 统计为最终值 | 关闭后不可修改 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
