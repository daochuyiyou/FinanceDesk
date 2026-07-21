# RC-011 Runtime DOM Audit Report

> **日期**: 2026-07-12 | **类型**: P0
> **范围**: 全站菜单导航、DOM 渲染、按钮、筛选、组件完整性
> **验收**: 以浏览器最终运行效果为准

---

## P0 阻断问题（已修复）

### 1. 数据字典页面崩溃（🚨 P0）

**现象**: 点击"基础资料 → 数据字典" → 白屏 → `TypeError: e.reduce is not a function`

**根因**: API 路由冲突

| 层 | 问题 | 修复 |
|:---|:-----|:------|
| **后端路由** | `@router.get("/categories")` 被 `@router.get("/{category}")` 拦截 — `/categories` 被当作 category 参数处理，返回 `{items:[], total:0}` 而非分类数组 | 将 categories 移至独立 `categories_router`，前缀 `/dict-categories` |
| **数据库标签** | `func.count().label("count")` 与 SQLAlchemy `row.count` 冲突 → 返回 `builtin_function_or_method` 而非整数 | 改为 `label("item_count")` 和 `row.item_count` |
| **前端服务** | `fetchCategories()` 调用 `/dict/categories` → 收到 `{items,total}` 而非数组 | 改为 `/dict-categories` |
| **前端构建** | `dict.ts` 更新后未重建 dist → 浏览器仍加载旧代码 | 运行 `npx vite build` |

**修复文件**:
- `backend/app/routers/dict.py` — 分离 categories_router，修复标签名
- `backend/main.py` — 注册 categories_router
- `frontend/src/services/dict.ts` — 更新 API 路径
- `frontend/dist/` — 重建

### 2. 系统 Python Pydantic v2 兼容性

**现象**: 系统 `python3` 启动报 `ValueError: ge/le constraints not enforced`

**修复**: 移除 `erp.py` 中 `Query(ge=1)` / `Query(le=5000)` 约束（之前已完成）

**建议启动方式**: `./venv/bin/python main.py`

---

## 菜单导航

| 菜单项 | 状态 | 说明 |
|:-------|:----:|:------|
| 经营看板 | ✅ | 正常加载 |
| 数据导入（Data Import） | ✅ | 正常 |
| 合同管理 | ✅ | KPI + 详情可点击 |
| 订单管理 | ✅ | Drawer 正常 |
| 收入管理 | ✅ | 筛选/导入/编辑正常 |
| 成本执行 | ✅ | 同上 |
| 成本合同库 | ✅ | 子菜单可展开 |
| 收款 | ✅ | 按订单筛选正常 |
| 付款 | ✅ | 同上 |
| 财务集成 | ✅ | Excel 解析 + 对账 |
| 预算管理 | ✅ | 项目选择 + Tab |
| 基础资料→数据字典 | ✅ | **已修复** |
| 数据导入 | ✅ | |
| 操作日志 | ✅ | |

**无空白页、404、死循环** ✅

---

## DOM 渲染检查

| 检查项 | 结果 |
|:-------|:-----:|
| `\uXXXX` 原始显示 | ✅ 零出现 |
| `undefined` 显示 | ✅ 零出现 |
| `null` 显示 | ✅ 零出现 |
| `NaN` 显示 | ✅ 零出现 |
| `[object Object]` | ✅ 零出现 |
| HTML Entity 未解析 | ✅ 零出现 |

---

## 按钮可用性

| 操作 | 验证结果 |
|:-----|:---------|
| 新增 | ✅ 收入/成本/付款/合同/供应商 |
| 编辑 | ✅ 收入/成本/付款/预算 |
| 删除 | ✅ Popconfirm 确认 |
| 导入 | ✅ 6 套模板导入 |
| 导出 | ✅ Excel 导出 |
| 搜索 | ✅ 合同/订单搜索框 |
| 分页 | ✅ 全部表格分页可用 |

---

## 筛选联动

| 筛选 | 验证结果 |
|:-----|:---------|
| Analyzer 期间 | ✅ 跨页保留 |
| Analyzer 维度 | ✅ 公司/合同/项目/订单 |
| 按订单筛选 | ✅ 收入/收款/付款 |
| 项目选择器 | ✅ 预算管理 |
| 合同搜索 | ✅ 合同管理 |
| 高级筛选 | ✅ Analyzer 面板存在 |

---

## 组件完整性

| 组件 | 验证结果 |
|:-----|:---------|
| Drawer | ✅ 合同Drawer（订单列表可点击）|
| Dialog/Modal | ✅ 新增/编辑弹窗正常 |
| Table | ✅ 排序/列宽可拖拽 |
| Pagination | ✅ 全部表格 |
| Select | ✅ showSearch 可搜索 |
| KPI | ✅ 可点击跳转 |
| Breadcrumb | ✅ 导航路径显示 |

---

## Console 错误汇总

| 页面 | 错误数 | 类型 |
|:-----|:------:|:-----|
| Dashboard | 0 | — |
| 合同管理 | 0 | — |
| 订单管理 | 0 | — |
| 收入管理 | 0 | — |
| 成本执行 | 0 | — |
| 收款管理 | 0 | — |
| 付款管理 | 0 | — |
| 预算管理 | 0 | — |
| 数据字典 | 0 | ✅ **已修复** |
| 财务集成 | 0 | — |
| 数据导入 | 0 | — |
| 操作日志 | 0 | — |

---

## 结论

**P0 问题**: 2 个（数据字典崩溃 + Pydantic 兼容性），**已全部修复**

**当前状态**: 全站功能正常，无阻断问题，可进入正式试运行

**启动命令**: `cd backend && ./venv/bin/python main.py`
**访问地址**: `http://localhost:8000`
