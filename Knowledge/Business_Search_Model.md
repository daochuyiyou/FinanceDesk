# Business Search Model — 统一业务查询模型

> **BDD-02B F5 P1 输出 · 永久冻结**
> 更新时间：2026-07-05
> 本模型定义 FinanceDesk 统一业务查询标准，可供合同中心/订单中心/收入/成本/ERP/Dashboard 共同复用。
> 禁止各模块自行实现不同查询逻辑。

---

## 一、设计原则

| 原则 | 说明 |
|------|------|
| **统一** | 全系统只有一个 Search API，所有模块共用 |
| **维度化** | 查询条件按业务维度分组（合同/订单/经营/ERP） |
| **可组合** | 多维度条件可自由组合 AND 查询 |
| **冻结先行** | 字段定义先行冻结，实现分阶段进行 |
| **禁用** | 禁止各模块自行实现互不兼容的查询接口 |

---

## 二、查询维度定义

### 2.1 合同维度

| 字段 | 类型 | 说明 | 实现状态 |
|:----:|:----:|------|:--------:|
| `contract_no` | String | 合同编号精确匹配 | ✅ 现有 |
| `contract_name` | String | 合同名称模糊匹配 | ✅ 现有 |
| `owner_name` | String | 业主单位模糊匹配 | ✅ 现有 |
| `contract_type` | String | 合同类型精确匹配（框架/单项） | ✅ 现有 |
| `contract_year` | Integer | 所属年度精确匹配 | ✅ 现有 |
| `status` | String | 合同状态精确匹配 | ✅ 现有 |
| `contract_amount_min` | Numeric | 合同金额下限 | 🟡 待实现 |
| `contract_amount_max` | Numeric | 合同金额上限 | 🟡 待实现 |

### 2.2 订单维度

| 字段 | 类型 | 说明 | 实现状态 |
|:----:|:----:|------|:--------:|
| `order_no` | String | 订单编号精确匹配 | ✅ 现有 |
| `order_name` | String | 订单名称模糊匹配 | ✅ 现有 |
| `owner_project_name` | String | 甲方项目名称模糊匹配 | ✅ 现有 |
| `owner_project_no` | String | 甲方项目编号精确匹配 | ✅ 现有 |
| `order_source` | String | 订单来源精确匹配（框架/单项） | ✅ 现有 |
| `order_amount_min` | Numeric | 订单金额下限 | 🟡 待实现 |
| `order_amount_max` | Numeric | 订单金额上限 | 🟡 待实现 |

### 2.3 经营维度（已冻结，暂不实现）

| 字段 | 类型 | 说明 | 推导方式 |
|:----:|:----:|------|---------|
| `order_health` | String | 订单健康度 | 自动推导（正常/风险/异常） |
| `settlement_status` | String | 经营结算状态 | 自动推导（5 种状态） |
| `has_income` | Boolean | 是否有收入流水 | IncomeFlow 是否存在 |
| `has_cost` | Boolean | 是否有成本流水 | CostFlow 是否存在 |
| `has_collection` | Boolean | 是否有回款 | Collection 是否存在 |
| `has_payment` | Boolean | 是否有付款 | Payment 是否存在 |

### 2.4 ERP 维度

| 字段 | 类型 | 说明 | 实现状态 |
|:----:|:----:|------|:--------:|
| `erp_matched` | Boolean | 是否已与 ERP 匹配 | ⏳ BDD-06 |
| `gap_status` | String | 差异状态（无差异/有差异/未核对） | ⏳ BDD-06 |

---

## 三、统一 Search API 定义

```python
# 统一查询请求体
class BusinessSearchRequest:
    # 合同维度
    contract_no: Optional[str] = None
    contract_name: Optional[str] = None
    owner_name: Optional[str] = None
    contract_type: Optional[str] = None  # "框架合同" / "单项合同"
    contract_year: Optional[int] = None
    contract_status: Optional[str] = None

    # 订单维度
    order_no: Optional[str] = None
    order_name: Optional[str] = None
    owner_project_name: Optional[str] = None
    owner_project_no: Optional[str] = None
    order_source: Optional[str] = None  # "框架合同" / "单项合同"

    # 经营维度（冻结，暂不实现）
    order_health: Optional[str] = None
    settlement_status: Optional[str] = None
    has_income: Optional[bool] = None
    has_cost: Optional[bool] = None
    has_collection: Optional[bool] = None
    has_payment: Optional[bool] = None

    # ERP 维度（冻结）
    erp_matched: Optional[bool] = None
    gap_status: Optional[str] = None

    # 分页
    page: int = 1
    page_size: int = 20


# 统一响应
class BusinessSearchResponse:
    items: list[dict]  # 混合合同+订单结果
    total: int
    page: int
    page_size: int
```

---

## 四、查询规则

| 规则 | 说明 |
|------|------|
| 多维度 AND | 同时传入多个维度条件时，取交集 |
| 模糊匹配 | 名称类字段使用 LIKE / CONTAINS |
| 精确匹配 | 编号/类型/状态/年度使用精确匹配 |
| 金额范围 | 提供 min/max 范围查询 |
| 分页 | 统一 page / page_size |

---

## 五、冻结

### 5.1 已实现

- 合同维度 6 字段 ✅（现有 `GET /api/v1/projects` 可扩展查询参数）
- 订单维度 5 字段 ✅（现有 `GET /api/v1/orders` 可扩展查询参数）

### 5.2 已冻结（暂不实现）

- 经营维度 6 字段（依赖 Order Health + Settlement Status 自动推导引擎）
- ERP 维度 2 字段（依赖 BDD-06 ERP 集成）

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制，4 维度 19 字段 |
