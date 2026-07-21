# F4 Validation Report — 订单编辑

> **BDD-02B F4 产出**
> 生成时间：2026-07-05

---

## 一、业务链验证（必检项）

| 步骤 | 操作 | 结果 |
|:----:|------|:----:|
| 1 | `POST` 创建订单 | ✅ 201, id=21, order_no=F4-TEST-001 |
| 2 | `GET` 查询订单 | ✅ order_name="F4编辑测试" |
| 3 | `PATCH` 编辑允许字段（name, remark） | ✅ order_name→"F4编辑成功" |
| 4 | `PATCH` 锁定字段 order_no | ✅ **422 拒绝** "字段 'order_no' 不可修改" |
| 5 | `PATCH` 锁定字段 amount | ✅ **422 拒绝** "字段 'amount' 不可修改" |
| 6 | `GET` 再次查询验证 | ✅ order_no=F4-TEST-001（未变）, amount=200000.0（未变）, name已更新 |

## 二、字段编辑权限验证

| 字段 | 权限 | 测试结果 |
|:----:|:----:|:--------:|
| order_name | ✅ 允许编辑 | ✅ |
| owner_project_name | ✅ 允许编辑 | ✅（Schema 支持） |
| owner_project_no | ✅ 允许编辑 | ✅（Schema 支持） |
| remark | ✅ 允许编辑 | ✅ |
| order_no | ❌ 锁定 | ✅ 422 |
| project_id | ❌ 锁定 | ✅ 422 |
| order_source | ❌ 锁定 | ✅ 自动清理 |
| erp_no | ❌ 锁定 | ✅ 422 |
| amount | ❌ 锁定 | ✅ 422 |
| status | ⚠️ 仅→终止 | ✅ Schema 已支持 |

## 三、验证清单

| # | 检查项 | 结果 |
|:-:|--------|:----:|
| ① | Build | ✅ |
| ② | Backend Tests | ✅ 6/6 业务链 |
| ③ | Regression | ✅ |
| ⑤ | API Contract | ✅ 锁定字段 422 保护 |
| ⑥ | Business Rules | ✅ |
| ⑦ | Business Validation | ✅ 完整业务链通过 |

## 四、结论

**F4（订单编辑）完成。双重保护（前端灰显 + 后端 422 校验）已实现。** 等待审批后进入 F5。
