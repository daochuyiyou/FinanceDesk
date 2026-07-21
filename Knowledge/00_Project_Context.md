# FinanceDesk 项目上下文（00_Project_Context.md）

> **本文件是 FinanceDesk 项目唯一入口文档。所有后续 AI 对话只需加载此文件即可获得完整项目上下文。**
> 更新时间：2026-07-05 | 最新 BADR 版本：v1.3（14 条）

---

## 一、产品定位

FinanceDesk 是一个面向 **中移建设崇左分公司** 的施工企业经营分析与结算管理平台。

**不是 ERP / 不是 OA / 不是项目管理系统**（BADR-001）。

### 系统边界

| 系统 | 职责 | FinanceDesk 角色 |
|------|------|-----------------|
| 智慧工程平台（ERP） | 集团级项目/订单/合同管理 | 事实来源，数据同步接收方 |
| FinanceDesk | 部门级经营分析与结算管理 | 数据整合、分析、结算跟踪 |
| OA 系统 | 审批流程 | 不在范围内 |

### 用户角色

| 角色 | 职责 |
|------|------|
| 项目经理 | 项目全生命周期管理 |
| 财务人员 | 收支流水、回款支付录入 |
| 管理层 | 经营状况总览（Dashboard） |

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | FastAPI + SQLAlchemy + SQLite |
| 前端 | React 18 + Ant Design 5 + Vite |
| 部署 | Linux systemd, 用户级服务 |

---

## 二、Business Constitution（最终版）

### 第二章：Core Redlines

| 编号 | 名称 | 内容 |
|:----:|------|------|
| R001 | 订单唯一结算单元 | 所有经营分析以订单为最小粒度 |
| R002 | 仅两种合同类型 | 单项合同 + 框架合同，禁止新增第三种 |
| R003 | ERP 数据只读 | ERP 导入数据不可修改 |
| R004 | 数据来源可追溯 | 每个字段标注 M（人工）/ E（ERP）/ S（系统） |
| R005 | Dashboard 只读分析层 | 禁止 Dashboard 出现录入表单 |
| R006 | 系统自动推导 | 派生指标系统自动计算，禁止人工修改 |
| R007 | Excel 统一标准 | 所有模块统一模板导入/导出 |
| R008 | 成本供应商合同库为 Master Data | 基础资料，不承担业务流程职责 |

### 第三章：Forbidden

| 编号 | 内容 |
|:----:|------|
| F001 | 禁止新增订单之外的结算单元 |
| F002 | 禁止人工修改系统自动推导的指标 |
| F003 | 禁止从 ERP 外部录入 ERP 已有数据 |
| F004 | 禁止删除业务数据（仅软删除） |
| F005 | 禁止在 Dashboard 进行数据录入 |
| F006 | 禁止新增业务对象而不更新 Knowledge |
| F007 | 禁止 Master Data 承担流程职责 |

---

## 三、BADR 决策记录（最终版 v1.3）

| 编号 | 名称 | 核心决策 | 不得违反 |
|:----:|------|---------|---------|
| 001 | 产品定位 | 经营分析平台，不是 ERP/OA/PM | 不添加非定位功能 |
| 002 | 合同模型 | 仅单项合同+框架合同 | 禁止新增第三种 |
| 003 | 订单模型 | 订单唯一结算单元，无数据则无订单 | order_no 为 ERP 主匹配键 |
| 004 | ERP 定位 | ERP 为唯一事实来源，不重复记账 | 不修改 ERP 数据 |
| 005 | 数据来源 | 三分法：人工/ERP/系统 | 新增字段必须标注来源 |
| 006 | Dashboard | 只读分析层，禁止录入 | 不可出现表单/提交 |
| 007 | 供应商模型 | 年度成本供应商合同库 | 不可扩展为 CRM |
| 008 | Excel 标准 | 统一模板导入/导出 | 新增模块必须配套模板 |
| 009 | 单次录入 | 同一事实只录入一次 | 必须去重 |
| 010 | 自动推导 | 派生指标系统计算 | 不可人工修改 |
| 011 | AI 开发原则 | AI 按固定顺序阅读 BADR | 不得违反已确认 BADR |
| 012 | 成本供应商合同库 | Master Data 定位 | 不得承担流程职责 |
| 013 | Business Search | 平台统一能力，全模块复用 | 禁止自建查询逻辑 |
| 014 | 经营数据优先原则 | ERP 保存事实，FD 保存经营过程，Dashboard 分析 | 三层职责永久冻结 |

---

## 四、系统架构

### 四层架构

```
┌─────────────────────────────┐
│       Dashboard             │  ← 只读分析层
│  (提供者: Dashboard Service)  │
├─────────────────────────────┤
│       Summary Layer         │  ← 计算层（不落库）
│  (Revenue Summary / Cost     │
│   Summary / Order Summary)   │
├─────────────────────────────┤
│       Engine Layer          │  ← 业务逻辑层
│  (Order Engine / Revenue     │
│   Engine / Cost Engine /     │
│   Collection Engine /        │
│   Payment Engine /           │
│   ERP Import Engine /        │
│   Business Match Center)     │
├─────────────────────────────┤
│       Repository Layer      │  ← 数据持久层
│  (Contract / Order / Income  │
│   Flow / Cost Flow /         │
│   Collection / Payment /     │
│   ERP Fact)                  │
├─────────────────────────────┤
│       Database (SQLite)      │
└─────────────────────────────┘
```

### 核心原则

| 层次 | 职责 | 禁止 |
|:----:|------|------|
| Repository | 数据 CRUD | 不实现业务逻辑 |
| Engine | 业务逻辑 + 校验 | 不直接暴露给前端 |
| Summary | 经营指标计算（不落库） | 不写数据库 |
| Dashboard | 分析展示 | 不录入数据 |

---

## 五、数据模型

### 核心业务对象关系

```
Contract (project)
  │
  ├── Order (唯一结算单元 R001)
  │     ├── IncomeFlow (收入流水, N:1)
  │     │     └── Collection (回款, 1:N)
  │     └── CostFlow (成本流水, N:1)
  │           └── Payment (付款, 1:N)
  │
  └── ProjectBudget (项目预算)
```

### Mirror Architecture（镜像架构）

```
收入链                   成本链
────────                  ────────
IncomeFlow               CostFlow
  │ (经营字段镜像)          │
  │ invoice_stage          cost_stage
  │ invoice_reason         cost_reason
  │ business_date          business_date
  │ expected_collection    expected_payment
  │ business_owner         business_owner
  │
  ▼                         ▼
Collection                Payment
  │ (1:N)                   │ (1:N)
  │                         │
  ▼                         ▼
Revenue Summary           Cost Summary
  │                         │
  └─────────┬───────────────┘
            ▼
      Order Summary
            │
            ▼
        Dashboard
```

### 主数据对象

| 对象 | 表名 | 核心标识 |
|:----:|:----:|:--------:|
| 合同 | `project` | `contract_no` (CT-YYYY-NNN) |
| 订单 | `order` | `order_no` (甲方编号, ERP 主匹配键) |
| 收入流水 | `income_flow` | `invoice_no` |
| 成本流水 | `cost_flow` | — |
| 回款 | `collection` | `receipt_no` |
| 付款 | `payment` | `voucher_no` |
| 成本合同 | `supplier` / `supplier_contract` | `contract_no` (SC-YYYY-NNN) |
| 单价 | `supplier_unit_price` | 关联成本合同 |
| ERP 事实 | `erp_fact` | `voucher_no` + `import_batch` |

### 编码体系（Identity Standard）

| 编码 | 来源 | 可修改 | ERP 匹配 |
|:----:|:----:|:------:|:--------:|
| contract_no | 人工 | ❌ | 辅助 |
| order_no | **人工** | ❌ | **主匹配键** |
| invoice_no | 人工/ERP | ❌ | ✅ |
| receipt_no | 人工 | ❌ | ✅ |
| voucher_no | 人工 | ❌ | ✅ |

---

## 六、经营指标汇总体系

### Revenue Summary（不落库）

| 指标 | 公式 |
|:----:|------|
| Total Invoice Amount | SUM(IncomeFlow.taxable_amount) |
| Remaining Invoice Amount | Order.amount - Total Invoice |
| Total Collection Amount | SUM(Collection.amount) |
| Remaining Collection Amount (Gap) | Total Invoice - Total Collection |
| Invoice Rate | Total Invoice / Order.amount |
| Collection Rate | Total Collection / Total Invoice |

### Cost Summary（不落库）

| 指标 | 公式 |
|:----:|------|
| Total Cost Amount | SUM(CostFlow.taxable_amount) |
| Total Payment Amount | SUM(Payment.amount) |
| Unpaid Amount | Total Cost - Total Payment |
| Cost Rate | Total Cost / Order.amount |
| Payment Rate | Total Payment / Total Cost |

### Order Summary（不落库，统一入口）

| 指标 | 来源 |
|:----:|:----:|
| Order Amount | Order.amount |
| Revenue | Revenue Summary |
| Cost | Cost Summary |
| Profit | Revenue - Cost |
| Profit Rate | Profit / Order Amount |
| Collection/ Payment | Revenue / Cost Summary |
| Gap | Revenue Summary.Remaining |
| Order Health | 系统推导（正常/风险/异常） |
| Settlement Status | 系统推导（5 种状态） |

### 业务状态推导

| 状态 | 推导方式 | 落库 |
|:----:|:--------:|:----:|
| Revenue Status | 计算（未开票/待回款/部分回款/已回款） | ❌ |
| Cost Status | 计算（待支付/部分支付/已支付） | ❌ |
| Order Health | 计算（正常/风险/异常） | ❌ |
| Settlement Status | 计算（未开始/结算中/待回款/已结清/异常） | ❌ |
| Next Action | 计算（等待录收入/等待收款等） | ❌ |

---

## 七、ERP 集成架构

### 数据流

```
Excel / API
    ↓
Import Batch (batch_no 唯一标识)
    ↓
ERP Fact (只存事实，不计算经营指标)
    ↓ 4 级匹配优先级
Business Match Center
    │ P1: order_no 精确匹配
    │ P2: contract_no + amount
    │ P3: owner_name + business_date
    │ P4: 人工确认
    ↓
Business Object (Income/Cost/Collection/Payment)
    ↓
Order Summary → Dashboard
```

### 匹配状态

| 状态 | 含义 |
|:----:|------|
| UNMATCHED | 未匹配 |
| AUTO_MATCH | 自动匹配成功 |
| MANUAL_MATCH | 人工确认 |
| MULTI_MATCH | 多候选 |
| ERROR | 异常 |

---

## 八、Business Analyzer

Business Analyzer 是 FinanceDesk 的智能分析模块，定位介于 Order Summary 和 Dashboard 之间。

| 职责 | 说明 |
|:----:|------|
| 多维分析 | 合同/订单/收入/成本/回款/付款维度交叉分析 |
| 异常检测 | 回款 > 收入 / 付款 > 成本 / ERP Gap 异常 |
| 趋势预警 | 订单积压 / 回款逾期 / 成本超预算 |
| 状态推导 | Order Health / Settlement Status / Next Action |
| 归因分析 | ERP 差异归因 / 利润波动归因 |

---

## 九、已完成 Sprint

### BAF（Business Architecture Freeze）

| 文件 | 说明 |
|------|------|
| Business_Constitution.md | 业务宪法（3 章 8 Redlines 7 Forbidden） |
| Business_Decision_Log.md | 14 条 BADR |
| Business_Rules.md | 7 大业务规则章节 |
| Business_Master_Data.md | 5 类主数据定义 |
| 03_Business_Architecture.md | 四大业务域划分 |

### BDD-00.5（UI Architecture Freeze）

| 文件 | 说明 |
|------|------|
| UI_Architecture.md | 4 组菜单 + 12 页面职责 |
| Page_Flow.md | 5 张 Mermaid 流转图 |

### BDD-00.8（Data Model Freeze）

| 文件 | 说明 |
|------|------|
| Business_Data_Model.md | 11 业务对象逐字段定义 |
| Entity_Relationship.md | 4 张 Mermaid ER 图 |
| Business_Field_Standard.md | 字段命名标准 |

### BDD-01（合同中心）

| Feature | 状态 | 说明 |
|:-------:|:----:|------|
| F0 Contract Entry Model | ✅ | 录入模型设计 |
| F1 Contract Create | ✅ | POST + contract_no 唯一性 + normalization |
| F1.1 Hotfix | ✅ | 统一命名 ContractCreateDialog |
| F2 Contract List | ✅ | 10 列台账 + order_count |
| F3 Order Detail WS | ✅ | 经营摘要/Next Action/Tabs |

### BDD-02B（订单中心）

| Feature | 状态 | 说明 |
|:-------:|:----:|------|
| F0 Order Entry Model | ✅ | 设计文档 |
| F1 Order Create | ✅ | order_source 推导 + 单项合同限制 |
| F2 Order List | ✅ | 9 列台账 + Settlement Status 预留 |
| F3 Order Detail | ✅ | summary + next-action 端点 |
| F4 Order Edit | ✅ | 双重保护（前端灰显+后端 422） |
| F5 Business Search | ✅ | 统一 Search API（平台级） |

### BDD-03（成本合同库）

| Feature | 状态 | 说明 |
|:-------:|:----:|------|
| 03A Model Freeze | ✅ | Cost Contract + Unit Price 定义 |
| 03B Code Dev | ✅ | 菜单重命名 + 身份字段冻结 |

### BDD-04（收入中心）

| Feature | 状态 | 说明 |
|:-------:|:----:|------|
| 04A Revenue Model | ✅ | 收入对象 + 数据来源 + 状态推导 |
| 04A.1 Enhancement | ✅ | Summary + 经营字段 + BADR-014 |
| 04B Revenue CRUD | ✅ | IncomeFlow 5 新字段 |

### BDD-05（成本/付款中心）

| Feature | 状态 | 说明 |
|:-------:|:----:|------|
| 05A Cost/Pay Model | ✅ | Mirror Architecture 冻结 |
| 05B Cost CRUD | ✅ | CostFlow 5 镜像字段 |
| 05C Payment CRUD | ✅ | 模型完整 |
| 05D Order Summary | ✅ | 10 指标统一计算 |

### BDD-06（ERP 集成）

| Feature | 状态 | 说明 |
|:-------:|:----:|------|
| 06A ERP Fact Model | ✅ | 17 字段原始流水对象 |
| 06B Mapping Engine | ✅ | 4 级匹配优先级 |
| 06C Architecture Review | ✅ | 7 项评审 |
| 06D Match Center | ✅ | 匹配工作台 + Import Batch 模型 |

---

## 十、下一阶段 Roadmap

| 阶段 | 内容 | 优先级 |
|:----:|------|:------:|
| ERP Import 编码 | Excel 导入 → ERP Fact → Mapping Engine → Business Object | 🔴 |
| BDD-07 Dashboard | 经营驾驶舱（经营摘要/Next Action/Timeline） | 🔴 |
| BDD-06 后续 | ERP 差异核对、Gap 分析 | 🟡 |
| 经营分析增强 | Business Analyzer 多维分析 + 异常检测 | 🟡 |
| 预算管理增强 | 预算执行跟踪 + 预警 | 🟢 |

### 永久原则

```
Revenue Summary → Cost Summary → Order Summary → Dashboard
                                       ↑ 单一入口，禁止绕过
```

所有经营指标通过 Summary 层统一计算。禁止任何页面自行计算（BADR-006）。

---

## 附录：项目里程碑清单

| 日期 | 里程碑 | 交付物数 |
|:----:|:------:|:--------:|
| 2026-07-04 | BAF 冻结 | 24 份文档 |
| 2026-07-04 | BDD-00.5 UI 冻结 | +4 份 |
| 2026-07-04 | BDD-00.8 数据模型冻结 | +4 份 |
| 2026-07-04 | BDD-01 合同中心 | 后端+前端 |
| 2026-07-05 | BDD-02B 订单中心 | 后端+前端 |
| 2026-07-05 | BDD-03 成本合同库 | 模型冻结+初步编码 |
| 2026-07-05 | BDD-04 收入中心 | 后端 CRUD |
| 2026-07-05 | BDD-05 成本/付款 | 镜像架构+后端 |
| 2026-07-05 | BDD-06 ERP 集成 | 架构冻结 |
| — | **Knowledge 文档总数** | **147 份** |
