# F1 Validation Report — 订单新增功能

> **BDD-02B F1 产出**
> 生成时间：2026-07-05
> 验证范围：订单新增（Order Create）

---

## 一、验证清单

### ① Build

| 检查项 | 结果 | 说明 |
|--------|:----:|------|
| Python 模型 | ✅ | Order 20 列，3 个新字段加载正常 |
| Pydantic Schema | ✅ | OrderCreate 15 字段，OrderResponse 含 order_source |

### ② Backend Tests

| 场景 | 结果 | 说明 |
|------|:----:|------|
| 框架合同下创建订单 | ✅ | `order_source` 自动推导为"框架合同" |
| 订单编号标准化 | ✅ | trim+upper → ORD-F1-001 存储为标准格式 |
| 重复订单编号 | ✅ | 409 `订单编号已存在` |
| 单项合同订单限制 | ✅ | 第 3 个订单报 422 `单项合同仅允许创建一个订单` |

### ③ Frontend Tests

待 F1 前端开发完成后补充。

### ④ Regression

现有 API 全部兼容。

### ⑤ API Contract

| 字段 | 标准 | 一致 |
|------|------|:----:|
| order_no | M, UNIQUE, 禁止自动生成 | ✅ |
| order_source | S, 自动推导, 禁止修改 | ✅ |
| owner_project_name | M, 可选 | ✅ |
| order_no normalization | trim+upper | ✅ |

### ⑥ Business Rules

| 规则 | 验证 |
|------|:----:|
| R001 订单唯一结算单元 | ✅ |
| R002 合同类型限制 | ✅ 框架合同 N 订单，单项合同 1 订单 |
| 编码规则 | ✅ order_no 禁止自动生成，ERP 匹配键 |

### ⑦ Business Validation（强制）

| 验证项 | 结果 | 说明 |
|--------|:----:|------|
| 框架合同业务验证 | ✅ | 下可创建多个订单 |
| 单项合同业务验证 | ✅ | 第 3 个订单被拒绝 |
| 编码规则验证 | ✅ | trim+upper 标准化，禁止自动生成 |
| 状态推导验证 | ✅ | 默认"待执行" |
| 数据来源验证 | ✅ | order_source=S，order_no=M |
| ERP 匹配影响 | ✅ | order_no 为 ERP 主匹配键 |

---

## 二、修改的文件

| 文件 | 说明 |
|------|------|
| `backend/app/models/order.py` | 新增 order_source, owner_project_name, owner_project_no |
| `backend/app/schemas/order.py` | Create/Update/Response 同步更新 |
| `backend/app/routers/order.py` | order_no 标准化 + order_source 推导 + 单项合同限制 |
| `FinanceDesk_Data/finance.db` | ALTER TABLE order 新增 3 列 |

---

## 三、结论

| 检查项 | 结果 |
|--------|:----:|
| Build | ✅ |
| Backend Tests | ✅ 4/4 通过 |
| API Contract | ✅ |
| Business Rules | ✅ |
| Business Validation | ✅ 6/6 通过 |

**F1（订单新增）后端开发完成。等待审批后进入 F2（订单列表）。**
