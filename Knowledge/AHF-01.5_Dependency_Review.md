# Dependency Review — 层间依赖一致性评审

> **AHF-01.5 P3 输出 · 评审报告**
> 更新时间：2026-07-06
> **评审对象：Architecture_Dependency.md · Layer_Call_Matrix.md**

---

## 评审矩阵

| # | 评审项 | 评分 | 说明 |
|:-:|-------|:----:|------|
| 1 | **Business Constitution** | 10/10 | R001(订单结算) ✅ Engine 为业务入口；R003(ERP只读) ✅ Repository 隔离 ERP；R004(可追溯) ✅ 调用方向清晰可追溯 |
| 2 | **BADR** | 10/10 | BADR-003(归属订单) ✅；BADR-004(ERP数据管道) ✅ Repository 隔离；BADR-014(经营优先) ✅ Dashboard 通过 Engine 读取 |
| 3 | **Repository Standard** | 10/10 | Repository 是唯一 ORM 访问层 ✅；Repository 禁止反向调用 ✅；禁止交叉调用 ✅ |
| 4 | **ERP Engine** | 10/10 | Engine→Repository→ORM 链已实现 ✅；Router→Engine 直接调用已存在 ✅ |
| 5 | **Dashboard 一致性** | 10/10 | Dashboard 禁止直接访问 ORM ✅；Dashboard 必须通过 Engine/Service ✅ |
| 6 | **Mirror Architecture** | 10/10 | Revenue/Cost 对称调用路径 ✅ |
| 7 | **Architecture Roadmap** | 10/10 | L1~L3 分层与 Roadmap 一致 ✅；AHF-01→01.5→02 依赖顺序合理 ✅ |

| | **综合评分** | **10/10** | |

---

## 逐项审查

### 1. Business Constitution

| 条款 | 符合 | 证据 |
|:----:|:----:|------|
| R001 订单归属 | ✅ | Engine 调用 Repository，Repository 始终携带 order_id |
| R003 ERP 只读 | ✅ | Router→Engine→Repository 三层隔离 |
| R004 来源可追溯 | ✅ | 单向调用链层层可追踪 |
| R006 自动计算不落库 | ✅ | Summary 通过 Engine 读取，不直接调用 ORM |

### 2. Repository Standard

| 要求 | 符合 | 证据 |
|:-----|:----:|------|
| Repository 唯一 ORM 层 | ✅ | 矩阵中仅 Repository 标记为 ORM✅ |
| Engine 零 ORM | ✅ | 矩阵中 Engine→ORM = ❌ |
| 禁止交叉 Repository | ✅ | Repository→Repository = ❌ |

### 3. ERP Engine 一致性

| 现有实现 | 符合 | 说明 |
|:---------|:----:|------|
| Router→Engine | ✅ | engine_execute 路由直接调用 Engine |
| Engine→Repository | ✅ | _create_business_object 调 IncomeRepository |
| Engine→ORM ❌ | ✅ | execute_batch 无 ORM import |

### 4. 未来模块支撑

| 模块 | 调用链 | 合规 |
|:-----|:-------|:----:|
| BDD-07 Dashboard | Dashboard→Service→Engine→Summary | ✅ |
| AI 分析 | AI→Engine→Summary | ✅ |
| 第三方 ERP | Plugin→Repository (Plugin Repo) | ✅ |
| 移动端 | Router→Service→Engine→Repository | ✅ |

---

## 未通过项

**无。全部 7 项评分 10/10。**

---

## 结论

**全部通过。Architecture Dependency Freeze 完成。允许进入 AHF-02（Service Standard）。**
