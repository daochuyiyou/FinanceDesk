# AHF-02 Service Standard — 服务层技术标准

> **AHF-02 P1 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **本文件定义 FinanceDesk Service 层的职责边界、调用规范、文件组织。**
> **Service 层位于 Router 与 Engine 之间，负责非 Engine 业务编排。**

---

## 一、Service 层定位

Service Layer 是 Router 与 Engine 之间的**可选的业务编排层**。

| 属性 | 值 |
|:----:|-----|
| 角色 | 业务编排协调器 |
| 位置 | L6（Router L7 之下，Engine L5 之上） |
| 是否必须 | ❌ 可选 — 简单逻辑可直接 Router→Engine |
| 调用方 | Router |
| 被调方 | Engine, Repository |

---

## 二、Service 职责边界

| 职责 | 属于 Service | 说明 |
|:-----|:------------:|:------|
| 跨 Engine 编排 | ✅ | 调用多个 Engine 完成复杂业务 |
| 业务规则校验 | ✅ | 调用前校验（非核心规则） |
| 数据聚合 | ✅ | 组合多个 Repository 查询 |
| 非核心 CRUD 编排 | ✅ | 简单数据维护 |
| 核心业务逻辑 | ❌ | 属于 Engine |
| 数据访问 | ❌ | 属于 Repository |
| 事务管理 | ❌ | 属于 Engine |
| 事件生成 | ❌ | 属于 Mapping Engine |

---

## 三、Service 调用关系

```
Router (L7)
    │
    ├──→ Engine (L5)        ← 简单逻辑直接调用
    └──→ Service (L6)       ← 复杂逻辑走 Service
            │
            ├──→ Engine (L5)        ← 核心业务
            └──→ Repository (L4)    ← 数据读取（非核心）
```

### 调用规则（依据 AHF-01.5）

| 调用路径 | 许可 | 依据 |
|:---------|:----:|:-----|
| Router → Service | ✅ Allowed | 标准调用 |
| Service → Engine | ✅ Allowed | 主要调用方向 |
| Service → Repository | ✅ Allowed | 非核心数据读取 |
| Service → Service | ⚠️ Restricted | 需审批，避免长链 |
| Service → ORM | ❌ **Forbidden** | 必须通过 Repository |
| Service → Database | ❌ **Forbidden** | 禁止直连 |
| Service → Event | ⚠️ Restricted | 仅在 Engine 上下文中 |

---

## 四、Service 文件组织

### 目录结构

```
backend/app/services/
├── __init__.py                    # 统一导出
├── erp_sync.py                    # ERP 匹配服务（Engine 辅助）
├── erp_excel_parser.py            # Excel 解析服务（工具类）
├── budget.py                      # 预算服务
├── erp_import_service.py          # ERP 导入编排服务（未来）
├── dashboard_service.py           # Dashboard 数据聚合服务（未来）
└── notification_service.py        # 通知服务（未来）
```

### 命名规范

| 规则 | 标准 | 反例 |
|:----|:-----|:-----|
| 文件名 | `snake_case_service.py` | `ServiceFile.py` |
| 类名 | `PascalCaseService` | `data_service` |
| 方法名 | `snake_case` | `ProcessData()` |

### 现有 Service 分类

| 文件 | 类型 | 说明 |
|:-----|:-----|:------|
| `erp_excel_parser.py` | **工具 Service** | 纯函数，无状态，不可变 |
| `erp_sync.py` | **Engine 辅助 Service** | 匹配算法，供 Engine 调用 |
| `budget.py` | **业务 Service** | 预算计算，独立业务域 |

---

## 五、Service 方法规范

### 输入/输出

| 规范 | 要求 |
|:-----|:------|
| **输入** | 业务参数（基本类型或 Pydantic Schema） |
| **输出** | `dict` 或 Pydantic Response Model |
| **异常** | 抛 `ValueError` 或自定义业务异常 |
| **无状态** | Service 实例不应持有状态 |
| **无 ORM 引用** | import 中不得有 `from app.models import` |

### 方法签名示例

```python
# ✅ 正确
class DashboardService:
    def get_order_summary(self, order_id: int) -> dict:
        engine = OrderEngine()
        return engine.calculate_summary(order_id)

# ❌ 错误
class DashboardService:
    def get_order_summary(self, order_id: int) -> dict:
        return db.query(Order).filter(Order.id == order_id).first()  # 直接 ORM
```

---

## 六、Service 与 Engine 分工

| 场景 | 使用 Engine | 使用 Service |
|:-----|:-----------:|:------------|
| ERP 数据导入 | ✅ Import Engine | — |
| 订单匹配 | ✅ Mapping Engine | — |
| 规则执行 | ✅ Rule Engine | — |
| Summary 计算 | ✅ Summary Engine | — |
| 跨 Engine 编排（如导入+匹配+汇总） | — | ✅ ImportService |
| Dashboard 数据聚合 | — | ✅ DashboardService |
| 非核心 CRUD（字典维护） | — | ✅ 直接 Router→Repository |
| 通知发送 | — | ✅ NotificationService |
| Excel 导出 | — | ✅ ExportService |

---

## 七、Service 禁止事项

| # | 禁止 | 原因 | 替代 |
|:-:|:-----|:-----|:-----|
| 1 | ❌ 直接访问 ORM | 违反分层 | 调用 Repository |
| 2 | ❌ 控制事务（commit/rollback） | 事务责任在 Engine | Engine 管理事务 |
| 3 | ❌ 包含核心业务规则 | 属于 Engine | 放到 Engine |
| 4 | ❌ 生成业务事件 | 属于 Mapping Engine | Engine 生成事件 |
| 5 | ❌ 循环调用其他 Service | 增加耦合 | 由 Router 编排 |
| 6 | ❌ 持有状态 | 多线程不安全 | 无状态设计 |
| 7 | ❌ 直接操作 ERP Staging 表 | 属于 Import Engine | Engine 管理导入 |

---

## 八、Service 创建条件

仅在以下条件满足时创建 Service：

| 条件 | 说明 |
|:-----|:------|
| 需要编排 2 个以上 Engine | 如导入+匹配+汇总需要 ImportService |
| 非核心业务规则聚合 | 如 Dashboard 数据聚合 |
| 跨模块数据组合 | 如订单+供应商+合同组合查询 |
| Router 逻辑超过 50 行 | 抽到 Service 保持 Router 简洁 |

**简单 CRUD** (CRUD < 20 行) 不需要 Service，Router 可直接调用 Repository。

---

## 九、与已冻结标准一致性

| Standard | 符合 | 说明 |
|:---------|:----:|------|
| Business Constitution | ✅ | Service 不修改 ERP Fact，不包含经营计算 |
| BADR | ✅ | BADR-003 归属订单，Service 调用 Engine 保障 |
| AHF-01 Repository | ✅ | Service 禁止直接 ORM |
| AHF-01.5 Dependency | ✅ | Service→Engine→Repository 单向调用 |
| Architecture Roadmap | ✅ | Service 作为 L6 层 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
