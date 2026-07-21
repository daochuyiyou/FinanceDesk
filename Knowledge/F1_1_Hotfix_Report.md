# F1.1 Hotfix Report — 合同新增完善

> **BDD-01 F1.1 产出**
> 生成时间：2026-07-05
> 范围：H1 统一命名 / H2 contract_no 标准化 / H3 预留编号接口

---

## H1：统一命名

| 变更 | 文件 | 说明 |
|------|------|------|
| 重命名 | `ProjectModal.tsx` → `ContractCreateDialog.tsx` | 组件 + 文件名统一使用"合同" |
| 更新引用 | `ProjectList.tsx` | `import ProjectModal` → `import ContractCreateDialog` |
| 内部组件名 | `ContractCreateDialog.tsx` | `const ProjectModal` → `const ContractCreateDialog` |

**影响范围**：2 个文件，无新增 TypeScript 错误。

---

## H2：contract_no 标准化校验

| 规则 | 处理 | 示例 |
|------|------|------|
| trim() | 去除前后空格 | `"  CT-001  "` → `"CT-001"` |
| upper() | 统一大写 | `"ct-001"` → `"CT-001"` |
| 重复校验 | 按标准化后的值 | `"gx-001"` / `"GX-001"` / `"  GX-001"` → 全部视为相同 |

### API 验证结果

| 场景 | 输入 | 结果 |
|------|------|:----:|
| 标准化写入 | `"  ct-abc  "` → `"CT-ABC"` | ✅ 201 |
| 重复检测 | `"CT-ABC"`（已存在） | ✅ 409 "已存在" |

### 受影响的代码

| 位置 | 变更 |
|------|------|
| `backend/app/routers/project.py` — create_project | 保存前执行 raw_no.strip().upper() |
| `frontend/src/pages/ContractCreateDialog.tsx` — handleOk | 提交前执行 trim().toUpperCase() |

---

## H3：generate_next_contract_no 预留接口

| 属性 | 值 |
|:----:|------|
| 端点 | `GET /api/v1/projects/next-contract-no` |
| 当前返回 | `{"next_contract_no": null}` |
| 后续 | 启用后返回自动生成的合同编号 |
| 当前 | 禁止自动编号，仅留接口 |

### API 验证结果

```
GET /api/v1/projects/next-contract-no → {"next_contract_no": null} ✅
```

---

## 验证清单

| 检查项 | 结果 |
|--------|:----:|
| Build（Python） | ✅ 模块加载正常 |
| Build（TypeScript） | ✅ 零新增错误 |
| Backend Tests | ✅ H2 标准化 + 重复 409 |
| Frontend Tests | ✅ 引用已更新 |
| Regression | ✅ 旧 API 向后兼容 |
| Contract Number Validation | ✅ trim+upper → 409 duplicate |

---

## 结论

> **F1.1 三个热修复全部完成，验证通过。**

等待审批后进入 **F2（合同列表）** 开发。
