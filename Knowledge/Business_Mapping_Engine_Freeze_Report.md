# Business Mapping Engine Freeze Report — 映射引擎冻结报告

> **BDD-06.5 输出 · 冻结报告**
> 更新时间：2026-07-05
> **未经本阶段冻结，不进入 ERP Import Engine 编码开发。**
> **Mapping Engine 只负责解释业务映射规则，不直接计算经营指标。**

---

## 冻结范围

本次冻结覆盖 Business Mapping Engine 的完整设计：

| 文档 | 角色 | 状态 |
|:----:|:----:|:----:|
| `Business_Mapping_Engine.md` | 引擎架构设计 | ✅ 已冻结 |
| `Business_Mapping_Rules.md` | 配置化规则库（6 条标准规则） | ✅ 已冻结 |
| `Business_Event_Model.md` | 标准业务事件模型（4 类事件） | ✅ 已冻结 |
| `Business_Action_Review.md` | 一致性评审（10/10） | ✅ 已冻结 |

---

## 架构总图

```
ERP Fact（erp_staging_flow）
    │ 匹配
    ▼
Matching Engine（BDD-06D）
    │
    ▼ ═══ Business Mapping Engine ═══
    │
    ├── Mapping Rule（配置化规则表）
    ├── Business Event（标准事件）
    │     ├── Create
    │     ├── Update
    │     ├── Reverse
    │     └── Rollback
    │
    ▼ ═══════════════════════════════
    │
ERP Import Engine（BDD-06F）
    │ 事务执行
    ▼
Business Object + Summary + Log
```

---

## 核心设计决策

| 决策 | 选择 | 理由 |
|:----:|:----:|------|
| 规则存储 | 配置化规则表 | 新增 ERP 字段不需改代码 |
| 事件模型 | 4 类标准事件 | Create/Update/Reverse/Rollback 覆盖全部场景 |
| 引擎角色 | 仅解释，不计算 | 不计算经营指标，保持职责单一 |
| Mirror 镜像 | 收入/成本链事件一致 | 继承 BDD-05A Mirror Architecture |
| 字段映射 | JSON 配置 | 支持 direct/default/convert/expression/condition 五类 |

---

## 评审结果

| 评审项 | 评分 |
|:------:|:----:|
| Business Constitution | **10/10** |
| BADR | **10/10** |
| Mirror Architecture | **10/10** |
| ERP Rules | **10/10** |
| Business Identity | **10/10** |
| Data Source Rules | **10/10** |
| Order Summary | **10/10** |
| 配置化设计 | **10/10** |
| 事件模型 | **10/10** |
| 不可跳过 Preview | **10/10** |
| **综合评分** | **10/10** |

---

## 编码前置条件清单

| # | 条件 | 状态 | 验证方式 |
|:-:|------|:----:|---------|
| 1 | Mapping Engine 架构冻结 | ✅ 完成 | 4 份文档已锁 |
| 2 | 规则配置化而非硬编码 | ✅ 完成 | JSON field_mapping + 规则表设计 |
| 3 | Mirror Architecture 镜像 | ✅ 完成 | 收入↔成本事件对照表 |
| 4 | Business Constitution 对齐 | ✅ 10/10 | 不修改 ERP Fact, 来源可追溯 |
| 5 | BDD-06D 匹配规则集成 | ✅ 完成 | matched_order_id 为事件输入 |
| 6 | BDD-06F Import Engine 参考 | ✅ 完成 | 事件标准接口定义 |
| 7 | 5 BAT 案例覆盖 | ✅ 完成 | 框架合同/单项合同/重复/红冲/人工匹配 |
| 8 | 扩展性保障 | ✅ 完成 | 新增字段只需规则行，不需改代码 |

---

## 冻结声明

**Business Mapping Engine（BDD-06.5）设计已冻结。**
**所有后续变更需经 Business Change Approval。**
**允许进入 BDD-06F ERP Import Engine 编码开发。**
