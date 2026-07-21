# BDD-01 Risk Assessment — 合同中心风险评估

> **BDD-01 Sprint Planning P4 输出**
> 更新时间：2026-07-04

---

## 一、风险总览

| # | 风险类别 | 等级 | 可能性 | 影响 | 应对措施 |
|:-:|---------|:----:|:------:|:----:|---------|
| R1 | 数据库风险 | 🟢 低 | 20% | 中 | 无表结构变更 |
| R2 | API 风险 | 🟢 低 | 15% | 中 | 现有 API 基本完整 |
| R3 | 历史兼容风险 | 🟡 中 | 40% | 高 | 需确保已存数据兼容 |
| R4 | UI 重构风险 | 🟡 中 | 30% | 中 | 渐进式调整 |
| R5 | 权限体系风险 | 🟠 高 | 60% | 高 | 需独立解决 |
| R6 | 字典依赖风险 | 🟢 低 | 25% | 低 | 现有字典已覆盖 |

---

## 二、详细风险评估

### R1 — 数据库风险

| 维度 | 评估 |
|------|------|
| **描述** | 合同中心涉及 `project` 表。BDD 阶段不允许修改数据库结构 |
| **风险** | 当前字段是否完全满足合同中心需求？`project` 表字段偏少（framework_name, sign_date, start_date, end_date, internal_or_external, project_type），缺少甲方业主信息字段（如 `customer_name`, `customer_contact`） |
| **等级** | 🟢 低 |
| **应对** | 本次 Sprint 不修改表结构；甲方业主信息通过 Order.customer_name 关联；如需新增字段放入 BDD-02 规划 |

### R2 — API 风险

| 维度 | 评估 |
|------|------|
| **描述** | 合同中心现有 5 个 API 端点（list/create/get/patch/delete），均为标准 CRUD |
| **风险** | 框架合同筛选可能需新增 `?framework=` 查询参数 |
| **等级** | 🟢 低 |
| **应对** | 在现有 `project.py` router 中追加查询参数，不破坏现有接口 |

### R3 — 历史兼容风险

| 维度 | 评估 |
|------|------|
| **描述** | `project` 表中已存在真实业务数据 |
| **风险** | 菜单重命名、字段重命名、页面重构可能导致已有数据无法正常展示或操作 |
| **等级** | 🟡 中 |
| **应对** | 所有数据迁移/兼容通过 SQLite 备份验证；变更前备份 `finance.db`；零数据丢失保障 |

### R4 — UI 重构风险

| 维度 | 评估 |
|------|------|
| **描述** | ProjectList.tsx → 重命名为"合同中心"，调整菜单分组 |
| **风险** | 菜单拖拽排序的 localStorage key (`finance_desk_menu_order`) 可能导致用户自定义顺序失效 |
| **等级** | 🟡 中 |
| **应对** | 文档说明菜单拖拽排序功能不受影响；菜单 key 不改变 |

### R5 — 权限体系风险

| 维度 | 评估 |
|------|------|
| **描述** | 当前系统无独立用户认证和权限体系 |
| **风险** | 实现合同中心的权限控制需要新建用户/角色表，这是结构变更 |
| **等级** | 🟠 高 |
| **应对** | F10 列为 P2 优先级，待用户认证体系建立后再实施；首期 Sprint 不实施权限控制 |

### R6 — 字典依赖风险

| 维度 | 评估 |
|------|------|
| **描述** | 合同类型的枚举值（项目类型、集团内外）依赖于 SysDictionary 种子数据 |
| **风险** | 字典数据缺失会导致 Select 下拉为空 |
| **等级** | 🟢 低 |
| **应对** | 确认种子数据（`scripts/seed_dictionary.py`）已包含 `project_type` 和 `internal_or_external` 两字典分类 |

---

## 三、回滚方案

### 3.1 代码回滚

```bash
# Feature 级别回滚
git revert <feature_commit>
git push origin main

# 全量回滚
git reset --hard HEAD~N   # N = 当前 Sprint 的提交数
git push origin main --force-with-lease
```

### 3.2 数据库回滚

```bash
# SQLite 备份恢复
cp backend/FinanceDesk_Data/finance.db backend/FinanceDesk_Data/finance.db.bak

# 回滚
cp backend/FinanceDesk_Data/finance.db.bak backend/FinanceDesk_Data/finance.db
```

### 3.3 API 回滚

API 变更均为向后兼容（添加查询参数），不涉及路径/方法变更，无需回滚。

### 3.4 前端回滚

前端打包产物为静态文件，回滚只需重新部署旧版本：

```bash
# 重新 build 旧版本
git checkout <previous_tag>
cd frontend && npx vite build
systemctl --user restart financedesk
```

---

## 四、风险汇总矩阵

| Feature | R1 数据库 | R2 API | R3 历史兼容 | R4 UI 重构 | R5 权限 | R6 字典 |
|:-------:|:---------:|:------:|:-----------:|:----------:|:-------:|:-------:|
| F1 列表 | 🟢 | 🟢 | 🟡 | 🟢 | 🟢 | 🟢 |
| F2 新增 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| F3 编辑 | 🟢 | 🟢 | 🟡 | 🟢 | 🟢 | 🟢 |
| F4 详情 | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 | 🟢 |
| F5 框架 | 🟡 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 |
| F6 单项 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| F7 导入 | 🟢 | 🟢 | 🟡 | 🟢 | 🟢 | 🟢 |
| F8 导出 | 🟢 | 🟡 | 🟢 | 🟢 | 🟢 | 🟢 |
| F9 筛选 | 🟢 | 🟡 | 🟢 | 🟢 | 🟢 | 🟢 |
| F10 权限 | 🟠 | 🟠 | 🟢 | 🟢 | 🟠 | 🟢 |

### 综合风险评分

| 维度 | 风险评分 | 说明 |
|------|:--------:|------|
| 数据库风险 | 🟢 1/5 | 无表结构变更 |
| API 风险 | 🟢 2/5 | 仅追加查询参数 |
| 历史兼容风险 | 🟡 3/5 | 需注意已存数据 |
| UI 重构风险 | 🟡 2/5 | 渐进式调整 |
| 权限体系风险 | 🟠 4/5 | 依赖未来认证体系 |
| 字典依赖风险 | 🟢 1/5 | 种子数据已覆盖 |
| **综合** | **🟡 2.2/5** | **整体可控，建议按计划执行** |

---

## 五、开发保障措施

| 措施 | 说明 |
|------|------|
| 每次代码修改前备份 DB | `cp finance.db finance.db.bak` |
| 每个 Feature 独立分支 | `git checkout -b bdd-01-f1-list` |
| 每批完成后全量回归 | `pytest -x && vitest run` |
| 不可一次性完成多个 Feature | 严格按 Feature 维度和批次 |
| 先审批后开发 | 每个 Feature 开发前确认 Sprint Plan 无误 |
