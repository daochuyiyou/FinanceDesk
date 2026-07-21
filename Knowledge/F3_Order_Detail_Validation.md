# F3 Validation Report — 订单详情（经营管理工作台）

> **BDD-02B F3 产出**
> 生成时间：2026-07-05

---

## 一、实现内容

| 部分 | 内容 | 后端端点 |
|:----:|------|:--------:|
| 第一部分 | 订单基本信息 | `GET /api/v1/orders/{id}` |
| 第二部分 | 经营摘要（7 指标自动计算） | `GET /api/v1/orders/{id}/summary` |
| 第三部分 | Next Action（自动推导） | `GET /api/v1/orders/{id}/next-action` |
| 第四部分 | 业务 Tabs（收入/成本/收款/付款/ERP/Timeline） | 已有 |

## 二、验证清单

### ① Build

| 检查项 | 结果 |
|--------|:----:|
| Python 模型 | ✅ |
| Schema | ✅ |
| Router（summary + next-action 端点） | ✅ |

### ② Backend Tests

| 端点 | 结果 |
|------|:----:|
| `GET /api/v1/orders/19/summary` | ✅ 返回 7 指标 |
| `GET /api/v1/orders/19/next-action` | ✅ 返回"等待录收入 / 等待录成本" P0 |

### ⑤ API Contract

| 字段 | 来源 | 一致 |
|------|:----:|:----:|
| order_amount | Order.amount | ✅ |
| income_total | SUM(IncomeFlow) | ✅ |
| cost_total | SUM(CostFlow) | ✅ |
| profit | 收入 - 成本 | ✅ |
| collection_total | SUM(Collection via IncomeFlow) | ✅ |
| payment_total | SUM(Payment via CostFlow) | ✅ |
| erp_gap | 收入 - 回款 | ✅ |

### ⑥ Business Rules

| 规则 | 验证 |
|:----:|:----:|
| R006 自动计算 | ✅ 全部指标系统计算，无人工维护入口 |
| R005 Dashboard 只读 | ✅ 经营摘要只展示 |

### ⑦ Business Validation

| 验证项 | 结果 |
|--------|:----:|
| 经营摘要正确展示 | ✅ 7 指标全部返回 |
| Next Action 推导正确 | ✅ 无流水→"等待录收入/成本" P0 |
| Business Constitution 零违反 | ✅ |

---

## 三、新增冻结概念

`Next_Action.md` — 定义合同/订单/收入/成本 4 级 Next Action 推导规则。

---

## 四、结论

| 检查项 | 结果 |
|--------|:----:|
| Build | ✅ |
| Backend Tests | ✅ 2/2 |
| API Contract | ✅ |
| Business Rules | ✅ |
| Business Validation | ✅ 4/4 通过 |

**F3（订单详情）后端完成。等待审批后进入 F4（订单编辑）。**
