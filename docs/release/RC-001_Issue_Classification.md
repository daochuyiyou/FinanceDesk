# RC-001 Issue Classification

> **阶段**: RC-1 Hardening
> **日期**: 2026-07-09
> **来源**: Product Audit 2026-07-09
> **模式**: P0/P1 处理 → Business Validation → Enhancement 排队

---

## 四类分类标准

| 类别 | 含义 | 当前阶段处理 |
|:----:|------|:-----------:|
| **P0 Release Blocker** | 阻断发布，必须立即修复 | ✅ 当前阶段处理 |
| **P1 Freeze Required** | Freeze 前必须完成 | ✅ 当前阶段处理 |
| **Business Validation** | 需确认真实业务规则后再决策 | ❌ 调研确认，不开发 |
| **Enhancement** | 后续优化，不阻止发布 | ❌ 暂停，排队等候 |

---

## P0 — Release Blocker

| # | 页面 | 问题 | 严重度 | 状态 |
|:-:|:----:|------|:------:|:----:|
| B1 | 预算管理 | `// @ts-nocheck` 全局禁用 TS 检查，Frozen 页面不可接受 | 🔴 阻断 | 修复中 |

**理由**: Frozen 页面必须 TS 零错误。`@ts-nocheck` 使整个页面脱离类型检查，可能隐藏运行时错误。

---

## P1 — Freeze Required

| # | 页面 | 问题 | 修复方案 | 状态 |
|:-:|:----:|------|----------|:----:|
| B2 | 收入管理 | `invoice_stage`/`invoice_reason` 硬编码 Select 选项 | 替换为 `<DictSelect category="..." mode="create" />`（参考 CostExecution 模式） | ⏳ 待处理 |
| B3 | 收入管理 | 空金额列显示 `0` 而非 `-` | `render: (v) => (v ?? 0).toLocaleString()` → `render: (v) => v != null ? v.toLocaleString() : '-'` | ⏳ 待处理 |
| B4 | 收款管理 | 删除使用动态 `import()` 而非直接 import | 改为静态 import `deleteCollection` | ⏳ 待处理 |

---

## Business Validation

| # | 页面 | 问题 | 需确认事项 | 状态 |
|:-:|:----:|------|-----------|:----:|
| B5 | 收款管理 | **缺少编辑功能** | 收款管理的业务场景中，用户是否真需要修改已创建的回款记录？还是仅通过「红冲/退款」处理？需与业务人员确认后再决定开发方向 | 🔍 调研中 |

**暂不开发**，待业务规则确认后决定：
- 方案 A：支持编辑（修改金额/日期/凭证号）→ 参考 PaymentManagement 实现
- 方案 B：不支持编辑，仅支持删除后重新创建（当前模式）

---

## Enhancement — 后续优化

| # | 页面 | 问题 | 建议修复 | 优先级 |
|:-:|:----:|------|----------|:------:|
| B6 | Dashboard | 「人员」数写死 0 | 从 API 或字典获取实际人数 | P2 |
| B7 | Business Analyzer | Period 列表硬编码 `2026-01`~`2026-06` | 自动生成过去 24 个月的 Period 选项 | P2 |
| B8 | Business Analyzer | 默认 Period 落后一个月 | 自动取当前月份 | P2 |
| B9 | 预算管理 | 未集成 Business Analyzer | 接入 `useAnalyzer()` 替代独立项目选择器 | P2 |
| B10 | 预算管理 | 767 行巨型页面 | 抽取 BudgetFormModal / AdjustmentFormModal 为独立组件文件 | P3 |

---

## 暂停项声明

以下全面暂停，不在 RC-1 阶段执行：

| 暂停类型 | 具体项目 |
|----------|----------|
| 🛑 新功能开发 | PS-013 成本主体升级 |
| 🛑 Enhancement 修复 | B6~B10（上表） |
| 🛑 新页面 Prototype | 所有未入板的 TBD 页面 |
| 🛑 布局/设计优化 | UI Standard 遗留项 |
