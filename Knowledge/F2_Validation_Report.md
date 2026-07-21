# F2 Validation Report — 合同台账列表

> **BDD-01 F2 产出**
> 生成时间：2026-07-05

---

## 一、改造内容

| 变更 | 说明 |
|------|------|
| **列表字段** | 10 列：合同编号 / 名称 / 类型 / 业主 / 年度 / 合同金额 / 预算金额 / 订单数量 / 状态 / 创建时间 |
| **后端** | `GET /api/v1/projects` 增加 `order_count` 响应字段，含 SQL 聚合查询 |
| **Schema** | `ProjectResponse` 新增 `order_count: int = 0` |
| **前端** | ProjectList.tsx 重写为 ContractRegister 组件，移除混合项目/订单列表模式 |
| **操作按钮** | 详情 / 编辑 / 订单（跳转） |

## 二、禁止展示确认

| 指标 | 列表中 | Dashboard |
|:----:|:------:|:---------:|
| 收入 | ❌ 不展示 | ✅ 由 Dashboard 展示 |
| 成本 | ❌ 不展示 | ✅ 由 Dashboard 展示 |
| 回款 | ❌ 不展示 | ✅ 由 Dashboard 展示 |
| 付款 | ❌ 不展示 | ✅ 由 Dashboard 展示 |
| 利润 | ❌ 不展示 | ✅ 由 Dashboard 展示 |
| ERP Gap | ❌ 不展示 | ✅ 由 Dashboard 展示 |

## 三、验证清单

| 检查项 | 结果 | 说明 |
|--------|:----:|------|
| Build (Python) | ✅ | model / schema / router 无错 |
| Build (TypeScript) | ✅ | 仅剩 1 个预存类型不匹配（ProResizableTable） |
| Backend Tests | ✅ | order_count 正确返回 |
| Regression | ✅ | 旧接口兼容 |
| UI Review | ✅ | 10 列合同台账，无经营指标 |
| Business Rule Review | ✅ | 符合 BADR-003（订单为结算单元） |

## 四、结论

> **F2（合同台账列表）开发完成。列表仅展示合同层数据，经营指标全部留给订单中心和 Dashboard。**

等待审批后进入 **BDD-02 订单中心** 开发。
