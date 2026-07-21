# Product Governance V1 — 产品治理框架

> 升级自：Prototype First 流程
> 生效：即日起 | 适用：PS-012 及后续所有 Sprint
> 唯一评审标准：**[FPS-1 Product Standard V1](FPS-1_Product_Standard_V1.md)**

---

## 治理流程（六阶段）

```
Prototype → Checklist → Review → Develop → Verify → Freeze
  ①           ②           ③         ④         ⑤        ⑥
```

唯一任务来源：**[Product Backlog](Product_Backlog.md)**

---

## ① Prototype（原型）

**产出物**（放入 `prototypes/<sprint>-<page-name>/`）：
- `index.html` — 静态原型（完整 HTML+CSS+JS，使用 antd CDN）
- `mock.json` — Mock 数据

**版本标识**：
```
prototypes/PS-012-revenue-list/index.html  →  RevenueList V1.0 Prototype
```

**冻结版本转换规则**：
```
Dashboard V1.0 Frozen    ← PS-011 冻结版本
Dashboard V1.1 Prototype ← 新原型（布局改动时）
Dashboard V1.1 Frozen    ← 新版本开发完成
```

**禁止**：
- 修改 `src/pages/` 和 `backend/` 下的业务代码
- 对接真实 API

---

## ② Product Checklist（FPS-1 七维度）

> 详见 [FPS-1 Product Standard V1](FPS-1_Product_Standard_V1.md)

评审标准为七个维度：

| # | 维度 | 级别 | 未通过后果 |
|---|------|------|-----------|
| D1 | **Business**（业务正确性） | 🚫 阻止级 | **Reject** |
| D2 | **Excel First**（Excel 优先） | ⚠️ 非阻止 | Approve with P1 |
| D3 | **Information Architecture**（信息架构） | ⚠️ 非阻止 | Approve with P1 |
| D4 | **Interaction**（交互） | ⚠️ 非阻止 | Approve with P1 |
| D5 | **Data**（数据） | ⚠️ 非阻止 | Approve with P1 |
| D6 | **Performance**（性能） | ⚠️ 非阻止 | Approve with P1 |
| D7 | **Release Readiness**（发布就绪） | ⚠️ 非阻止 | Approve with P1 |

**评审结果**：
- **Approve** → 进入 Develop
- **Approve with P1** → 进入 Develop，TODO 在 Freeze 前完成
- **Reject** → 返回 Prototype 修改

未获得 Approve 的 Prototype，禁止进入 Develop 阶段。

---

## ③ Review（评审）

**参与人**：产品负责人（一游）

**通过条件**：
- Checklist Business 维度全部通过
- UX 维度全部通过（阻止项已修复）
- UI 维度未通过项已记录为开发 TODO

**产出物**：`decision.md`

---

## ④ Develop（开发）

**规则**：
- 严格遵循原型 + Checklist 约束
- 功能蔓延 = 禁止
- 一个 Sprint 只做一个页面

---

## ⑤ Verify（验证）

**验收标准**：
- 浏览器截图（存入 `freeze.md`）
- Console 无错误
- Network 请求正常
- TypeScript 编译通过
- 原型 vs 实现 逐项对照

---

## ⑥ Freeze（冻结）

**版本标识**：
```
Dashboard V1.0 Frozen     ← 冻结版本
RevenueList V1.0 Frozen
```

**冻结对象**：原型方案（布局/交互以冻结原型为准）

**冻结后变更规则**：

| 变更类型 | 处理方式 | 版本变化 |
|---------|---------|---------|
| Bug 修复 | 直接修改 | V1.0 Frozen（版本号不变） |
| 文案/颜色微调 | 直接修改 | V1.0 Frozen |
| 字段增删 | 直接修改 | V1.0 Frozen |
| 布局/交互调整 | 重新 Prototype → Review → Develop → Verify → Freeze | **V1.1 → ...** |

即：**布局/交互变化 = 版本号升级**，新版本作为独立原型目录进入完整六阶段。

---

## Product Backlog

所有页面按 P0/P1/P2 排序，详见 [Product_Backlog.md](Product_Backlog.md)。

治理流程的唯一任务来源 = Product Backlog。

---

## 当前冻结页面（PS-011）

| 页面 | 版本 | 状态 |
|------|------|------|
| Dashboard | V1.0 | ✅ Frozen |
| 收入管理 | V1.0 | ✅ Frozen |
| 成本执行 | V1.0 | ✅ Frozen |
| 收款管理 | V1.0 | ✅ Frozen |
| 付款管理 | V1.0 | ✅ Frozen |
| 预算管理 | V1.0 | ✅ Frozen |
| BusinessAnalyzer | V1.0 | ✅ Frozen |
| DictSelect/ObjectSelector | V1.0 | ✅ Frozen |
