# FinanceDesk 系统架构

> **永久文档 · Single Source of Truth**
> 更新时间：2026-07-04
> 交叉引用：[01_Project_Position](./01_Project_Position.md) · [03_Business_Architecture](./03_Business_Architecture.md) · [04_Data_Model](./04_Data_Model.md)

---

## 1. 技术栈

| 层级 | 技术 | 版本/说明 |
|------|------|----------|
| 后端框架 | FastAPI | Python 3.10+ |
| ORM | SQLAlchemy | 2.x |
| 数据验证 | Pydantic v2 | Schema 定义 |
| 数据库 | SQLite | 开发/单机部署（生产待切换 MariaDB） |
| 数据库迁移 | Alembic | 已初始化，初始迁移已生成 |
| 前端框架 | React 18 | Vite 构建 |
| UI 组件 | Ant Design 5 | ProTable, ProResizableTable |
| 构建工具 | Vite | TypeScript strict 模式 |
| 测试后端 | pytest | 68 个测试 |
| 测试前端 | Vitest | 9 个测试 |

## 2. 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                   前端 (React 18 + Ant Design 5)              │
│  src/                                                        │
│  ├── pages/    ← 10 页面组件（11 个 page 文件）               │
│  ├── services/ ← 10 API 服务模块（axios 封装）               │
│  └── components/ ← 公共组件（ImportModal, DictSelect 等）    │
│                                                             │
│     ┌─────── REST API /api/v1/* ──────────┐                 │
│     ▼                                        ▼               │
└─────────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│                   后端 (FastAPI + SQLAlchemy)                 │
│  backend/app/                                                │
│  ├── models/  ← 12 ORM 模型（6 个文件）                     │
│  ├── schemas/ ← Pydantic v2 定义                             │
│  ├── routers/ ← 11 路由文件（8 个 Router 前缀）               │
│  ├── utils/   ← 审计日志等工具                               │
│  └── database.py ← 引擎 + Base                               │
│                                                             │
│     │                                                       │
│     ▼                                                       │
│  SQLite DB ←── Alembic 迁移管理                              │
│  backend/FinanceDesk_Data/finance.db                        │
└─────────────────────────────────────────────────────────────┘
```

## 3. 部署架构

### 3.1 开发环境

```bash
# 后端
cd backend && python main.py
# 前端（Vite Dev Server）
cd frontend && npx vite
```

### 3.2 生产环境

```bash
# 构建前端 → 静态文件
cd frontend && npx vite build
# 产物落入 backend/static/
cd backend && python main.py
```

### 3.3 生产部署

| 组件 | 方式 | 说明 |
|------|------|------|
| 后端服务 | 用户级 systemd | `~/.config/systemd/user/` |
| 端口 | Uvicorn | 默认 8000 |
| 静态文件 | FastAPI StaticFiles | `backend/static/` |
| 开机自启 | `systemctl --user enable` | 已配置 |

## 4. API 路由前缀

所有接口统一前缀 `/api/v1`，共 **45 个已验证接口**：

| Router 文件 | 路由路径 | 接口数 |
|------------|---------|--------|
| `project.py` | `/api/v1/projects/**` | 5 |
| `vendor.py` | `/api/v1/vendors/**` | 5 |
| `supplier.py` | `/api/v1/suppliers/**` | 6（含旧单价） |
| `supplier_year_price.py` | `/api/v1/vendors/{vid}/year-prices/**` | 5 |
| `supplier_overview.py` | `/api/v1/overview/**` | 2 |
| `order.py` | `/api/v1/orders/**` | 5 |
| `flow.py` | `/api/v1/orders/{oid}/incomes-costs/**` | 10（收入 5 + 成本 5） |
| `budget.py` | `/api/v1/projects/{pid}/adjustments/**` | 5 |
| `collection_payment.py` | `/api/v1/collection/**` + `/api/v1/payment/**` | 10（回款 5 + 支付 5） |
| `dashboard.py` | `/api/v1/dashboard/**` | 4 |
| **合计** | | **45** |

## 5. 目录结构

```
source/
├── Knowledge/                ← 知识库（本文件所属）[永久文档]
├── docs/                     ← 原始文档（归档用）[阶段性文档]
├── backend/
│   ├── main.py               ← 入口 + 路由注册
│   ├── app/
│   │   ├── models/           ← 12 ORM 模型
│   │   ├── schemas/          ← Pydantic v2 Schemas
│   │   ├── routers/          ← 11 API 路由
│   │   └── database.py       ← SQLAlchemy 引擎
│   ├── static/               ← 前端打包产物
│   ├── tests/                ← pytest 测试（68 个）
│   ├── templates/            ← 9 种 Excel 导入模板
│   └── FinanceDesk_Data/     ← SQLite 数据库文件
├── frontend/
│   └── src/
│       ├── pages/            ← 10 页面组件
│       ├── services/         ← 10 API 服务
│       └── components/       ← 公共组件
└── .hermes.md                ← AI 上下文（已指向 Knowledge/）
```

## 6. 安全与运维

| 项目 | 状态 |
|------|------|
| 数据库权限 | `FinanceDesk_Data` 归属 `zjq` 用户 |
| 审计日志 | 已实现（`audit_log` 表 + `audit.py`） |
| API 验证 | 45/45 接口通过 curl 验证 |
| 测试覆盖 | 后端 68 测试全部通过，前端 9 测试全部通过 |
