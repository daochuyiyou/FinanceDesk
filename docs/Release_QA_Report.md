# Release_QA_Report.md

**日期：** 2026-07-21
**模式：** Release QA — 不新增功能，仅验证
**放行条件：** 全部通过后允许 Git Commit + Push

---

## 环境

| 维度 | 值 |
|------|-----|
| 后端 | clean copy (无 __pycache__) → `uvicorn main:app` port 8005 |
| 前端 | Vite dev server port 5173 → proxy 8005 |
| 数据库 | `FinanceDesk_Data/finance.db` (1030 projects, 23 orders) |
| 浏览器 | Chrome (headless via Hermes browser tools) |

---

## 页面验证清单

| # | 页面 | 加载 | Console | Network | 检查项 | 结果 |
|:-:|------|:----:|:-------:|:-------:|--------|:----:|
| 1 | **经营看板** | ✅ | 0E/0W | ✅ 200 | KPI 卡片、维度切换、期间选择、搜索框 | ✅ |
| 2 | **项目合同** | ✅ | 0E/0W | ✅ 200 | 合同列表(18列)、KPI 统计、分页、详情 Drawer、新增/导入/模板/导出 | ✅ |
| 3 | **订单管理** | ✅ | 0E/0W | ✅ 200 | 订单列表(15列)、KPI、编辑/详情/删除、搜索 | ✅ |
| 4 | **收入管理** | ✅ | 0E/0W | ✅ 200 | 页面加载正常 | ✅ |
| 5 | **成本执行** | ✅ | 0E/0W | ✅ 200 | 供应商列显示、Modal 供应商必选(``* 供应商``)、编辑/删除 | ✅ |
| 6 | **回款管理** | ✅ | 0E/0W | ✅ 200 | 页面加载正常 | ✅ |
| 7 | **付款管理** | ✅ | 0E/0W | ✅ 200 | 选择成本流水自动显示供应商(只读)、payee 输入框已移除 | ✅ |
| 8 | **预算管理** | ✅ | 0E/0W | ✅ 200 | 项目选择器 | ✅ |
| 9a | 数据中心 ▶ **ERP数据导入** | ✅ | 0E/0W | ✅ 200 | 7步导入工作台 | ✅ |
| 9b | 数据中心 ▶ **快速导入** | ✅ | 0E/0W | ✅ 200 | 7实体选项卡上传 | ✅ |
| 9c | 数据中心 ▶ **ERP对账** | ✅ | 0E/0W | ✅ 200 | Excel解析+待归集池+项目对账 | ✅ |
| 10a | 成本合同库 ▶ **合同主体** | ✅ | 0E/0W | ✅ 200 | 供应商列表 | ✅ |
| 10b | 成本合同库 ▶ **成本合同** | ✅ | 0E/0W | ✅ 200 | 供应商合同列表 | ✅ |
| 10c | 成本合同库 ▶ **单价管理** | ✅ | 0E/0W | ✅ 200 | 单价管理 | ✅ |
| 11a | 基础资料 ▶ **数据字典** | ✅ | 0E/0W | ✅ 200 | 11分类+条目管理 | ✅ |
| 11b | 基础资料 ▶ **操作日志** | ✅ | 0E/0W | ✅ 200 | 审计日志列表+模块/类型筛选 | ✅ |

---

## BA-015 业务闭环验证

```
步骤 1: 创建成本流水 (supplier_id=1)
  → CostFlow.supplier_id=1, supplier_name='手机验证登录'  ✅

步骤 2: 验证成本流水列表返回 supplier_name
  → supplier_name='手机验证登录'  ✅

步骤 3: 创建付款（不传 payee）
  → Payment.payee 自动填充为 '手机验证登录'  ✅

步骤 4: 供应商一致性
  → CostFlow → Supplier → Payment 全链一致  ✅
```

---

## Console 统计

```
总 Error:  0
总 Warning: 0
全程 16 页面遍历，零错误零警告
```

## Network 统计

```
所有 API 请求返回 200 OK
已验证端点：
  /api/v1/dashboard/summary              → 200
  /api/v1/projects                       → 200
  /api/v1/batch-order-summary            → 200
  /api/v1/cost-flows                     → 200 (含 supplier_name)
  /api/v1/payment/{oid}/costs/{fid}      → 200 (payee 自动填充)
  /api/v1/supplier-contracts             → 200
  /api/v1/dict-categories                → 200
  /api/v1/audit-logs                     → 200
  /api/v1/erp/flows                      → 200
  /api/v1/erp/gap                        → 200
```

---

## 最终裁决

```
Release QA：✅ 全部通过
========================

  16/16 页面正常加载        ✅
  Console 0 Error/0 Warning  ✅
  Network 全部 200           ✅
  BA-015 业务闭环通过        ✅
  菜单架构 (UX-005) 正确     ✅

  允许进行 Git Commit 和 Push。
```

---

## 环境清理

测试完成后需恢复：
```bash
# 恢复 Vite 代理到 8000（生产后端）
cd ~/workspace/source/frontend
# vite.config.ts proxy target 已恢复为 localhost:8000

# 停止测试后端
kill $(lsof -ti:8005) 2>/dev/null
rm -rf /tmp/release-qa-backend
```
