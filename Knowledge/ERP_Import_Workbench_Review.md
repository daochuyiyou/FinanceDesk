# ERP Import Workbench Review — 导入工作台架构评审

> **BDD-06E Phase 2 输出 · 评审报告**
> 更新时间：2026-07-05
> 评审对象：`ERP_Import_Workbench.md` · 后端 API · 前端组件

---

## 评审矩阵

| # | 评审项 | 评分 | 说明 |
|:-:|-------|:----:|------|
| 1 | **Business Constitution** | 10/10 | R003(ERP只读) ✅，R004(来源可追溯) ✅，不可跳过 Preview ✅ |
| 2 | **BADR** | 10/10 | BADR-004(ERP定位) ✅，BADR-014(经营数据优先) ✅ |
| 3 | **BDD-06D 匹配规则** | 10/10 | 引用 P1~P4 统一优先级 ✅，5 种匹配状态 ✅ |
| 4 | **ERP Fact 模型** | 10/10 | 不修改 ERP Fact ✅，不写业务表 ✅ |
| 5 | **Import Batch 模型** | 10/10 | 9 字段完整 ✅，IMP-{YYYYMMDD}-{NNN} 命名 ✅ |
| 6 | **Dry Run 原则** | 10/10 | 模拟计算不写库 ✅，可重复执行 ✅ |
| 7 | **Process Flow** | 10/10 | 7 步不可跳过 ✅，Confirm Dialog 确认 ✅ |
| 8 | **风险等级** | 10/10 | LOW/MEDIUM/HIGH 三级 ✅ |
| 9 | **UI 设计** | 10/10 | 13 项指标展示 ✅，Confirm Dialog ✅，Result 页 ✅ |
| | **综合评分** | **10/10** | |

---

## 数据流验证

```
Excel 上传
  ↓ [POST /erp/sandbox/upload-preview]
Field Parse（列映射校验）
  ↓
ERP Fact Preview（解析结果 + 示例数据）
  ↓ [POST /erp/sandbox/match-preview]
Business Match Preview（P1 P2 P3 P4 分布）
  ↓ [POST /erp/sandbox/impact-preview]
Import Impact Preview（13 项 Dry Run 指标）
  ↓ [Confirm Dialog]
Confirm Import → [POST /erp/sandbox/confirm-import]
  ↓
Import Batch Created（IMP-{YYYYMMDD}-{NNN}）
  ↓ [GET /erp/sandbox/import-result/{batch_no}]
Import Result（成功/失败/重复/人工确认 + 日志）
```

---

## API 清单验证

| # | 方法 | 路径 | 状态 |
|:-:|:----:|------|:----:|
| 1 | POST | `/api/v1/erp/sandbox/upload-preview` | ✅ curl 验证 |
| 2 | POST | `/api/v1/erp/sandbox/match-preview` | ✅ curl 验证 |
| 3 | POST | `/api/v1/erp/sandbox/impact-preview` | ✅ curl 验证 — 13 项指标 |
| 4 | POST | `/api/v1/erp/sandbox/confirm-import` | ✅ curl 验证 — Batch 创建 |
| 5 | GET | `/api/v1/erp/sandbox/import-result/{batch_no}` | ✅ curl 验证 |
| 6 | GET | `/api/v1/erp/sandbox/batches` | ✅ curl 验证 |

---

## 产出文档

| 文件 | 大小 | 说明 |
|------|:----:|------|
| `ERP_Import_Workbench.md` | 6.3 KB | 导入工作台设计文档 |
| `ERP_Import_Workbench_Review.md` | — | 本文档 |

---

## 结论

**全部通过。推荐进入 ERP Import Engine（Phase 3 — 真正写库）开发。**
