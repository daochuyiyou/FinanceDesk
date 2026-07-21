# FinanceDesk 变更日志

> **永久文档 · Single Source of Truth**
> 更新时间：2026-07-04
> 交叉引用：[09_Roadmap](./09_Roadmap.md) · [10_Technical_Debt](./10_Technical_Debt.md)

---

## 2026-07-04 — 知识库建立

| 变更 | 类型 | 说明 |
|------|------|------|
| Knowledge/ 目录创建 | 架构 | 建立 12 份永久文档，区分永久/阶段性文档 |
| `.hermes.md` 更新 | 文档 | 指向 Knowledge/ 作为新真相源 |
| `docs/` 目录归档 | 归档 | 原始文档保留但不再作为设计依据 |

## 2026-06-30 — RC 阶段

| 变更 | 类型 | 说明 |
|------|------|------|
| 后端 68 测试全部通过 | 测试 | pytest 覆盖 projects/orders/collections/flow/budget/suppliers |
| 前端 9 测试全部通过 | 测试 | Vitest API/组件/页面 |
| Alembic 迁移初始化 | 基础设施 | 12 张表迁移脚本已生成 |
| DB 权限修复 | 运维 | FinanceDesk_Data 归属 zjq 用户 |
| API 联调 45/45 通过 | 验证 | 全部 7 模块 curl 验证 |

## 2026-06-29 — M0-M0.8 阶段

| 变更 | 类型 | 说明 |
|------|------|------|
| 绝对导入重构 | 重构 | 全部 10 router 文件改为绝对导入 |
| 清理死代码 | 清理 | 删除 `schemas/collection.py/` 空目录、`routers/collection.py/f.py`、`frontend_old/` |
| `collection_payment.py` 拆分 | 重构 | 拆为 collection_router + payment_router（独立 prefix） |
| 路由注册 | 功能 | collection 和 payment 路由注册生效 |
| docs/ 基础文档 | 文档 | api-docs.md / data-model-er.md / code-review.md |
| PEP 8 高优修复 | 修复 | E702/E701/E712 + 24 处中低优先 |
| 首版代码纳入版本控制 | 基建 | 62 文件，12,923 行 |

## 2026-07-21 — BA-015 Payment & Supplier Association Frozen

| 变更 | 类型 | 说明 |
|------|------|------|
| CostFlow.supplier_id 改为必填 | 模型 | `nullable=False`，13条存量数据迁移至 supplier_id=1 |
| CostFlowCreate.supplier_id 必选 | Schema | `Optional[int]` → `int`，无供应商时 422 拒绝 |
| CostFlowResponse 新增 supplier_name | Schema | 后端 5 个端点全部 enrich 供应商名称 |
| 成本表单供应商移至主区域 | 前端 | 从高级信息移出，设为必选 `Select` + `required` 规则 |
| 付款表单移除 payee 输入 | 前端 | 隐藏 `payee` 输入框，选择成本流水后自动显示只读供应商名 |
| create_payment 自动填充 payee | 后端 | 根据 `CostFlow.supplier_id` → `Supplier.name` 自动填写 |
| __pycache__ root 占用问题 | 运维 | 发现并记录，需清理后生效 |
