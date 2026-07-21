# Architecture Dependency Freeze Report — 架构依赖冻结报告

> **AHF-01.5 输出 · 冻结报告**
> 更新时间：2026-07-06
> **定义 FinanceDesk 各层之间唯一允许的调用关系。未经审批不得绕过。**

---

## 冻结范围

| 文档 | 角色 | 状态 |
|:----:|:----:|:----:|
| `AHF-01.5_Architecture_Dependency.md` | 系统分层 + 调用依赖定义 | ✅ 已冻结 |
| `AHF-01.5_Layer_Call_Matrix.md` | 12 层完整调用许可矩阵 | ✅ 已冻结 |
| `AHF-01.5_Dependency_Review.md` | 一致性评审（10/10） | ✅ 已冻结 |

---

## 核心冻结声明

| 冻结项 | 内容 |
|:-------|:------|
| **分层** | Router(L7) → Service(L6) → Engine(L5) → Repository(L4) → ORM(L3) → DB(L1) |
| **调用方向** | 单向向下，禁止反向、禁止跳跃 |
| **Repository** | 唯一 ORM 访问层 |
| **Forbidden 清单** | 15 条禁止路径 |
| **例外** | Engine 内联 Router（待重构）、SysDictionary 只读、Health Check、单元测试 |

---

## 调用矩阵摘要

```
           Rtr  Svc  Eng  Rep  ORM  Dsh  AI  Plg  Evt  Sum  Map  Rul
Router      —   ✅   ✅   ❌   ❌   ❌   ❌   ❌   ❌   ❌   ❌   ❌
Service     ❌   —   ✅   ✅   ❌   ❌   ❌   ❌   ⚠️   ✅   ❌   ❌
Engine      ❌   ❌   —   ✅   ❌   ❌   ❌   ❌   ✅   ✅   ✅   ✅
Repository  ❌   ❌   ❌   —   ✅   ❌   ❌   ❌   ❌   ❌   ❌   ❌
```

---

## 评审结果

| 评审项 | 评分 |
|:------:|:----:|
| Business Constitution | **10/10** |
| BADR | **10/10** |
| Repository Standard | **10/10** |
| ERP Engine | **10/10** |
| Dashboard | **10/10** |
| Mirror Architecture | **10/10** |
| Architecture Roadmap | **10/10** |
| **综合评分** | **10/10** |

---

## 更新文件清单

| 文件 | 操作 | 说明 |
|:-----|:-----|:------|
| `Architecture_Roadmap.md` | 更新 | 新增 AHF-01.5 条目 |
| `12_AI_Context.md` | 更新 | 新增阅读顺序条目 |

---

## 冻结声明

**Architecture Dependency（AHF-01.5）设计已冻结。**
**所有后续开发必须遵守分层调用规则。**
**允许进入 AHF-02（Service Standard）。**
