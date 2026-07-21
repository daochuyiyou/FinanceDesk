# Knowledge Refactoring Report

> **知识库重构报告**
> 生成时间：2026-07-04
> 执行人：Hermes Agent

---

## 一、原有文档统计

### 文档清单

| # | 文件路径 | 大小 | 类型 | 内容概述 |
|---|---------|------|------|---------|
| 1 | `/workspace/source/.hermes.md` | ~9.5KB | 锚点 | 项目全貌（技术栈/目录/模型/路由/状态） |
| 2 | `/workspace/source/api-docs.md` | ~9.9KB | **重复** | API 接口文档（27 paths，10 模块） |
| 3 | `/workspace/source/data-model-er.md` | ~8.5KB | **重复** | 数据模型 ER 图（12 模型） |
| 4 | `/workspace/source/code-review.md` | ~9.8KB | 阶段性 | 代码规范审查报告（含架构评价 5.1-5.5 节） |
| 5 | `/workspace/source/docs/api-docs.md` | ~9.9KB | **重复** | 同上，含"生成时间" |
| 6 | `/workspace/source/docs/data-model-er.md` | ~9.0KB | **重复** | 同上，含"生成时间"+更详细中文描述 |
| 7 | `/workspace/source/docs/code-review.md` | ~9.8KB | 阶段性 | 代码审查（**缺少**架构评价 5.1-5.5 节） |

### 重复检测

| 重复组 | 文件 | 差异 |
|--------|------|------|
| **A 组** | `api-docs.md` (根) + `docs/api-docs.md` | 内容基本一致，docs/ 版本多一行"生成时间" |
| **B 组** | `data-model-er.md` (根) + `docs/data-model-er.md` | 内容一致，docs/ 版本更详细（中文关系描述） |
| **C 组** | `code-review.md` (根) + `docs/code-review.md` | **内容不完全一致**：根版本含完整"架构与设计总体评价"（5.1-5.5节），docs/ 版本缺失此部分 |

### 未生成文档（.hermes.md 中有引用但磁盘上不存在）

| 引用路径 | 原因 |
|---------|------|
| `docs/package-guide.md` | 计划中，未实际生成 |
| `docs/router-status.md` | 计划中，未实际生成 |
| `Project_Audit_Report.md` | M0 阶段计划产出，未提交 |
| `TECHNICAL_DEBT_REGISTER.md` | 已合并入 `Knowledge/10_Technical_Debt.md` |

---

## 二、文档处理决策

### 合并（Merge）

| # | 源文件 | 目标文件 | 处理说明 |
|---|--------|---------|---------|
| M1 | `data-model-er.md` (根) + `docs/data-model-er.md` | `Knowledge/04_Data_Model.md` | 取 docs/ 版本中文内容 + 根版本补充 → 合并为单一 SSoT |
| M2 | `api-docs.md` (根) + `docs/api-docs.md` | `Knowledge/07_System_Architecture.md` | API 路由数据并入系统架构文档第 4 节 |
| M3 | `code-review.md` (根) | `Knowledge/08_Development_Constitution.md` + `Knowledge/10_Technical_Debt.md` | PEP8 规范→开发公约，技术债→10_Technical_Debt |

### 保留（Retain — 作为归档，不再作为设计依据）

| # | 文件 | 保留理由 |
|---|------|---------|
| R1 | `docs/code-review.md` | 阶段性审计报告快照，含原始 154 违规清单 |
| R2 | `docs/api-docs.md` | 阶段性 API 快照（含"生成时间"标记） |
| R3 | `docs/data-model-er.md` | 阶段性数据模型快照 |

### 归档（Archive — 重复，仅保留一份）

| # | 文件 | 处理 |
|---|------|------|
| A1 | `/workspace/source/api-docs.md` | 内容已合并至 Knowledge，原文件保留但标记为归档 |
| A2 | `/workspace/source/data-model-er.md` | 内容已合并至 Knowledge，原文件保留但标记为归档 |
| A3 | `/workspace/source/code-review.md`（根） | 含架构评价，内容已分解并入 Knowledge/08/10 |

---

## 三、新知识库目录结构

```
workspace/source/Knowledge/
├── 01_Project_Position.md        ← 项目定位（SSoT）
├── 02_Business_Model.md          ← 业务模型（SSoT）
├── 03_Business_Architecture.md   ← 业务架构（SSoT）
├── 04_Data_Model.md              ← 数据模型（SSoT）- 合并自 2 份 data-model-er.md
├── 05_Data_Source.md             ← 数据来源（SSoT）
├── 06_ERP_Integration.md         ← ERP 集成（SSoT）
├── 07_System_Architecture.md     ← 系统架构（SSoT）
├── 08_Development_Constitution.md← 开发公约（SSoT）
├── 09_Roadmap.md                 ← 路线图（SSoT）
├── 10_Technical_Debt.md          ← 技术债登记（SSoT）
├── 11_Change_Log.md              ← 变更日志（SSoT）
└── 12_AI_Context.md              ← AI 上下文（SSoT - 入口文件）
```

### 文件统计

| 指标 | 值 |
|------|-----|
| 永久文档（SSoT） | 12 份 |
| 归档阶段性文档 | 3 份（`docs/` 目录内） |
| 标记为归档的根目录重复 | 3 份（`api-docs.md`, `data-model-er.md`, `code-review.md`） |
| 实际文档唯一内容 | **12 份**（从原来 7 份去重后） |
| 总文档体积 | ~48KB（Knowledge/） |

---

## 四、文档引用关系图

```
                         ┌─────────────────────┐
                         │    .hermes.md (锚点)   │
                         │  指向 Knowledge/ 全部  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                     ┌──────────────────────────┐
                     │ 12_AI_Context.md (入口)    │
                     │ → 阅读顺序 + AI 铁则       │
                     └──────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
          ┌─────────────────┐ ┌────────────┐ ┌──────────────┐
          │01_Project_Pos   │ │02_Business │ │07_System_Arch│
          │   _ition        │ │   _Model   │ │   _itecture  │
          └─────────────────┘ └─────┬──────┘ └──────┬───────┘
                    │               │               │
                    ▼               ▼               │
          ┌─────────────────┐ ┌────────────┐        │
          │03_Business_Arch │ │05_Data_Src │        │
          └────────┬────────┘ └──────┬─────┘        │
                   │                │               │
                   ▼                ▼               │
          ┌─────────────────┐ ┌────────────┐        │
          │04_Data_Model ◄──┼─┤06_ERP_Inte│        │
          │  (SSoT 数据)    │ │           │        │
          └─────────────────┘ └────────────┘        │
                                                 ┌──┴────────┐
                                                 │08_Develop │
                                                 │   _Const  │
                                                 └──┬──┬─────┘
                       ┌────────────────────────────┤  │
                       ▼                            ▼  ▼
              ┌──────────────────┐           ┌──────────────┐
              │09_Roadmap.md     │           │10_Technical_ │
              │ (已完成+待规划)   │           │   Debt.md    │
              └──────────────────┘           └──────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │11_Change_Log.md  │
              └──────────────────┘
```

### 引用规则

| 规则 | 说明 |
|------|------|
| **X-Ref** | 每份文档开头列出交叉引用目标文档 |
| **SSoT 唯一性** | 每个业务规则只在**一个** SSoT 文档中出现 |
| **信息流向** | 数据模型(04) → 系统架构(07) → 开发公约(08) → 路线图(09) → 技术债(10) |

---

## 五、AI 必须遵守的阅读顺序

所有 AI Agent 首次接触此项目时，按以下顺序阅读：

| 顺序 | 文档 | 阅读原因 | 估计时间 |
|------|------|---------|---------|
| 1 | `12_AI_Context.md` | AI 铁则 + 阅读顺序本身 | 2 min |
| 2 | `01_Project_Position.md` | 理解项目是什么、为什么做 | 2 min |
| 3 | `02_Business_Model.md` | 理解业务领域、核心流程、规则 | 5 min |
| 4 | `03_Business_Architecture.md` | 理解 7 个模块的职责和数据流 | 5 min |
| 5 | `04_Data_Model.md` | 理解 12 个模型、外键关系、ER 图 | 8 min |
| 6 | `05_Data_Source.md` | 了解数据从哪来（手工/Excel/ERP） | 3 min |
| 7 | `06_ERP_Integration.md` | 了解 ETL 双轨架构 | 3 min |
| 8 | `07_System_Architecture.md` | 了解技术栈、部署结构 | 3 min |
| 9 | `08_Development_Constitution.md` | 了解编码规范、治理管道 | 5 min |
| 10 | `09_Roadmap.md` | 了解已完成和待规划阶段 | 3 min |
| 11 | `10_Technical_Debt.md` | 了解已知技术债（避免踩坑） | 3 min |
| 12 | `11_Change_Log.md` | 了解变更历史 | 1 min |
| **合计** | | | **~43 min** |

**后续迭代时**：只需重读 `11_Change_Log.md` + 受影响的具体文档即可。

---

## 六、遗留问题

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 1 | `package-guide.md` 和 `router-status.md` 从未实际生成 | 无直接影响，但引用路径已失效 | 下次迭代可选择补充或删除引用 |
| 2 | 根目录 `api-docs.md`、`data-model-er.md`、`code-review.md` 未物理删除 | 可能混淆后续 AI（重复文件） | 建议用 `.gitignore` 或前缀 `_ARCHIVED_` 标记 |
| 3 | `dashboard.py` 的原生 SQL 未在技术债中充分体现严重性 | ETL 阶段可能被阻塞 | 建议评估 M2 优先级是否提升 |
| 4 | 部分文档中模型计数不一致（"6 个文件"vs"12 个模型"） | 已在新 Knowledge 中统一 | 原始归档中可能保留不一致表述 |
