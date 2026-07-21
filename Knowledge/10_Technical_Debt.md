# FinanceDesk 技术债登记

> **永久文档 · Single Source of Truth**
> 更新时间：2026-07-04
> 交叉引用：[08_Development_Constitution](./08_Development_Constitution.md) · [09_Roadmap](./09_Roadmap.md)

---

## 1. 当前技术债（按优先级排序）

### 🔴 高危

| # | 项目 | 影响 | 修复方向 | 目标版本 |
|---|------|------|---------|---------|
| T1 | 无集中式异常处理 | 各 router 返回不同错误格式，前端难以统一处理 | 统一异常拦截器 + 标准错误响应模型 | M2 |
| T2 | Dashboard 原生 SQL 与 SQLite 耦合 | 使用 `julianday` 函数，切换数据库需全部重写 | 用 SQLAlchemy ORM 重写 | M3 |
| T3 | `supplier_overview.py` 批导入事务脆弱 | 手工 flush/rollback/begin，事务边界不清晰 | 重构批导入事务管理 | M2 |

### 🟡 中危

| # | 项目 | 影响 | 修复方向 | 目标版本 |
|---|------|------|---------|---------|
| T4 | 无配置管理 | DB 路径等硬编码，仅 PORT 来自环境变量 | pydantic-settings 配置管理 | M2 |
| T5 | 无日志框架 | 仅 print() 输出，不具备分级/落盘能力 | logging + uvicorn logger | M2 |
| T6 | CRUD 模板代码重复 | ~50 个路由函数 95% 结构一致 | BaseCRUD Router 抽象 | M3 |
| T7 | 分页逻辑重复 | 每个 list 端点重复实现 page/page_size/total | 统一分页基类 | M3 |
| T8 | SQLite 不适配生产多写 | 并发写入锁冲突，数据一致性风险 | MariaDB 迁移 | M2 |
| T9 | `is_deleted == False` 过滤约 20 处重复 | 每处手动添加，遗漏即产生逻辑 bug | 统一 Query 过滤器 mixin | M3 |

### 🔵 低危

| # | 项目 | 影响 | 修复方向 | 目标版本 |
|---|------|------|---------|---------|
| T10 | 行超长 106 处（14 个文件） | 代码可读性降低 | 酌情拆分（可保留部分合理超长） | M3 |
| T11 | `database.py` 类型注解缺失 | 静态分析提示缺失 | 补充完整类型注解 | M2 |
| T12 | 6 个路由函数缺返回值注解 | mypy/pyright 提示缺失 | 补充 `-> dict`/`-> list` 等 | M2 |

## 2. 已修复问题

| # | 原问题 | 修复版本 | 说明 |
|---|--------|---------|------|
| F1 | 分号语句 22 处 (E702/E701) | M0 | supplier_overview.py / vendor.py / supplier_year_price.py |
| F2 | `== False` 布尔比较 4 处 (E712) | M0 | collection_payment.py |
| F3 | 3 页面 import 缺失 → 运行时 ReferenceError | M0 | 修复最高优先级崩溃 |
| F4 | Decimal → number 序列化断裂 | M0 | Pydantic json_encoders 修复 |
| F5 | 9 模块导入断裂（中英映射缺失） | M0.5 | translate_headers() 统一入口 |

## 3. 技术债管理规则

- 新增代码引入新技术债 → 必须在同一 PR 中创建对应 TechnicalDebt 条目
- 修复技术债 → 在条目上标记修复版本 + 关闭日期
- M1-M3 每次迭代至少分配 30% 容量用于技术债还款
- 严重度评级由实际影响决定，非主观判断

## 4. 指标

| 指标 | 当前值 | 目标 |
|------|--------|------|
| 高危项 | 3 | 0 |
| 中危项 | 6 | 2（保留可接受的） |
| 低危项 | 3 | 0 |
| **合计** | **12** | **2** |
