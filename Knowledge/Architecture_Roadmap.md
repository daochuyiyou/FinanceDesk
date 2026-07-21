# Architecture Roadmap — AHF 完整体系规划

> **AHF-Architecture-Roadmap P1 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **站在整个 FinanceDesk Framework 角度规划 Architecture Freeze。不限于 ERP Engine。**

---

## 一、FinanceDesk 完整分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                  业务宪法层（已冻结）                         │
│  Business Constitution · BADR · Business Rules             │
│  Identity Standard · Mirror Architecture · UI Freeze       │
└───────────────────────────┬─────────────────────────────────┘
                            │ 遵循
┌───────────────────────────▼─────────────────────────────────┐
│                  AHF 技术宪法层（本阶段冻结）                  │
│                                                             │
│  ┌──────────────┬──────────────┬──────────────────────┐     │
│  │  访问层规范   │  核心引擎规范  │  扩展架构规范        │     │
│  │              │              │                      │     │
│  │ AHF-01 Repo  │ AHF-03 Engine│ AHF-07 AI Extension  │     │
│  │ AHF-02 Svc   │ AHF-04 Event │ AHF-08 Plugin        │     │
│  │ AHF-10 Coding│ AHF-05 Summ  │ AHF-09 Test          │     │
│  │              │ AHF-06 Dash  │                      │     │
│  └──────────────┴──────────────┴──────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │ 实现
┌───────────────────────────▼─────────────────────────────────┐
│                    应用层（代码实现）                         │
│  Router → Engine → Repository → ORM → Database              │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、AHF Standard 体系总览

### 2.1 访问层规范（L1 — 分层基础）

| Standard | 职责 | 覆盖范围 |
|:---------|:-----|:---------|
| **AHF-01 Repository** | ORM 数据访问唯一入口 | 全部 5 个 Repository + ORM 规范 |
| **AHF-01.5 Dependency** | 层间调用依赖冻结 | 分层定义 + 调用矩阵 + 15 条禁令 |
| **AHF-02 Service** | 非 Engine 业务逻辑层 | 未来所有 Service 模块 |
| **AHF-10 Coding** | 全局编码约束 | 所有 Python/TypeScript 代码 |

### 2.2 核心引擎规范（L2 — 业务逻辑）

| Standard | 职责 | 覆盖范围 |
|:---------|:-----|:---------|
| **AHF-03 Engine** | 4 个 Engine 统一规范 | Mapping / Rule / Import / Summary Engine |
| **AHF-04 Event** | 标准事件架构 | Event 定义、生命周期、命名、扩展 |
| **AHF-05 Summary** | 三层汇总架构 | Revenue / Cost / Order / Dashboard Summary |
| **AHF-06 Dashboard** | 数据展示层规范 | Dashboard 只读、Summary 唯一来源 |

### 2.3 扩展架构规范（L3 — 未来扩展）

| Standard | 职责 | 覆盖范围 |
|:---------|:-----|:---------|
| **AHF-07 AI** | AI Agent 集成规范 | AI 可访问层、禁止访问层、MCP 预留 |
| **AHF-08 Plugin** | 第三方扩展规范 | ERP / Excel / AI / Notification 插件 |
| **AHF-09 Test** | 测试体系规范 | Unit / Repository / Engine / BAT / Regression |

---

## 三、Standard 之间调用关系

```
AHF-10 Coding Constitution（全局约束）
    │
    ├── AHF-01 Repository（数据访问层）
    │       ↓
    ├── AHF-02 Service（业务服务层，可选）
    │       ↓
    ├── AHF-03 Engine（核心引擎层）
    │       ├── AHF-04 Event（事件定义）
    │       ├── AHF-05 Summary（汇总计算）
    │       └── AHF-06 Dashboard（数据展示）
    │
    ├── AHF-07 AI（AI 扩展）
    ├── AHF-08 Plugin（插件扩展）
    └── AHF-09 Test（测试体系）
```

### 依赖关系

| Standard | 依赖 | 被依赖 |
|:---------|:----|:-------|
| AHF-01 Repository | 无 | AHF-01.5, AHF-02, AHF-03 |
| AHF-01.5 Dependency | AHF-01 | 全部后续 AHF |
| AHF-02 Service | AHF-01 | AHF-03 |
| AHF-03 Engine | AHF-01, AHF-02 | AHF-04, AHF-05 |
| AHF-04 Event | AHF-03 | AHF-07 |
| AHF-05 Summary | AHF-03 | AHF-06 |
| AHF-06 Dashboard | AHF-05 | 无 |
| AHF-07 AI | AHF-04 | 无 |
| AHF-08 Plugin | AHF-01, AHF-03 | 无 |
| AHF-09 Test | 全部 | 无 |
| AHF-10 Coding | 无 | 全部 |

---

## 四、推荐开发顺序

```
Phase 1: 分层基础（L1）
  ├── AHF-01 ✅ 已完成
  ├── AHF-01.5 ✅ 已完成
  ├── AHF-02 Service ✅ 已完成
  ├── AHF-03 Engine ✅ 已完成
  └── AHF-10 Coding Constitution

Phase 2: 核心引擎（L2）
  ├── AHF-03 Engine Standard
  ├── AHF-04 Event Architecture
  ├── AHF-05 Summary Architecture
  └── AHF-06 Dashboard Data Architecture

Phase 3: 扩展架构（L3）
  ├── AHF-07 AI Extension Architecture
  ├── AHF-08 Plugin Architecture
  └── AHF-09 Test Architecture
```

### 排序理由

| # | Standard | 理由 |
|:-:|:---------|:-----|
| 1 | AHF-01 Repository | ✅ 完成，已验证可运行 |
| 1.5 | AHF-01.5 Dependency | ✅ 完成，15 条调用禁令 |
| 2 | **AHF-02 Service** | ✅ 已完成，Service 层职责冻结 |
| 3 | AHF-10 Coding | 全局命名/文件组织规范，越早越好 |
| 4 | **AHF-03 Engine** | ✅ 已完成，18 条禁令 + EngineResult + 异常体系 | | Core 业务引擎，最复杂 |
| 5 | **AHF-04 Event** | ✅ 已完成，39 事件 + 13 字段 BusinessEvent + Event Bus | | Engine 的输入/输出标准 |
| 6 | AHF-05 Summary | Engine 的输出 |
| 7 | AHF-06 Dashboard | Summary 的消费端 |
| 8 | AHF-07 AI | 未来扩展 |
| 9 | AHF-08 Plugin | 未来扩展 |
| 10 | AHF-09 Test | 需要其他 Standard 完成后定义 |

---

## 五、与 Business Constitution 的对应关系

| Business Constitution 条款 | 对应 AHF Standard |
|:--------------------------|:------------------|
| R001 — 订单唯一结算单元 | AHF-01 (Repository order_id 约束) |
| R003 — ERP 只读 | AHF-01 (Repository 隔离 ERP Fact) |
| R004 — 来源可追溯 | AHF-03 (Engine 日志规范) |
| R006 — 自动计算不落库 | AHF-05 (Summary 不落库) |
| R007 — Mirror Architecture | AHF-05 (Revenue/Cost Summary 镜像) |

### 与 BADR 的对应关系

| BADR | 对应 AHF Standard |
|:-----|:------------------|
| BADR-003 归属订单 | AHF-01, AHF-03 |
| BADR-004 ERP 数据管道 | AHF-01, AHF-08 |
| BADR-010 自动推导 | AHF-05 |
| BADR-014 经营数据优先 | AHF-06 |

---

## 六、各 Standard 职责速查

```
AHF-01 Repository      ──  数据访问、字段映射、ORM 隔离
AHF-02 Service         ──  非 Engine 业务逻辑、编排
AHF-03 Engine          ──  Mapping/Rule/Import/Summary Engine
AHF-04 Event           ──  Business Event 定义、生命周期
AHF-05 Summary         ──  Revenue/Cost/Order/Dashboard 汇总
AHF-06 Dashboard       ──  Dashboard 数据来源、只读规范
AHF-07 AI              ──  AI Agent 可访问层、MCP 预留
AHF-08 Plugin          ──  ERP/Excel/AI/Notification 插件
AHF-09 Test            ──  Unit/Repository/Engine/BAT/Regression
AHF-10 Coding          ──  命名、分层、文件组织、禁止事项
```

---

## 七、完整性检查

| 覆盖维度 | 对应 Standard | 是否覆盖 |
|:---------|:-------------|:--------:|
| 数据访问层 | AHF-01 | ✅ |
| 业务逻辑层 | AHF-02, AHF-03 | ✅ |
| 事件驱动 | AHF-04 | ✅ |
| 计算层 | AHF-05 | ✅ |
| 展示层 | AHF-06 | ✅ |
| AI 接入 | AHF-07 | ✅ |
| 第三方扩展 | AHF-08 | ✅ |
| 质量保障 | AHF-09 | ✅ |
| 编码规范 | AHF-10 | ✅ |
| 业务宪法 | 已在 AHF 之前冻结 | ✅ |
| 数据模型 | 已在 BDD 阶段冻结 | ✅ |
| UI/UX | 已在 UI Freeze 冻结 | ✅ |

---

## 八、职责重叠检查

| 检查项 | 结果 |
|:-------|:----:|
| AHF-01 与 AHF-02 职责重叠？ | ❌ 不重叠：Repository 数据访问 vs Service 业务编排 |
| AHF-03 与 AHF-02 职责重叠？ | ❌ 不重叠：Engine 核心业务 vs Service 辅助逻辑 |
| AHF-04 与 AHF-03 职责重叠？ | ❌ 不重叠：Event 定义 vs Engine 执行 |
| AHF-05 与 AHF-06 职责重叠？ | ❌ 不重叠：Summary 计算 vs Dashboard 展示 |
| AHF-07 与 AHF-08 职责重叠？ | ❌ 不重叠：AI 接入 vs 插件机制 |

---

## 九、支撑能力评估

| 未来模块 | 所需 Standard | 是否可支撑 |
|:---------|:-------------|:----------:|
| BDD-07 Dashboard | AHF-05, AHF-06 | ✅ |
| BDD-08 报表 | AHF-05, AHF-06 | ✅ |
| AI 智能分析 | AHF-07 | ✅ |
| 第三方 ERP 对接 | AHF-08 | ✅ |
| 移动端 | AHF-10 (API 规范) | ✅ |
| 多租户 | AHF-01, AHF-10 | ✅ |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
