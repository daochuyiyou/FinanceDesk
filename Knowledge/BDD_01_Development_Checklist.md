# BDD-01 Development Checklist — 合同中心开发检查清单

> **BDD-01 Sprint Planning P3 输出**
> 更新时间：2026-07-04
> 每个 Feature 必须完成全部 7 项检查后方可进入下一个 Feature。

---

## 一、检查清单模板

| # | 检查项 | 说明 | 通过标准 |
|:-:|--------|------|---------|
| 1 | 🏗️ **Build** | 代码编译零错误 | `npx tsc --noEmit` ✅ · `python -m py_compile` ✅ |
| 2 | 🧪 **Backend Tests** | 后端 pytest 通过 | `pytest` — 新增测试 + 回归测试全部通过 |
| 3 | 🎨 **Frontend Tests** | 前端 Vitest 通过 | `vitest run` — 新增测试 + 回归测试全部通过 |
| 4 | 🔄 **Regression** | 全量回归测试 | `pytest + vitest run` — 全部通过（不得低于现有基数） |
| 5 | 📮 **API Contract** | API 与 Business_Data_Model 一致 | 字段名、类型、必填符合字段标准（Business_Field_Standard） |
| 6 | 🖥️ **UI Review** | 页面符合 UI_Architecture 职责定义 | 无超出职责的功能 · 无违反 UI Freeze 的行为 |
| 7 | 📋 **Business Rule Review** | 遵守 Business_Rules + Business_Constitution | 无违反红线/禁止项/BADR |

---

## 二、Feature 级检查清单

### F1 合同列表

| # | 检查项 | 具体内容 |
|:-:|--------|---------|
| 1 | Build | 确认现有 TypeScript 编译无新增错误 |
| 2 | Backend Tests | `GET /api/v1/projects` 分页 + 排序测试 |
| 3 | Frontend Tests | 列表渲染测试、分页组件测试 |
| 4 | Regression | `pytest -x` 68 个测试 + `vitest run` 9 个测试 |
| 5 | API Contract | 返回字段与 Business_Data_Model Contract 模型一致 |
| 6 | UI Review | 页面标题为"合同中心"，菜单分组归属"经营管理" |
| 7 | Business Rule | 无违反 |

### F2 合同新增

| # | 检查项 | 具体内容 |
|:-:|--------|---------|
| 1 | Build | TS + Python 编译 |
| 2 | Backend Tests | `POST /api/v1/projects` 字段校验 + 必填检查 |
| 3 | Frontend Tests | 表单验证、提交流程 |
| 4 | Regression | 全量 |
| 5 | API Contract | framework_name 必填，字段名遵从标准 |
| 6 | UI Review | 表单区分框架合同/单项合同；无超出职责的字段 |
| 7 | Business Rule | R002（仅两种合同类型） |

### F3 合同编辑

| # | 检查项 | 具体内容 |
|:-:|--------|---------|
| 1 | Build | TS + Python |
| 2 | Backend Tests | `PATCH /api/v1/projects/{id}` 部分更新、ERP 字段只读 |
| 3 | Frontend Tests | 编辑回填、ERP 字段禁用 |
| 4 | Regression | 全量 |
| 5 | API Contract | PATCH 使用 `exclude_unset=True` |
| 6 | UI Review | ERP 来源字段（erp_no）显示为只读 |
| 7 | Business Rule | R003（ERP 数据不可修改）+ R004（来源标记） |

### F4 合同详情

| # | 检查项 | 具体内容 |
|:-:|--------|---------|
| 1 | Build | TS |
| 2 | Backend Tests | `GET /api/v1/projects/{id}` + 关联订单列表 |
| 3 | Frontend Tests | 详情渲染、嵌套订单列表 |
| 4 | Regression | 全量 |
| 5 | API Contract | 详情接口包含全部业务字段 |
| 6 | UI Review | 详情页含关联订单列表（可跳转订单中心） |
| 7 | Business Rule | 无违反 |

### F5 框架合同支持

| # | 检查项 | 具体内容 |
|:-:|--------|---------|
| 1 | Build | TS + Python |
| 2 | Backend Tests | 框架下多项目创建、框架筛选 |
| 3 | Frontend Tests | 框架合同标识、筛选功能 |
| 4 | Regression | 全量 |
| 5 | API Contract | 需确认 `?framework=` 查询参数 |
| 6 | UI Review | 框架合同可在详情页看到关联项目列表 |
| 7 | Business Rule | R002（框架合同生命周期） |

### F6 单项合同支持

| # | 检查项 | 具体内容 |
|:-:|--------|---------|
| 1 | Build | TS |
| 2 | Backend Tests | 创建单项合同 |
| 3 | Frontend Tests | 单项/框架列表区分展示 |
| 4 | Regression | 全量 |
| 5 | API Contract | 无变更 |
| 6 | UI Review | 列表中以不同标识区分 |
| 7 | Business Rule | R002 |

### F7 Excel 导入

| # | 检查项 | 具体内容 |
|:-:|--------|---------|
| 1 | Build | Python |
| 2 | Backend Tests | 模板解析 → 导入 → 错误报告 |
| 3 | Frontend Tests | 导入按钮 → 文件上传 → 进度反馈 → 结果展示 |
| 4 | Regression | 全量 |
| 5 | API Contract | 返回 {success, total, errors} |
| 6 | UI Review | 导入入口在合同列表页 |
| 7 | Business Rule | R007（统一模板）+ R009（单次录入） |

### F8 Excel 导出

| # | 检查项 | 具体内容 |
|:-:|--------|---------|
| 1 | Build | Python + TS |
| 2 | Backend Tests | 导出文件格式、列头一致性 |
| 3 | Frontend Tests | 导出按钮 → 文件下载 |
| 4 | Regression | 全量 |
| 5 | API Contract | 新增 `GET /api/v1/projects/export` |
| 6 | UI Review | 导出的列头与导入模板一致 |
| 7 | Business Rule | R007（统一导出） |

### F9 查询与筛选

| # | 检查项 | 具体内容 |
|:-:|--------|---------|
| 1 | Build | TS |
| 2 | Backend Tests | 筛选参数组合测试 |
| 3 | Frontend Tests | 筛选条件交互、重置 |
| 4 | Regression | 全量 |
| 5 | API Contract | 确认筛选参数命名规范 |
| 6 | UI Review | 筛选条件不超出合同业务所需 |
| 7 | Business Rule | 无违反 |

### F10 权限控制

| # | 检查项 | 具体内容 |
|:-:|--------|---------|
| 1 | Build | Python + TS |
| 2 | Backend Tests | 权限装饰器测试 |
| 3 | Frontend Tests | 无权限页面处理 |
| 4 | Regression | 全量 |
| 5 | API Contract | 权限相关状态码（401/403） |
| 6 | UI Review | 无权限用户看不到菜单项 |
| 7 | Business Rule | 无违反 |

---

## 三、不可跳过的硬性门槛

| 门槛 | 说明 | 违反后果 |
|------|------|---------|
| 🔴 **Build 必须零错误** | `tsc --noEmit` 和 Python 语法检查 | 禁止提交代码 |
| 🔴 **回归测试必须全量通过** | pytest + vitest 全部 | 禁止进入下一 Feature |
| 🔴 **Business Rule Review 必须通过** | 违反 Constitution 则 Feature 退回 | 架构冻结保障 |
| 🟡 **API Contract 必须对齐** | 字段命名、类型、必填 | BDD 数据对齐基础 |
