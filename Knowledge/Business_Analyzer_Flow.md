# Business Analyzer Flow — 经营分析器工作流

> **PDD-02 P4 输出 · 永久文档（Product SSoT）**
> 更新时间：2026-07-06
> **用户通过 Business Analyzer 完成经营分析的全流程。**

---

## 一、完整分析流程

```mermaid
graph TD
    Enter["进入任一业务页面"] --> Init["Analyzer 自动初始化"]
    
    Init -->|URL params 优先| RestoreURL["从 URL 恢复状态"]
    Init -->|localStorage 其次| RestoreLocal["从 localStorage 恢复"]
    Init -->|默认值兜底| Default["最近导入月 + 公司维度"]
    
    RestoreURL --> Ready
    RestoreLocal --> Ready
    Default --> Ready
    
    Ready["Analyzer Ready"] --> SelectPeriod["① 选择经营期间"]
    
    SelectPeriod -->|月度下拉| SelectDimension["② 选择分析维度"]
    SelectDimension -->|公司/合同/项目/订单| SelectObject["③ 选择经营对象"]
    
    SelectObject -->|动态加载列表| ApplyFilter["④ 高级过滤（可选）"]
    ApplyFilter -->|默认折叠| Refresh["⑤ 自动刷新数据"]
    
    Refresh --> KPIs["KPI 更新"]
    Refresh --> Trend["趋势更新"]
    Refresh --> Alerts["预警更新"]
    Refresh --> Actions["事项更新"]
    Refresh --> Detail["明细更新"]
    
    KPIs -->|继续分析| SelectPeriod
    KPIs -->|切换页面| SwitchPage["切换页面"]
    SwitchPage -->|状态保持| Ready
    
    Detail -->|点击行| DrillDown["下钻详情"]
    DrillDown -->|返回| Ready
```

---

## 二、用户工作流程

### 路径 A：月度经营检查（3 分钟）

```
进入 Dashboard
  → Analyzer 默认显示最近月份 + 公司维度
  → 查看 KPI 和趋势
  → 检查 Alerts
  → 完成
```

### 路径 B：合同级分析（5 分钟）

```
进入 Dashboard
  → 切换维度到「合同」
  → 选择具体合同
  → 查看该合同 KPI
  → 进入明细列表
  → 完成
```

### 路径 C：跨页面分析（10 分钟）

```
Dashboard（公司维度）→ 查看经营总览
  → 切换维度到「项目」
  → 选择项目 A
  → 点击明细 → 跳转合同中心
  → Analyzer 保持「项目 A」
  → 合同列表按项目 A 筛选
  → 跳转订单中心 → Analyzer 继续保持
  → 返回 Dashboard → 状态不变
```

---

## 三、数据刷新规则

| 变化 | 刷新范围 | API 调用 |
|:-----|:---------|:---------|
| 期间 | 全部 | `GET /dashboard/analytics?period=...` |
| 维度 | 全部 | 同上 |
| 对象 | Detail 区域 | `GET /dashboard/detail?object_id=...` |
| 过滤 | 当前视图 | `GET /dashboard/analytics?filters=...` |

---

## 四、异常处理

| 场景 | 行为 |
|:-----|:------|
| URL 参数无效 | 忽略 URL，使用 localStorage |
| localStorage 损坏 | 使用默认值 |
| 经营期间无数据 | 显示空状态「该期间暂无数据」 |
| API 错误 | 保留当前 Analyzer 状态，显示错误提示 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
