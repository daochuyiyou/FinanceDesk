# RC-010 UI Encoding Audit

> **日期**: 2026-07-12 | **类型**: P0
> **范围**: 全站 73 个前端源文件扫描 + 浏览器逐页验证

---

## 扫描方法

对 `frontend/src/` 下全部 `.tsx`/`.ts`/`.json`/`.js` 文件进行 **逐字节 `\uXXXX` 模式扫描**，定位所有 Unicode 转义序列。

## 扫描结果

| 指标 | 值 |
|:-----|:---:|
| 扫描文件数 | 73 |
| 含 `\uXXXX` 文件 | 6 |
| 总 `\uXXXX` 出现次数 | **682** |

### 含转义的文件

| 文件 | 出现次数 | 用途 |
|:-----|:--------:|:-----|
| `components/ContractDrawer.tsx` | 85 | JSX 文案：订单编号、订单名称等 |
| `components/ImportModal.tsx` | 147 | 弹窗标题、模板文件名 |
| `pages/ContractBusinessWorkbench.tsx` | 123 | KPI 标签、Message、格式化函数 |
| `pages/ReportPage.tsx` | 32 | ECharts 配置、文件名 |
| `pages/SupplierContractDrawer.tsx` | 56 | 表格列标题 |
| `pages/SupplierPage.tsx` | 239 | 表格列标题、操作按钮文案、Message |

## 风险评估

| 检查项 | 结果 |
|:-------|:-----|
| JS 字符串中的 `\uXXXX` | ✅ **安全** — JavaScript 引擎自动解码 |
| 正则表达式中的 `\uXXXX` | ✅ **安全** — JS 正则引擎同样解码 |
| JSX 属性中的 `\uXXXX` | ✅ **安全** — JSX 编译时解码 |
| API 响应中包含的 `\uXXXX` | ✅ **不存在** — 后端返回直接 UTF-8 |
| JSON 配置文件中包含 `\uXXXX` | ✅ **不存在** — 全部使用直接中文 |
| 二次转义风险 | ✅ **不存在** — 无 `JSON.stringify` + `\uXXXX` 组合 |

## 浏览器逐页验证

| 页面 | 中文显示 | 异常 |
|:-----|:--------:|:----:|
| Dashboard | ✅ 全部中文 | 无 |
| 合同管理 | ✅ | 无 |
| 订单管理 | ✅ | 无 |
| 收入管理 | ✅ | 无 |
| 成本执行 | ✅ | 无 |
| 收款管理 | ✅ | 无 |
| 付款管理 | ✅ | 无 |
| 预算管理 | ✅ | 无 |
| 数据字典 | ✅ | 无 |
| 成本合同库 | ✅ | 无 |

## 结论

**未发现编码显示异常。** 全站所有中文文案正确显示，无 `\uXXXX` 转义码被直接显示的情况。

682 处 `\uXXXX` 全部在 JavaScript 字符串/正则/JSX 表达式中，运行时自动解码为中文。**非 P0 问题，不阻碍上线。**

### 维护建议

（非阻断，归入后续版本）

6 个文件使用 `\uXXXX` 编码中文（总计 682 处），虽不影响显示，但降低代码可维护性。建议后续统一替换为直接 UTF-8 中文：
- `SupplierPage.tsx`（239 处）
- `ImportModal.tsx`（147 处）
- `ContractBusinessWorkbench.tsx`（123 处）
- `ContractDrawer.tsx`（85 处）
- `SupplierContractDrawer.tsx`（56 处）
- `ReportPage.tsx`（32 处）
