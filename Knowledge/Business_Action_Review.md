# Business Action Review — 映射引擎一致性评审

> **BDD-06.5 P4 输出 · 评审报告**
> 更新时间：2026-07-05
> **评审对象：4 份 Mapping Engine 文档的 Business Constitution、BADR、Mirror Architecture 等一致性。**

---

## 评审矩阵

| # | 评审项 | 评分 | 说明 |
|:-:|-------|:----:|------|
| 1 | **Business Constitution** | 10/10 | R003(ERP只读) ✅ Mapping Engine 不写 ERP Fact；R004(来源可追溯) ✅ 事件携带源记录 ID；R006(自动计算) ✅ Summary 通过事件驱动 |
| 2 | **BADR** | 10/10 | BADR-004(ERP定位) ✅ 数据管道入站角色；BADR-014(经营数据优先) ✅ 不直接计算经营指标 |
| 3 | **Mirror Architecture** | 10/10 | 收入链/成本链事件镜像一致 ✅ Create↔Create, Reverse↔Reverse, Rollback↔Rollback |
| 4 | **ERP Rules** | 10/10 | 引擎不修改 ERP Fact ✅，Mapping Engine 隔离层 ✅，事件驱动不绕过业务校验 ✅ |
| 5 | **Business Identity** | 10/10 | order_no 为 P1 匹配键 ✅，erp_record_id 为事件唯一标识 ✅，编码规范一致 ✅ |
| 6 | **Data Source Rules** | 10/10 | 全部字段标注来源 E/S ✅，不增加经营推导字段 ✅ |
| 7 | **Order Summary** | 10/10 | 事件触发 Summary recal ✅，不跳过 Summary ✅，Order Summary 单一口径 ✅ |
| 8 | **配置化设计** | 10/10 | 全部规则配置化 ✅，JSON field_mapping ✅，新增字段不需改代码 ✅ |
| 9 | **事件模型** | 10/10 | Create/Update/Reverse/Rollback 四类标准事件 ✅，幂等性保障 ✅ |
| 10 | **不可跳过 Preview** | 10/10 | Mapping Engine 置于 Workbench 之后 ✅，Import Engine 之前 ✅ |

| | **综合评分** | **10/10** | |

---

## 逐项评审详情

### 1. Business Constitution

| 条款 | 要求 | 符合 | 证据 |
|:----:|------|:----:|------|
| R003 | ERP 数据只读 | ✅ | Mapping Engine 不修改 ERP Fact |
| R004 | 来源可追溯 | ✅ | 事件携带 source_flow_id + batch_no |
| R006 | 自动计算不落库 | ✅ | Order Summary 未落库 |
| R001 | 订单为唯一结算单元 | ✅ | matched_order_id 为必填 |

### 2. BADR

| 决策 | 要求 | 符合 |
|:----:|------|:----:|
| BADR-004 | ERP 作为数据管道入站 | ✅ |
| BADR-014 | 经营数据优先于功能数量 | ✅ |
| BADR-010 | Mirror Architecture 镜像 | ✅ |

### 3. Mirror Architecture

| 收入链 | 成本链 | 映射 |
|:------:|:------:|:----:|
| IncomeFlow.create | CostFlow.create | ✅ |
| Collection.create | Payment.create | ✅ |
| Reverse(Income) | Reverse(Cost) | ✅ |
| Rollback(Income) | Rollback(Cost) | ✅ |
| Revenue Summary | Cost Summary | ✅ |

### 4. Business Identity

| 标准 | 符合 | 说明 |
|:----:|:----:|------|
| order_no 为匹配键 | ✅ | matched_order_id 为事件必填字段 |
| erp_record_id 为业务键 | ✅ | 各业务表唯一约束来源 |
| 编码不可修改 | ✅ | 事件不修改源编码 |

---

## 未通过项

**无。全部 10 项评分 10/10。**

---

## 编码前置条件检查

| # | 条件 | 状态 | 说明 |
|:-:|:----:|:----:|------|
| 1 | Mapping Engine 文档已冻结 | ✅ | 4 份文档全部完成 |
| 2 | 规则配置化设计 | ✅ | JSON field_mapping + 规则表 |
| 3 | Mirror Architecture 镜像 | ✅ | 收入链/成本链事件一致 |
| 4 | Business Constitution 对齐 | ✅ | 10/10 |
| 5 | BDD-06D 匹配规则引用 | ✅ | matched_order_id 为事件输入 |
| 6 | BDD-06F Import Engine 引用 | ✅ | 事件为 Engine 输入 |
| 7 | 5 BAT 案例覆盖 | ✅ | 案例①~⑤均覆盖 Create/Reverse |

---

## 结论

**全部通过。Mapping Engine 冻结完成。满足 BDD-06F Import Engine 编码前置条件。**
