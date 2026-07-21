# FinanceDesk 开发公约

> **永久文档 · Single Source of Truth**
> 更新时间：2026-07-04
> 交叉引用：[03_Business_Architecture](./03_Business_Architecture.md) · [07_System_Architecture](./07_System_Architecture.md) · [10_Technical_Debt](./10_Technical_Debt.md)

---

## 1. 通用规范

### 1.1 导入规范

所有 Python 文件必须使用**绝对导入**，禁止相对导入：

```python
# ✅ 正确
from app.database import get_db
from app.models import Order, Project
from app.schemas.order import OrderCreate

# ❌ 禁止
from ..database import get_db
from ..models import Order
```

**导入顺序**：
1. Python 标准库（`datetime`, `typing` 等）
2. 第三方库（`fastapi`, `sqlalchemy` 等）
3. 项目内部模块（`app.database`, `app.models`, `app.schemas`）
每组之间空一行。

### 1.2 PEP 8 最低标准

| 规则 | 等级 | 说明 |
|------|------|------|
| E702/E701（分号/冒号语句） | 🔴 强制 | 禁止一行多条语句 |
| E712（布尔比较） | 🔴 强制 | 使用 `.is_(False)` 替代 `== False` |
| E501（行超长） | 🟡 推荐 | 超过 120 字符酌情拆分 |
| E302（缺空行） | 🟡 推荐 | 类/函数前保留 2 空行 |
| W292（文件末尾换行） | 🟢 可选 | 保留文件末尾换行 |

### 1.3 TypeScript

- `strict: true` 已开启（`tsconfig.json`）
- `noUnusedLocals` 和 `noUnusedParameters` 未启用

## 2. 代码架构规范

### 2.1 模型层（ORMs）

- 所有模型继承 `app/database.py` 的 `HermesBaseModel`
- 物理外键使用 SQLAlchemy `ForeignKey`（RESTRICT 删除规则）
- 逻辑关联使用 INDEX + 应用层校验

### 2.2 Schema 层（Pydantic v2）

- Create Schema：必填字段直接声明（含约束 validation）
- Update Schema：所有字段 `Optional`，使用 `exclude_unset=True`
- Response Schema：继承 `HermesBaseModel` 的公共字段

### 2.3 Router 层

- 每个路由函数使用 `_get_xxx_or_404` 模式抽取查库+校验逻辑
- 分页参数统一 `page` / `page_size` / `total`
- 逻辑删除统一 `is_deleted == False` 过滤

### 2.4 前端

- 所有 API 调用通过 `services/` 下的模块封装
- axios 实例由 `services/api.ts` 管理（自动适配 baseURL）
- 前端路由由 `App.tsx` 统一管理（Suspense + lazy load）
- 字典化选择用 `DictSelect` 组件替代硬编码 Select

## 3. 治理管道

所有变更必须经过以下阶段，**每阶段独立审批**：

```
M0  ── 审计（现状评估）
M0.5 ── 架构（方案设计）
M0.8 ── 验证（原型验证）
M1  ── 实施（第一阶段）
M2  ── 实施（第二阶段）
M3  ── 实施（第三阶段）
RC  ── 发布候选
Beta ── 公测
v1  ── 正式发布
```

关键约束：
- 每阶段**单一主题**：禁止在一个 Milestone 混合不同类型的目标
- **范围锁死**：每阶段只改 Manifest 批准的文件
- **文档先行**：修改前必须有计划文档，修改后必须有验证报告
- 技术债跟踪：详见 [10_Technical_Debt](./10_Technical_Debt.md)

## 4. 开发工作流

### 4.1 新增功能
1. 审计 → 评估影响范围
2. 写实施计划（`.hermes/plans/`）
3. Qwen3.7-Max 全量代码审查
4. 分批修改（每 3-4 文件 → 提交）
5. 验证：TS 编译零错误 + curl 验证
6. 全量测试通过

### 4.2 代码修改四步
1. **备份**：git commit 或快照
2. **审查**：Qwen3.7-Max 全量审查
3. **部署**：分批修改 + 提交
4. **验证**：curl 所有 API + TS 编译零错误

### 4.3 部署验证
```bash
# 部署后验证顺序
1. curl 所有 API（返回 200/201/204）
2. TS 编译零错误（npx tsc --noEmit）
3. 前端白屏检查（console 无报错）
4. pytest / vitest 全量通过
```

### 4.4 错误排查顺序
```bash
1. DB 目录权限（chmod 777）
2. 端口占用（fuser / sudo kill -9）
3. systemd 残留（disable 后 enable + start）
4. 首次手动启动验证 → kill → systemctl start 交还守护
```

## 5. 数据导入规范

### 5.1 中英字段映射
- Pydantic 模型用**英文字段**
- Excel 模板用**中文列头**
- `process_excel` 入口必须调用 `translate_headers()` 转换

### 5.2 双轨架构（ETL）
- 新数据走暂存表，不修改现有业务表
- 矢量化切片（禁止 `iterrows()`）
- `ON CONFLICT DO NOTHING` 去重
- 双列（贷方/借方）智能分流 → 收入/成本池

## 6. 测试规范

| 类别 | 框架 | 覆盖要求 |
|------|------|---------|
| 后端 | pytest + httpx (FastAPI TestClient) | 核心 CRUD 端点全覆盖 |
| 前端 | Vitest | API 服务 + 组件 + 页面 |
| 最低通过 | — | 全部测试通过方可合并 |
