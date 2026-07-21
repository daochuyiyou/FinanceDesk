# FinanceDesk 项目定位

> **永久文档 · Single Source of Truth**
> 更新时间：2026-07-04
> 定位：**施工企业经营分析与结算管理平台**（BADR-001）
> 交叉引用：[Business_Rules](./Business_Rules.md) · [Business_Decision_Log](./Business_Decision_Log.md) · [02_Business_Model](./02_Business_Model.md) · [03_Business_Architecture](./03_Business_Architecture.md)

---

## 1. 项目简介

FinanceDesk 是一个面向**中移建设崇左分公司**的施工企业经营分析与结算管理平台，覆盖项目、供应商、订单、流水、回款支付、预算等核心财务管理环节。

## 2. 系统边界

> **明确边界（BADR-001）：不是 ERP；不是 OA；不是项目管理系统。**

| 系统 | 职责 | FinanceDesk 的角色 |
|------|------|-------------------|
| 智慧工程平台（ERP） | 集团级项目/订单/合同管理 | 事实来源，数据同步接收方 |
| FinanceDesk | 部门级经营分析与结算管理 | 数据整合、分析、结算跟踪 |
| OA 系统 | 审批流程 | 不在 FinanceDesk 范围内 |

| 角色 | 职责 | 使用场景 |
|------|------|---------|
| 项目经理 | 项目全生命周期管理 | 创建项目、查看订单流水、监控预算 |
| 财务人员 | 收支流水、回款支付录入 | 导入 Excel、手动录入回款/支付 |
| 公司管理层 | 经营状况总览 | Dashboard 看板、利润分析、应收账龄 |

## 3. 核心价值

1. **替代手工台账**：Excel → 系统化管理，数据统一、可追溯
2. **闭环跟踪**：项目 → 订单 → 收入/成本流水 → 回款/支付，全链路可查
3. **经营分析**：多维度 Dashboard 实时查看项目利润、应收账龄
4. **批量导入**：支持 9 种 Excel 模板批量导入，降低上手门槛

## 4. 非目标

- 不替代中移建设集团级 ERP 系统
- 不涉及外部对账（银行、税务）
- 不提供多租户能力（单公司）

## 5. 演进原则

参照 [09_Roadmap](./09_Roadmap.md) 的阶段规划。所有新增功能必须经过 M0 审计 → M0.5 架构 → M0.8 验证 → M1-M3 分阶段实施的治理管道（详见 [08_Development_Constitution](./08_Development_Constitution.md) 第 4 节）。
