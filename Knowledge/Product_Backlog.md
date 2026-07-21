# Product Backlog — FinanceDesk

> 治理模式：Product Governance V1
> 唯一任务来源：本 Backlog

---

## 优先级定义

| 级别 | 含义 | 处理规则 |
|------|------|---------|
| **P0** | 阻塞性 / 核心流程断裂 | 当前 Sprint 必须完成 |
| **P1** | 重要但不阻塞 | 按顺序处理 |
| **P2** | 锦上添花 | 空闲时处理 |

## 各页面对应版本

| 页面 | 当前版本 | 状态 | 优先级 | 待办 |
|------|---------|------|--------|------|
| **Dashboard** | V1.0 | ✅ Frozen | — | 无 |
| **收入管理** | V1.0 | ✅ Frozen | — | 无 |
| **成本执行** | V1.0 | ✅ Frozen | — | 无 |
| **收款管理** | V1.0 | ✅ Frozen | — | 无 |
| **付款管理** | V1.0 | ✅ Frozen | — | 无 |
| **预算管理** | V1.0 | ✅ Frozen | — | 无 |
| **BusinessAnalyzer** | V1.0 | ✅ Frozen | — | 无 |
| **DictSelect/ObjectSelector** | V1.0 | ✅ Frozen | — | 无 |

---

## P1（重要）

| # | 页面 | 说明 | 依赖 | 建议 Sprint |
|---|------|------|------|------------|
| P1-01 | **数据字典中心** | UX-007：新增基础资料→数据字典页面，CRUD 管理字典项 | 无 | PS-012 |
| P1-02 | **成本主体升级** | UX-006：供应商→成本主体，支持单位/个人/班组/机械类型；付款引用成本主体 | UX-007 | PS-013 |

## P2（锦上添花）

| # | 页面 | 说明 | 依赖 |
|---|------|------|------|
| P2-01 | **全站 UI 统一（剩余）** | UX-008 未完成项：ContractBusinessWorkbench、OrderDetail、CollectionPage 等旧页面 | P1 完成后 |
| P2-02 | **人员管理** | 基础数据→人员 CURD，当前人员数占位为 0 | 无 |
| P2-03 | **数据集成首页** | 将 DataHub 重构为财务集成总览 | P1 完成后 |

---

## 待定（需原型评审）

| # | 页面 | 说明 | 状态 |
|---|------|------|------|
| TBD-01 | **合同工作台重构** | ContractBusinessWorkbench 需遵循 UI Standard | 待原型 |
| TBD-02 | **订单详情重构** | OrderDetail 需遵循 UI Standard | 待原型 |
| TBD-03 | **财务集成** | DataHub 页面重构 | 待原型 |

---

## 入板规则

1. 只有经过产品负责人确认的页面才能进入 Backlog
2. 每个 Backlog 项必须包含：优先级、页面名称、说明
3. 进入 Sprint 前必须完成原型 + Checklist

## 出板规则

1. Prototype + Checklist + Review 通过 → 进入 Develop
2. Develop → Verify → Freeze → 从 Backlog 移除（标记 Frozen）
3. 冻结后布局调整 → 以新版本号重新入板
