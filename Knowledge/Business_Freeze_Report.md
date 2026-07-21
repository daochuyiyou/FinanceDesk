# Business Architecture Freeze Report

> **BAF 阶段最终交付 · 业务冻结正式声明**
> 生成时间：2026-07-04
> 冻结确认人：（待审批）

---

## 一、BAF 阶段完成状态

| 阶段 | 产出 | 完成 | 评审 |
|:----:|------|:----:|:----:|
| P1 | `Business_Rules.md` — 7 大业务规则章节 | ✅ | ✅ |
| P2 | `Business_Decision_Log.md` — 11 条 BADR | ✅ | ✅ |
| P2 | `Business_Decision_Log_Review.md` | ✅ | ✅ |
| P3 | `Business_Constitution.md` — 6 章业务宪法 | ✅ | ✅ |
| P3 | `Business_Constitution_Review.md` | ✅ | ✅ |
| **最终** | **`Business_Freeze_Report.md`** | **✅** | **（待审批）** |

---

## 二、已冻结业务模型

### 2.1 7 大业务领域

| # | 领域 | 核心实体 | 说明 |
|---|------|---------|------|
| ① | 项目管理 | Project, ProjectBudget | 合同级项目容器 |
| ② | 供应商管理 | Supplier, SupplierContract, SupplierPrice, SupplierYearPrice, SupplierUnitPrice | 年度成本供应商合同库 |
| ③ | 订单管理 | Order | 唯一经营结算单元（**R001**） |
| ④ | 预算管理 | BudgetAdjustment | 项目预算调整（可正可负） |
| ⑤ | 流水管理 | IncomeFlow, CostFlow | 收入和成本按订单维度记录 |
| ⑥ | 回款支付 | Collection, Payment | 回款→收入流水，支付→成本流水 |
| ⑦ | 经营分析 | Dashboard（聚合查询） | 只读分析层（**R005**） |

### 2.2 实体关系

```
Project ──→ Order ──→ IncomeFlow ──→ Collection
                  └──→ CostFlow ────→ Payment
```

- Order 是唯一结算单元（R001）
- 数据流向单向：Project → Order → Flow → Collection/Payment → Dashboard

---

## 三、已冻结业务规则

### 3.1 合同规则（来源：Business_Rules §1）

| 规则 | 红线 |
|------|:----:|
| 仅允许单项合同 + 框架合同 | R002 |
| 框架合同生命周期：框架签订→项目创建→订单→执行→完成 | — |
| 合同与订单的关系由合同类型决定 | — |

### 3.2 订单规则（来源：Business_Rules §2）

| 规则 | 红线 |
|------|:----:|
| 订单是唯一经营结算单元 | **R001** |
| 所有经营数据最终归属订单 | R001 |
| 禁止出现无法归属订单的数据 | R001 + F001/F002 |
| order_no 全局唯一 | — |

### 3.3 数据来源规则（来源：Business_Rules §3）

| 规则 | 红线 |
|------|:----:|
| 所有字段属于三分法：人工/ERP/系统 | **R004** |
| 禁止来源不明确的数据 | R004 |
| 新增字段必须标注来源 | R004 |

### 3.4 ERP 规则（来源：Business_Rules §4）

| 规则 | 红线 |
|------|:----:|
| ERP 是事实来源 | **R003** |
| ERP 数据只导入，不修改 | R003 |
| FinanceDesk 不重复记账 | R003 + F003 |
| 双轨同步架构（暂存表隔离） | — |

### 3.5 Dashboard 规则（来源：Business_Rules §5）

| 规则 | 红线 |
|------|:----:|
| Dashboard 为只读分析层 | **R005** + F004 |
| 禁止录入/状态维护/人工维护统计指标 | R005 |
| Gap 永远由系统自动计算 | **R006** |
| 利润/回款率/成本率/预算执行率自动计算 | R006 |

### 3.6 供应商规则（来源：Business_Rules §6）

| 规则 | 红线 |
|------|:----:|
| 年度成本供应商合同库 | — |
| 一份合同 = 一条记录 | — |
| 不允许一个供应商维护多个年度 | — |

### 3.7 Excel 规则（来源：Business_Rules §7）

| 规则 | 红线 |
|------|:----:|
| 所有模块必须支持统一导入/导出 | **R007** |
| 模板统一，列头一致 | R007 |
| 9 种模板已实现 | — |

---

## 四、已冻结业务决策（BADR）

| BADR | 决策 | 状态 |
|:----:|------|:----:|
| 001 | 产品定位：经营分析与结算管理平台 | 🔒 |
| 002 | 合同模型：仅单项 + 框架合同 | 🔒 |
| 003 | 订单模型：唯一结算单元 | 🔒 |
| 004 | ERP 定位：事实来源，不重复记账 | 🔒 |
| 005 | 数据来源：三分法 | 🔒 |
| 006 | Dashboard：只读分析层 | 🔒 |
| 007 | 供应商模型：年度成本供应商合同库 | 🔒 |
| 008 | Excel 标准：统一模板导入/导出 | 🔒 |
| 009 | 单次录入原则：同一事实只录入一次 | 🔒 |
| 010 | 系统自动推导：派生指标自动计算 | 🔒 |
| 011 | AI 开发原则：阅读顺序 + 遵守 BADR | 🔒 |

---

## 五、已冻结数据来源

| 来源类型 | 标识 | 字段要求 | 维护者 |
|---------|------|---------|--------|
| 人工维护 | `manual` | 前端 CRUD / Excel 导入 | 财务人员 / 项目经理 |
| ERP 导入 | `erp` | 智慧工程平台自动同步，只读 | 系统自动 |
| 系统自动计算 | `system` | Dashboard 聚合 / Gap 计算 | 系统自动 |

### 当前实现状态

| 模型 | source 字段 | 状态 |
|------|------------|:----:|
| Project | 无独立 source | ⚠️ 待补充 |
| Supplier | 无独立 source | ⚠️ 待补充 |
| Order | `erp_no` 隐式标注 | ⚠️ 待显式化 |
| IncomeFlow | 无独立 source | ⚠️ 待补充 |
| CostFlow | 无独立 source | ⚠️ 待补充 |
| Collection | 无独立 source | ⚠️ 待补充 |
| Payment | 无独立 source | ⚠️ 待补充 |
| BudgetAdjustment | `source_type` ✅ | 已有来源追溯 |

---

## 六、已冻结系统边界

### FinanceDesk 负责

- 项目级财务数据管理
- 订单级经营核算
- 收入/成本流水记录
- 回款/支付跟踪
- Dashboard 经营分析
- Excel 批量导入导出
- ERP 数据同步整合

### FinanceDesk 不负责

| 边界 | 说明 |
|------|------|
| 不替代 ERP | 智慧工程平台为事实来源（R003） |
| 不包含 OA 审批 | 审批流程不在范围内 |
| 不包含项目全生命周期管理 | 聚焦财务结算与分析 |
| 不是 CRM | 供应商模块是合同库，非客户管理（BADR-007） |
| 不提供多租户 | 单公司部署 |
| 不涉及外部对账 | 银行/税务对账不在范围内 |

---

## 七、后续允许修改内容

| 类别 | 说明 | 审批要求 |
|------|------|:--------:|
| UI 样式优化 | 不影响业务逻辑 | 无需审批 |
| 性能优化 | 不改变外部行为 | 无需审批 |
| 代码重构 | 不改变业务规则 | 无需审批 |
| 测试补充 | 覆盖率提升 | 无需审批 |
| 技术债修复 | 不涉及业务规则（参见 `10_Technical_Debt.md`） | 无需审批 |
| Bug 修复 | 需确认不违反 Constitution | 无需审批 |
| 导出功能实现 | 当前为已知缺口，需补齐 | 无需审批 |
| 数据来源字段标注 | 在模型上增加 `source_type` 字段 | 需通过治理管道 |

## 八、后续禁止修改内容

| 类别 | 对应红线/BD | 违反后果 |
|------|:-----------:|---------|
| 改变订单结算单元定位 | R001 | 系统模型崩塌 |
| 新增第三种合同类型 | R002 | 规则不一致 |
| ERP 数据可写 | R003 | 数据不一致 |
| 新增无来源标记字段 | R004 | 数据不可信 |
| Dashboard 可录入 | R005 | 分析层被污染 |
| 人工维护计算结果 | R006 | 计算结果不可审计 |
| 模块不支持 Excel | R007 | 用户操作成本高 |
| 绕过订单录收入 | F001 | 经营数据无法对账 |
| 绕过订单录成本 | F002 | 经营数据无法对账 |
| 重复录入 ERP 数据 | F003 | 数据冗余 |
| Dashboard 变录入页 | F004 | 功能蔓延 |
| 双重数据来源 | F005 | 数据不一致 |
| 新增对象不更新 Knowledge | F006 | 知识库滞后 |

---

## 九、Knowledge 目录最终结构

```
Knowledge/
├── 01_Project_Position.md            ← 项目定位（SSoT）
├── 02_Business_Model.md              ← 业务模型（SSoT）
├── 03_Business_Architecture.md       ← 业务架构（SSoT）
├── 04_Data_Model.md                  ← 数据模型（SSoT）
├── 05_Data_Source.md                 ← 数据来源（SSoT）
├── 06_ERP_Integration.md             ← ERP 集成（SSoT）
├── 07_System_Architecture.md         ← 系统架构（SSoT）
├── 08_Development_Constitution.md    ← 开发公约（SSoT）
├── 09_Roadmap.md                     ← 路线图（SSoT）
├── 10_Technical_Debt.md              ← 技术债（SSoT）
├── 11_Change_Log.md                  ← 变更日志（SSoT）
├── 12_AI_Context.md                  ← AI 上下文（SSoT — 入口）
├── Business_Rules.md                 ← 业务规则（BAF P1）
├── Business_Decision_Log.md          ← BADR 决策记录（BAF P2）
├── Business_Decision_Log_Review.md   ← BADR 评审（BAF P2）
├── Business_Constitution.md          ← 业务宪法（BAF P3）
├── Business_Constitution_Review.md   ← 宪法评审（BAF P3）
├── Business_Freeze_Report.md         ← 冻结报告（BAF 最终 — 本文档）
└── Knowledge_Refactoring_Report.md   ← 知识库重构报告
```

**合计：18 份永久文档（12 原始 SSoT + 6 BAF 产出）**

### AI 强制阅读顺序（15 步）

```
① 12_AI_Context
② Business_Constitution           ←── 最高级规范
③ Business_Decision_Log           ←── BADR
④ Business_Rules                  ←── 业务规则
⑤ 01_Project_Position
⑥ 02_Business_Model
⑦ 03_Business_Architecture
⑧ 04_Data_Model
⑨ 05_Data_Source
⑩ 06_ERP_Integration
⑪ 07_System_Architecture
⑫ 08_Development_Constitution
⑬ 09_Roadmap
⑭ 10_Technical_Debt
⑮ 11_Change_Log
```

---

## 十、下一阶段：BDD（Business Driven Development）

### 原则

| 原则 | 说明 |
|------|------|
| 遵守 | 所有开发严格遵循已冻结的 Business Constitution |
| 对齐 | 页面、数据库、API 实现必须与业务规则对齐 |
| 追溯 | 每个字段、每个端点都可追溯至具体业务规则 |
| 差异修正 | 实现与规则的差异，以规则为准修正实现 |

### 优先事项

| 优先级 | 事项 | 对应 |
|--------|------|:----:|
| P0 | 补齐所有模块的 Excel 导出功能 | R007 |
| P1 | 在关键模型上增加 `source_type` 字段标注 | R004 |
| P2 | ERP 生产部署 ETL 流水线 | BADR-004 |
| P3 | MariaDB 迁移 | 技术债 T8 |
| P4 | Dashboard 原生 SQL → ORM 重写 | 技术债 T2 |

---

## 签署

| 角色 | 签署 | 日期 |
|------|:----:|:----:|
| 业务负责人（一游） | （待签署） | 2026-07-04 |
| 技术负责人（Hermes Agent） | ✅ 已完成 | 2026-07-04 |

---

## 附录：BAF 阶段产出汇总

| 文件 | 大小 | 类别 |
|------|:----:|------|
| `Business_Rules.md` | ~12.7 KB | 永久文档 |
| `Business_Decision_Log.md` | ~22.9 KB | 永久文档 |
| `Business_Decision_Log_Review.md` | ~6.6 KB | 评审文档 |
| `Business_Constitution.md` | ~11.8 KB | 永久文档（最高级） |
| `Business_Constitution_Review.md` | ~5.6 KB | 评审文档 |
| `Business_Freeze_Report.md` | ~12.5 KB | 冻结声明（本文档） |
| **合计** | **~72 KB** | **6 份文档** |
