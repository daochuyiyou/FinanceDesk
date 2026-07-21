# Prototype First（原型优先）开发流程

> 生效：PS-012 及后续 Product Optimization Sprint
> 采用 Prototype → Checklist → Review → Develop → Verify → Freeze 六阶段流程
> 原则：一页一 Sprint（One Page, One Sprint）

---

## 六阶段流程图

```
┌─────────────────────────────────────────────────────────┐
│  ① Prototype（原型）                                     │
│  输出静态 HTML / React 原型，不含业务逻辑                  │
│  仅展示布局、交互、信息结构                                 │
│  禁止直接修改业务页面                                       │
│                                                           │
│  产出物（放入 page dir）：                                 │
│    prototypes/<sprint>/<page>/index.html  ← 原型          │
│    prototypes/<sprint>/<page>/mock.json   ← Mock 数据     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  ② Checklist（产品检查项）                                │
│  产品负责人逐项检查 Product Checklist                     │
│  未通过的检查项 → 返回 ① 修改原型                          │
│  全部通过 → 进入 ③                                        │
│                                                           │
│  产出物（放入 page dir）：                                 │
│    prototypes/<sprint>/<page>/checklist.md   ← 勾选结果   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  ③ Review（评审）                                        │
│  产品负责人确认原型 + 检查项结果                           │
│  确认 → 进入 ④                                            │
│                                                           │
│  产出物（放入 page dir）：                                 │
│    prototypes/<sprint>/<page>/decision.md   ← 决策记录    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  ④ Develop（开发）                                       │
│  一次一页，严格遵循原型 + Checklist 做开发                 │
│  对接后端 API、数据库                                     │
│  功能蔓延 = 禁止                                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  ⑤ Verify（验证）                                        │
│  浏览器截图 + Console/Network 验证                        │
│  仅 TS/Build/API 通过 = 不通过                             │
│  必须真实浏览器操作验证                                     │
│                                                           │
│  产出物（放入 page dir）：                                 │
│    prototypes/<sprint>/<page>/freeze.md    ← 冻结记录     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  ⑥ Freeze（冻结）                                        │
│  冻结对象：原型方案（Prototype）而非仅代码                  │
│  页面布局和交互以冻结原型为准                                │
│  后续仅允许：Bug 修复、小幅文案/样式优化（不改变布局）       │
│  布局改动 → 重新 ① Prototype + 重新走全流程                 │
└─────────────────────────────────────────────────────────┘
```

---

## 一页一 Sprint（One Page, One Sprint）

### 核心规则
- **一个 Sprint 只做一个页面**
- 完成「产品评审 → 浏览器验证 → 冻结」后，才进入下一个页面
- 不允许在一个 Sprint 中并行开发多个页面

### Sprint 产出物

每个页面建立独立产品目录：

```
prototypes/<sprint>-<page-name>/
├── index.html         ← ① Prototype（静态原型）
├── mock.json          ← ① Mock 数据
├── checklist.md       ← ② Product Checklist（勾选结果）
├── decision.md        ← ③ Review Decision（评审决策）
└── freeze.md          ← ⑥ Freeze Record（冻结记录）
```

### 目录在项目中的位置

```
workspace/
├── frontend/src/pages/        ← 正式业务页面（仅 Develop 阶段修改）
├── backend/                   ← 后端代码（仅 Develop 阶段修改）
├── Knowledge/                 ← 全局规范文档
└── prototypes/                ← 原型存放（PS-012 起）
    ├── PS-012-revenue-detail/
    ├── PS-013-cost-workbench/
    └── ...
```

---

## 各阶段细则

### ① Prototype（原型）

**输出物**：
- `index.html`：完整 HTML 文件，包含内联 CSS/JS，使用 antd CDN
- `mock.json`：Mock 数据，JSON 格式
- 所有文件放入 `prototypes/<sprint>-<page-name>/`

**禁止**：
- 修改 `src/pages/` 下的业务页面
- 修改 `backend/` 下的路由或数据模型
- 对接真实 API

### ② Product Checklist

评审前，产品负责人逐项检查以下内容（使用 `checklist.md`）：

```markdown
# Product Checklist — <页面名称>

## 发布者检查项（Hermes 填写）
- [ ] 已输出静态原型（index.html）
- [ ] 原型包含完整交互流程（弹窗、折叠、Tab）
- [ ] 原型使用 Mock 数据
- [ ] 原型遵循 UI Standard V1 规范

## Excel First 检查项（产品负责人勾选）
- [ ] 用户完成主要任务需要几步？应接近 Excel
- [ ] 默认字段是否仅展示 6-8 个常用项？
- [ ] 关联对象是否同时展示 编号+名称？
- [ ] 所有 Select 是否支持搜索？

## 信息架构检查项（产品负责人勾选）
- [ ] 页面打开后 5 秒内能否理解用途？
- [ ] 核心数据是否优先展示？
- [ ] 是否有冗余/无价值信息？

## 交互一致性检查项（产品负责人勾选）
- [ ] 弹窗尺寸是否符合规范（500/600px）？
- [ ] 按钮顺序是否符合规范（取消→确定）？
- [ ] 分页配置是否统一？
- [ ] 颜色是否符合语义规约？
```

**勾选规则**：未通过的检查项 → 返回 ① 修改原型。全部通过 → 进入 ③ Review。

### ③ Review（评审）

**参与人**：产品负责人（一游）

**评审重点**：
- Checklist 全部通过
- 是否符合 Excel First 原则
- 点击次数是否接近 Excel
- 页面是否 5 秒可理解

**通过条件**：产品负责人明确回复"通过"或"可以开发"

**产出物**：`decision.md`

### ④ Develop（开发）

**规则**：
- 一次只开发一个页面
- 严格遵循原型布局 + Checklist 约束
- 功能蔓延 = 禁止
- 完成一个页面后再进入下一页面

### ⑤ Verify（验证）

**验收标准**：
- 浏览器截图（必须，存入 `freeze.md`）
- Console 无错误（必须）
- Network 请求正常（必须）
- TypeScript 编译通过（必须）

### ⑥ Freeze（冻结）

**冻结对象**：
- **原型方案**：`prototypes/<sprint>-<page-name>/index.html` 进入冻结
- **代码页面**：`src/pages/<page>.tsx` 标记 `[Frozen]`

**冻结后的约束**：
- 页面布局和交互以冻结原型为准
- 后续仅允许：Bug 修复、文案优化、颜色/间距微调（不改变布局）
- 布局/交互变更 → 重新走 ① Prototype → Review → Develop → Verify → Freeze

**产出物**：`freeze.md` — 包含冻结快照、浏览器截图路径、冻结日期

---

## 与 UI Standard 的关系

- **UI Standard V1** 是静态规范（Dialog 尺寸、按钮顺序、颜色）
- **Product Checklist** 是 Check 工具（确保原型符合规范）
- 两者互补：原型必须通过 Checklist 才能进入 Review

---

## 当前冻结页面（PS-011）

| 页面 | 状态 | 冻结对象 |
|------|------|---------|
| Dashboard | ✅ Frozen | 布局+交互 |
| 收入管理 | ✅ Frozen | 布局+交互 |
| 成本执行 | ✅ Frozen | 布局+交互 |
| 收款管理 | ✅ Frozen | 布局+交互 |
| 付款管理 | ✅ Frozen | 布局+交互 |
| 预算管理 | ✅ Frozen | 布局+交互 |
| BusinessAnalyzer | ✅ Frozen | 布局+交互 |
| DictSelect/ObjectSelector | ✅ Frozen | 布局+交互 |
