# Cost Contract Library Model — 成本合同库模型

> **BDD-03A 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> 系统统一使用"成本合同库（Cost Contract Library）"，不再使用"Supplier Management"。
> Supplier 仅作为合同主体字段。

---

## 一、定位

成本合同库（Cost Contract Library）是 FinanceDesk 的**基础资料（Master Data）**。

不是供应商管理系统。

不是 CRM。

**真正管理的对象是：成本合同、年度、单价。**

---

## 二、业务对象定义

### 2.1 成本合同（Cost Contract）

| 字段 | 类型 | 必填 | 唯一 | 来源 | 说明 |
|------|:----:|:----:|:----:|:----:|------|
| id | Integer | ✅ | PK | S | 主键 |
| contract_no | String(100) | ✅ | ✅ | M | **合同编号**，新增必填 |
| supplier_name | String(200) | ✅ | — | M | **供应商主体名称**（非管理对象，仅作为合同属性字段） |
| framework | String(200) | ❌ | — | M | 所属框架 |
| year | Integer | ✅ | — | M | **所属年度** |
| sign_date | Date | ❌ | — | M | 签订日期 |
| start_date | Date | ❌ | — | M | 有效期开始 |
| end_date | Date | ❌ | — | M | 有效期结束 |
| amount | Numeric(15,2) | ❌ | — | M | 合同金额 |
| status | String(50) | ❌ | — | M | 合同状态：有效/作废/到期 |
| remark | Text | ❌ | — | M | 备注 |

**生命周期**：年度签订 → 有效期内 → 到期/作废

**每年新签**：年度变化必须创建新合同记录，不得在原合同上修改年度。

### 2.2 单价（Unit Price）

| 字段 | 类型 | 必填 | 唯一 | 来源 | 说明 |
|------|:----:|:----:|:----:|:----:|------|
| id | Integer | ✅ | PK | S | 主键 |
| contract_id | Integer | ✅ | — | A | 🔗 关联成本合同 |
| year | Integer | ❌ | — | M/S | 年度（可继承合同年度） |
| laborer_price | Numeric(10,2) | ❌ | — | M | **普工单价** |
| technician_price | Numeric(10,2) | ❌ | — | M | **技工单价** |
| senior_technician_price | Numeric(10,2) | ❌ | — | M | **高级技工单价** |
| special_work_type | String(100) | ❌ | — | M | 特种作业工种 |
| special_work_price | Numeric(10,2) | ❌ | — | M | **特种作业单价** |
| comprehensive_price | Numeric(10,2) | ❌ | — | M | **综合单价** |
| version | Integer | ❌ | — | S | 版本号（下次年度扩展用） |

**设计要点**：
- 单价独立为 Price Table，不嵌入合同表
- 支持后续年度扩展（`version` 字段预留）
- 单价属于合同，不属于供应商主体

---

## 三、当前代码映射

| 当前表 | 新模型 | 处理方式 |
|--------|:------:|---------|
| `supplier` | **成本合同主表** | 重命名或迁移 |
| `supplier_contract` | 合并入成本合同 | 字段并入 |
| `supplier_price` | 旧单价（兼容） | 保持不动 |
| `supplier_year_price` | 合并入新 Price Table | 迁移 |
| `supplier_unit_price` | **新 Price Table** | 保留为主表 |

### 映射关系

```
当前：supplier + supplier_contract + supplier_unit_price
                          ↓
未来：cost_contract + unit_price（两张表）
```

---

## 四、冻结规则

| 规则 | 说明 |
|------|------|
| 一条记录 = **一份年度成本合同** | 不是供应商主体 |
| 供应商名称仅为**合同属性字段** | 不作为独立管理对象 |
| 所有单价属于**合同** | 不属于供应商主体 |
| 年度变化→**新合同记录** | 不在原合同上修改年度 |
| 单价独立为**Price Table** | 不嵌入合同表 |
| 后续年度扩展→**version 字段** | 不开新表 |

---

## 五、变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
