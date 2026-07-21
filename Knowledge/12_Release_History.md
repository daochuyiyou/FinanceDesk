# FinanceDesk Release History

> **永久文档** — 每个正式发布的版本在此记录。
> 交叉引用：[11_Change_Log](./11_Change_Log.md) · [Business_Constitution](./Business_Constitution.md)

---

## V1.0.0-RC1

| 字段 | 内容 |
|------|------|
| **发布日期** | 2026-07-21 |
| **Git Tag** | `v1.0.0-rc1` |
| **Git Commit** | `master` (需提交: frontend/src/App.tsx, scripts/, docs/) |
| **部署指南** | `docs/Release_Deployment_Guide.md` |
| **Release QA** | `docs/Release_QA_Report.md` |

### 新增功能

| ID | 功能 | 模块 |
|----|------|------|
| BA-015 | Supplier Association（成本流水供应商必选 + 付款自动填充） | 成本执行 / 付款管理 |
| UX-005 | Menu Information Architecture（菜单重命名/重排序） | 侧边栏 |
| RC-014 | Unicode 字面量修复（JSX 中 `\uXXXX` 改为中文字符） | 前端 |
| Release-002 | 部署自动化工具集（install/upgrade/backup/restore + smoke test） | 运维脚本 |

### 修复

| Issue | 描述 | 根因 |
|-------|------|------|
| PS-001 | 侧边栏导航异常：多次切换后点击菜单项导致侧边栏折叠 | Sider `collapsible` 内置触发条与 Menu 点击事件冲突 |
| RC-014 | 合同详情 Drawer 中中文显示为 `\uXXXX` 转义码 | JSX 文本内容中使用 `\uXXXX` 而非中文字符或 `{'\uXXXX'}` |
| BA-015 | 付款表单 payee 未从成本流水供应商自动填充 | Payment 创建逻辑缺少 Supplier 关联查询 |

### 验证

| 检查 | 结果 |
|------|------|
| Chrome Runtime QA（16 页面） | ✅ Console 0E/0W · Network 全部 200 |
| Smoke Test（22 API 端点） | ✅ 22/22 PASS |
| 侧边栏导航（2 轮完整遍历） | ✅ 全部连通 |
| PS-001 修复验证（折叠→展开→子菜单导航） | ✅ 侧边栏稳定，无意外折叠 |
| API 路由注册 | ✅ 96 路由 |

### 状态

```
✅ Pilot Ready
```

### 已知问题（V1.1 Backlog）

| ID | 描述 | 优先级 |
|----|------|--------|
| — | 暂无 Blocking 问题 | — |

### 脚本工具

| 脚本 | 用途 |
|------|------|
| `scripts/install.sh` | 全新 Ubuntu 一键安装 |
| `scripts/upgrade.sh` | 版本升级（git pull → build → restart） |
| `scripts/backup.sh` | SQLite + 配置文件备份 |
| `scripts/restore.sh` | 从备份恢复 |
| `scripts/smoke-test.sh` | 部署后自动验证（22 项 API 检查） |

---

## V1.0.0-Beta

| 字段 | 内容 |
|------|------|
| **发布日期** | 2026-07-20 |
| **Git Tag** | `v1.0.0-beta.1` |

### 包含

- 12 个 ORM 模型（Project / Order / IncomeFlow / CostFlow / Collection / Payment / BudgetAdjustment / Vendor / Supplier / SupplierPrice / SupplierYearPrice / ProjectBudget）
- 5 个物理外键（project_budget → project, income_flow → order, cost_flow → order, collection → income_flow, payment → cost_flow）
- 11 个路由模块（project / supplier / order / flow / budget / dashboard / collection_payment / vendor / supplier_year_price / supplier_overview / supplier_contract / supplier_unit_price）
- 10 个前端页面（Dashboard / ProjectList / SupplierPage / OrderPage / BudgetPage / CollectionPage / IncomeManagement / CostExecution / PaymentManagement / DictionaryCenter）
- ERP 导入工作台（5 步流程 + 对账引擎）
- 数据字典（11 分类 / 55 条目）
- 操作日志审计
- Business Analyzer（公司/合同/项目/订单 四维分析）

### 状态

```
✅ Development Complete → QA
```

---

## 版本规划

| 版本 | 目标 | 计划 |
|------|------|------|
| V1.0.0-RC1 | Pilot 试运行 | ✅ 已完成 |
| V1.0.0 | 正式发布 | 待 Pilot 验收通过 |
| V1.1.0 | Backlog 需求 + 优化 | 待规划 |
