# Order Model Review — 订单模型评审

> **BDD-02A P4 输出 · 评审报告**
> 生成时间：2026-07-05
> 评审对象：`Order_Entry_Model.md` · `Order_Detail_Model.md` · `Order_Timeline.md`

---

## 一、Business Constitution 合规检查

| 红线 | 是否合规 | 说明 |
|:----:|:--------:|------|
| R001 订单唯一结算单元 | ✅ | 全部经营数据最终归属订单 |
| R002 仅两种合同类型 | ✅ | 框架/单项合同各有不同的订单规则 |
| R003 ERP 数据只读 | ✅ | erp_no 字段只读 |
| R004 来源可追溯 | ✅ | 每个字段标注 M/E/S/A |
| R005 Dashboard 只读 | ✅ | 经营摘要仅展示，不提供录入 |
| R006 自动计算 | ✅ | 利润/回款率/成本率/Gap 全部自动 |
| R007 Excel 统一 | ✅ | 订单导入模板准备就绪 |

**结论：零违反。**

---

## 二、BADR 合规检查

| BADR | 是否合规 | 说明 |
|:----:|:--------:|------|
| 001 产品定位 | ✅ | 订单中心属于经营分析范畴 |
| 002 合同模型 | ✅ | 框架合同 N 订单，单项合同 1 订单 |
| **003 订单模型** | ✅ | **订单是唯一经营结算单元** |
| 004 ERP 定位 | ✅ | ERP 导入归入时间线 |
| 009 单次录入 | ✅ | order_no 全局唯一 |
| 010 自动推导 | ✅ | 全部经营指标自动计算 |

**结论：零违反。**

---

## 三、UI Freeze 合规检查

| UI 原则 | 是否合规 | 说明 |
|---------|:--------:|------|
| 订单中心维护订单 | ✅ | 新增页仅维护订单数据 |
| 禁止维护合同 | ✅ | 无合同字段编辑 |
| 禁止维护流水 | ✅ | 流水通过 Tab 跳转 |
| 禁止维护收付款 | ✅ | 收付款通过 Tab 跳转 |
| Dashboard 只读 | ✅ | 经营摘要纯展示 |

**结论：零违反。**

---

## 四、Data Model 一致性检查

| Order_Entry_Model 字段 | Business_Data_Model Order | 一致 |
|------------------------|--------------------------|:----:|
| order_no | order_no String(100) UK | ✅ |
| order_name | order_name String(200) | ✅ |
| project_id | project_id FK | ✅ |
| supplier_id | supplier_id FK | ✅ |
| amount | amount Numeric(15,2) | ✅ |
| non_tax_amount | non_tax_amount Numeric(15,2) | ✅ |
| order_date | order_date Date | ✅ |
| order_type | order_type String(50) | ✅ |
| status | status String(50) | ✅ |
| customer_name | customer_name String(200) | ✅ |
| erp_no | erp_no String(100) | ✅ |

**结论：全部一致。**

### 补充字段验证（BDD-02A.1 新增）

| 新字段 | Business_Data_Model | Order_Entry_Model | 一致 |
|--------|:------------------:|:-----------------:|:----:|
| order_source | ✅ 新增 | ✅ layout + 字段定义 | ✅ |
| owner_project_name | ✅ 新增 | ✅ layout + 字段定义 | ✅ |
| owner_project_no | ✅ 新增 | ✅ 字段定义 | ✅ |

**结论：3 个补充字段已在 Business_Data_Model 和 Order_Entry_Model 中同步，保持一致。**

---

## 五、合同中心一致性检查

| 检查项 | 合同中心 | 订单中心 | 一致 |
|--------|---------|---------|:----:|
| 合同类型定义 | framework/单项 | 框架→N, 单项→1 | ✅ |
| 合同编号 | contract_no | project_id 引用 | ✅ |
| 业主信息 | owner_name | customer_name 冗余 | ✅ |
| 合同金额 | contract_amount | Order.amount 细粒度 | ✅ |

**结论：合同中心与订单中心字段逻辑一致。`customer_name` 为冗余字段（订单独立记录甲方单位）。**

---

## 六、综合评分

| # | 评审项 | 评分 |
|:-:|-------|:----:|
| 1 | Business Constitution | 10/10 |
| 2 | BADR | 10/10 |
| 3 | UI Freeze | 10/10 |
| 4 | Data Model | 10/10 |
| 5 | Contract Center | 10/10 |
| | **综合评分** | **10/10** |

---

## 七、结论

> **订单业务模型通过全部 5 项评审，综合评分 10/10。**
>
> 推荐进入 BDD-02B（订单新增）代码开发。

### 产出文档

| 文档 | 大小 |
|------|:----:|
| `Order_Entry_Model.md` | ~7.4 KB |
| `Order_Detail_Model.md` | ~5.9 KB |
| `Order_Timeline.md` | ~4.4 KB |
| **合计** | **~18 KB** |
