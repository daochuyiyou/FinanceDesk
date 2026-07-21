# Page Flow — 用户工作流

> **PDD-00 P6 输出 · 永久文档（Product SSoT）**
> 更新时间：2026-07-06
> **用户一天工作的完整流程。**

---

## 一、完整工作流

```mermaid
graph TD
    Login["登录"] --> Dashboard["Dashboard（经营驾驶舱）"]
    
    %% 日常监控
    Dashboard -->|查看经营数据| DailyReview["日经营检查"]
    DailyReview -->|收入异常| RevenueDetail["收入明细"]
    DailyReview -->|成本异常| CostDetail["成本明细"]
    DailyReview -->|Gap过大| GapAnalysis["Gap分析"]
    
    %% 合同管理
    Dashboard -->|合同到期| ContractReview["合同审查"]
    ContractReview -->|查看| ContractList["合同列表"]
    ContractList -->|详情| ContractDetail["合同详情"]
    ContractDetail -->|订单| OrderList["订单列表"]
    
    %% 订单管理
    OrderList -->|详情| OrderDetail["订单详情"]
    OrderDetail -->|收入| RevenueList["收入流水"]
    OrderDetail -->|成本| CostList["成本流水"]
    RevenueList -->|收款| CollectionMgmt["收款管理"]
    CostList -->|付款| PaymentMgmt["付款管理"]
    
    %% ERP 导入
    Dashboard -->|导入数据| ERPImport["ERP Import Workbench"]
    ERPImport -->|上传| Parse["解析"]
    Parse -->|匹配| Match["匹配预览"]
    Match -->|预览| Impact["影响预览"]
    Impact -->|确认| Confirm["确认导入"]
    Confirm -->|结果| ImportResult["导入结果"]
    ImportResult -->|回滚| Rollback["回滚"]
    ImportResult -->|查看| BatchHistory["历史批次"]
    
    %% AI
    Dashboard -->|AI分析| AIAnalysis["AI分析"]
    AIAnalysis -->|查看| AIReport["AI报告"]
    
    %% 退出
    ImportResult -->|完成| Dashboard
    AIReport -->|完成| Dashboard
    GapAnalysis -->|完成| Dashboard
    
    Dashboard -->|退出| Logout["退出登录"]
```

---

## 二、典型用户日流程

### 项目经理的一天

```
08:30  登录 → Dashboard
          ↓
08:35  查看经营总览（收入/成本/利润/Gap）
          ↓
08:40  Gap 过大 → 进入 GAP 分析
          ↓
08:50  合同到期审查 → 合同列表
          ↓
09:30  导入新 ERP 数据 → Import Workbench
          ↓
09:45  匹配确认 → 导入完成
          ↓
10:00  Dashboard 验证数据更新
          ↓
10:30  登出
```

### 财务人员的一天

```
09:00  登录 → Dashboard
          ↓
09:05  查看收入明细 → 检查开票
          ↓
09:30  收款核对 → 收款管理
          ↓
10:00  成本对账 → 成本明细
          ↓
10:30  付款审批 → 付款管理
          ↓
11:00  导入银行流水 → Import Workbench
          ↓
11:30  Dashboard 对账验证
```

---

## 三、页面跳转规则

| 跳转 | 方式 | 参数传递 |
|:-----|:-----|:---------|
| Dashboard → 明细页 | 点击卡片 | 日期范围/类型 |
| 列表 → 详情 | 点击行 | `record_id` |
| 详情 → 关联列表 | Tab 切换 | `order_id` |
| 详情 → 返回列表 | 返回按钮 | 保留搜索条件 |
| Workbench → 结果 | 步骤完成 | `batch_no` |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
