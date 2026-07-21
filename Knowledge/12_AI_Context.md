# FinanceDesk AI 上下文

> **永久文档 · AI Agent 入口文件**
> 所有 AI Agent 开始工作前必须阅读本文档以了解项目全貌。
> 更新时间：2026-07-06
> 交叉引用：所有 Knowledge/ 文档

---

## 1. 项目全景

FinanceDesk 是一个面向**中移建设崇左分公司**的财务经营管理系统，用 FastAPI + React 实现。详见 [01_Project_Position](./01_Project_Position.md)。

## 2. AI 必须遵守的阅读顺序

请严格按照以下顺序阅读 Knowledge/ 文档，后文依赖前文。

> **Business Constitution（业务宪法）为最高级规范。AI 开发准则第四章要求所有 AI 按此顺序阅读。阅读顺序为强制要求，不得跳过。**

| 顺序 | 文档 | 内容 |
|------|------|------|
| **①** | [12_AI_Context](./12_AI_Context.md) | **本文档** — 阅读顺序、AI 铁则、项目基线 |
| **②** | [Business_Constitution](./Business_Constitution.md) | **业务宪法（最高级规范）** — 9 红线 + 7 禁止 + AI 准则 + 冻结声明 |
| **③** | [UI_Architecture](./UI_Architecture.md) | **页面架构（SSoT）** — 菜单树、12 页面职责、权限矩阵 |
| **④** | [UI_Data_Source_Matrix](./UI_Data_Source_Matrix.md) | **字段来源矩阵** — 12 模块逐字段来源（M/E/S/A） |
| **⑤** | [Page_Flow](./Page_Flow.md) | **页面流转图** — 5 张 Mermaid 流转图、导航规则 |
| **⑥** | [Business_Decision_Log](./Business_Decision_Log.md) | BADR 决策记录（12 条不可违反的架构决策） |
| **⑦** | [Business_Rules](./Business_Rules.md) | 业务规则（7 大章节：合同/订单/数据源/ERP/Dashboard/供应商/Excel） |
| **⑧** | [Business_Data_Model](./Business_Data_Model.md) | **业务数据模型（SSoT）** — 11 个业务对象字段定义 |
| **⑨** | [Entity_Relationship](./Entity_Relationship.md) | **业务 ER 图** — 4 张 Mermaid ER 图 + 引用关系表 |
| **⑩** | [Business_Field_Standard](./Business_Field_Standard.md) | **字段命名标准** — 统一 ID/编号/金额/日期/状态/备注规范 |
| **⑪** | [Business_Master_Data](./Business_Master_Data.md) | 基础主数据体系（5 类主数据 + 成本供应商合同库定义） |
| **⑫** | [01_Project_Position](./01_Project_Position.md) | 项目定位（施工企业经营分析与结算管理平台） |
| **⑬** | [02_Business_Model](./02_Business_Model.md) | 业务领域划分、核心流程 |
| **⑭** | [03_Business_Architecture](./03_Business_Architecture.md) | 4 大业务域（经营/基础资料/ERP/驾驶舱） |
| **⑮** | [04_Data_Model](./04_Data_Model.md) | 12 ORM 模型、外键关系、ER 图、SysDictionary |
| **⑯** | [05_Data_Source](./05_Data_Source.md) | 数据来源（手工/Excel/ERP） |
| **⑰** | [06_ERP_Integration](./06_ERP_Integration.md) | ETL 双轨架构、暂存表隔离 |
| **⑱** | [07_System_Architecture](./07_System_Architecture.md) | 技术栈、部署架构、API 路由 |
| **⑲** | [08_Development_Constitution](./08_Development_Constitution.md) | 编码规范、治理管道、工作流 |
| **⑳** | [09_Roadmap](./09_Roadmap.md) | 已完成/待规划阶段 |
| **㉑** | [10_Technical_Debt](./10_Technical_Debt.md) | 技术债登记（12 项） |
| **㉒** | [11_Change_Log](./11_Change_Log.md) | 变更历史 |
| **㉓** | [AHF-01_Repository_Standard](./AHF-01_Repository_Standard.md) | **Repository Standard（技术宪法P1）** — 数据访问规范、ORM 隔离 |
| **㉔** | [Architecture_Roadmap](./Architecture_Roadmap.md) | **Architecture Roadmap** — AHF 体系总览、10 个 Standard 规划 |
| **㉕** | [AHF-01.5_Architecture_Dependency](./AHF-01.5_Architecture_Dependency.md) | **Dependency Standard** — 系统分层、调用方向、15 条禁令 |
| **㉖** | [AHF-01.5_Layer_Call_Matrix](./AHF-01.5_Layer_Call_Matrix.md) | **Call Matrix** — 12 层完整调用许可矩阵 |
| **㉗** | [AHF-02_Service_Standard](./AHF-02_Service_Standard.md) | **Service Standard（技术宪法P2）** — Service 层职责、调用规范 |
| **㉘** | [AHF-02_Service_Interface](./AHF-02_Service_Interface.md) | **Service Interface** — 统一接口规范、代码模板 |
| **㉙** | [AHF-03_Engine_Standard](./AHF-03_Engine_Standard.md) | **Engine Standard（技术宪法P3）** — Engine 定位、职责、18 条禁令 |
| **㉚** | [AHF-03_Engine_Interface](./AHF-03_Engine_Interface.md) | **Engine Interface** — EngineResult、异常体系、接口规范 |
| **㉛** | [AHF-04_Event_Architecture](./AHF-04_Event_Architecture.md) | **Event Architecture（技术宪法P4）** — 事件架构、生命周期、通道 |
| **㉜** | [AHF-04_Event_Model](./AHF-04_Event_Model.md) | **Event Model** — 13 字段 BusinessEvent |
| **㉝** | [AHF-04_Event_Catalog](./AHF-04_Event_Catalog.md) | **Event Catalog** — 39 个标准事件 |

## 3. AI 铁则

### 3.1 不要做的事

| ❌ 禁止 | 原因 |
|---------|------|
| 新增**任何**业务功能 | 当前处于知识库建立阶段，停止一切新功能开发 |
| 修改现有业务表结构 | 双轨架构要求新数据走暂存表 |
| 直接修改生产数据库 | 必须通过 API 或 ETL |
| 在 Knowledge/ 外创建文档 | 所有永久文档归 Knowledge/ 管理 |
| 一次改 4 个以上文件不提交 | 分批提交要求 |

### 3.2 必须做的事

| ✅ 必须 | 说明 |
|--------|------|
| 改代码前先 Qwen3.7-Max 全量审查 | 使用 DashScope API 审查全部受影响的文件 |
| 改代码四步 | 备份 → 审查 → 部署 → curl 验证 |
| 使用绝对导入 | `from app.xxx import` |
| 每个业务规则只保留一个权威来源 | 避免冲突/矛盾 |
| 修改后更新 Change Log | 记录所有变更 |

### 3.3 常见错误模式（高频陷阱）

| # | 错误模式 | 正确做法 |
|---|---------|---------|
| 1 | SQL 笛卡尔积 SUM | 多表 JOIN 前确认 1:N 关系方向 |
| 2 | 空值 `toLocaleString` | 前端数值格式化前判空 |
| 3 | JSX 缺逗号 | Ant Design 属性间需保留逗号 |
| 4 | ProTable 分页参数错误 | params 传对象而非直接拼入 URL |

### 3.4 文档引用关系图

```
01_Project_Position ←── 入口
       │
       ▼
02_Business_Model ──────────────────────────────┐
       │                                         │
       ▼                                         │
03_Business_Architecture ────────┐               │
       │                          │               │
       ▼                          ▼               ▼
04_Data_Model ←── 05_Data_Source ←── 06_ERP_Integration
       │
       ▼
07_System_Architecture
       │
       ▼
08_Development_Constitution
       │
       ├──→ 09_Roadmap
       ├──→ 10_Technical_Debt
       └──→ 11_Change_Log
```

## 4. 关键路径（常用命令）

```bash
# 后端启动
cd /home/hermes/workspace/source/backend
source venv/bin/activate && python main.py

# 前端启动
cd /home/hermes/workspace/source/frontend && npx vite

# 运行测试
cd /home/hermes/workspace/source/backend && source venv/bin/activate && python -m pytest
cd /home/hermes/workspace/source/frontend && npx vitest run

# 部署（生产）
cd /home/hermes/workspace/source/frontend && npx vite build
# 用户级 systemd
systemctl --user restart financedesk

# 数据库路径
/workspace/source/backend/FinanceDesk_Data/finance.db
```

## 5. 关键联系人

| 角色 | 说明 |
|------|------|
| 用户（一游） | 项目经理，所有决策审批者 |
| AI Agent | 当前 AI，遵循本上下文工作 |
| zjq | 服务器用户，文件/进程归属 |
