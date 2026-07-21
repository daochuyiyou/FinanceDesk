# BDD-04B Validation — Revenue CRUD

> **BDD-04B 产出**
> 更新时间：2026-07-05

---

## 一、Build & API 验证

| 检查项 | 结果 | 说明 |
|--------|:----:|------|
| Python 模型 | ✅ | IncomeFlow 20 列（含 5 个新增经营字段） |
| Schema Create | ✅ | 18 字段 |
| Schema Update | ✅ | 全部可选 |
| Schema Response | ✅ | 含经营字段 |
| DB 迁移 | ✅ | 5 列 ALTER TABLE 成功 |

## 二、Business Walkthrough（业务走查）

| 场景 | 描述 | 验证方式 |
|:----:|------|:--------:|
| 场景一 | 单项合同→唯一 Order→收入→收款→Dashboard | ✅ 业务走查文档完整 |
| 场景二 | 框架合同→N 个 Order→多次收入→多次收款 | ✅ 业务走查文档完整 |
| 场景三 | 收入红冲→重新登记→Dashboard 自动更新 | ✅ 业务走查文档完整 |

## 三、冻结规则验证

| 规则 | 验证 |
|:----:|:----:|
| Revenue 只记录事实，不计算经营指标 | ✅ |
| 经营指标统一调用 Revenue Summary | ✅ Revenue_Summary_Model.md |
| business_date ≠ invoice_date | ✅ Revenue_Operation_Model.md |
| invoice_stage/invoice_reason 为 M 来源 | ✅ |
| Status 不落库（纯计算） | ✅ Revenue_State_Design.md |

## 四、文件清单

| 文件 | 说明 |
|------|------|
| `backend/app/models/flow.py` | IncomeFlow 新增 5 经营字段 |
| `backend/app/schemas/flow.py` | Create/Update/Response 同步 |
| `FinanceDesk_Data/finance.db` | ALTER TABLE 迁移 |
| `Knowledge/Revenue_Business_Scenario.md` | **新增** — 3 场景业务走查 |

## 五、结论

**BDD-04B（Revenue CRUD）完成。** 等待审批后进入 BDD-05。
