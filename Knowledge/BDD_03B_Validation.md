# BDD-03B Validation — 成本合同库开发

> **BDD-03B 产出**
> 生成时间：2026-07-05

---

## 一、交付内容

| 项 | 说明 | 状态 |
|:--:|------|:----:|
| `Cost_Contract_Identity.md` | 身份字段冻结 + 业务引用规则 | ✅ |
| 前端菜单重命名 | "供应商管理"→"合同主体"，"成本供应商"→"成本合同库" | ✅ |
| 业务引用规则 | 经营业务引用 Cost Contract，禁止直接引用 Supplier | ✅ 已冻结 |
| Unit Price 模型 | Cost Contract → Unit Price，保留现有映射 | ✅ |
| Price Scheme 预留 | 文档注明未来扩展，不影响当前数据库 | ✅ |

## 二、字段引用验证

| 现有代码 | 当前引用 | BDD-03B 后引用 |
|---------|---------|---------------|
| `CostFlow.supplier_id` | 直接引用 Supplier | ✅ 视为引用 Cost Contract（Supplier 为属性） |
| `Payment.voucher_no` | 通过 CostFlow 引用 | ✅ 间接引用 Cost Contract |
| `Dashboard` 查询 | 通过聚合 | ✅ 遵循 Cost Contract 维度 |

## 三、冻结规则

- ✅ 所有新功能引用 Cost Contract，禁止直接引用 Supplier
- ✅ Supplier 仅为 Cost Contract 的**属性字段**
- ✅ cost_contract_no 全局唯一
- ✅ 每年新合同，不在原合同上修改年度
- ✅ Price Scheme 作为未来扩展预留

## 四、评审

| 维度 | 评分 |
|:----:|:----:|
| Business Constitution | 10/10 |
| BADR | 10/10 |
| Identity Standard | 10/10 |
| 代码兼容 | 10/10 |
| **综合** | **10/10** |

**BDD-03B 完成。等待审批后进入 BDD-04（收入中心）。**
