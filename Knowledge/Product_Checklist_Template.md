# Product Checklist — {{页面名称}}

> Sprint: {{PS-XXX}}
> 原型路径: `prototypes/{{sprint}}-{{page-name}}/index.html`
> 目标版本: {{页面名称}} V1.0

---

**评审标准：[FPS-1](FPS-1_Product_Standard_V1.md) — 七个维度**

评审结果：`[ ] Approve / [ ] Approve with P1 / [ ] Reject`

---

## D1: Business（业务正确性）🚫 阻止级

> 任一未通过 → **Reject**

- [ ] 页面服务的目标角色明确（项目经理/经营人员/财务/采购）
- [ ] 页面覆盖该角色的核心业务流程
- [ ] 页面名称与业务认知一致
- [ ] 业务数据完整流向：新增→查看→编辑→删除
- [ ] 关联对象引用关系正确（订单↔项目↔合同↔供应商）
- [ ] Mock 数据模拟真实业务场景

**D1 通过：** `[ ] 是 → 进入 D2` / `[ ] 否 → Reject`

---

## D2: Excel First（Excel 优先）⚡

> 未通过记录 TODO，可 Approve with P1

### 录入效率
- [ ] 点击次数 ≤ Excel 同类操作
- [ ] 默认仅展示 6-8 个常用字段
- [ ] 不常用字段折叠在"高级信息"
- [ ] 编辑时不强制重新选择已有值

### 识别效率
- [ ] 关联对象同时展示 编号+名称
- [ ] 禁止显示 ID/UUID/外键
- [ ] 名称可点击进入详情

**D2 TODO 项：** ________

---

## D3: Information Architecture（信息架构）🏗️

> 未通过记录 TODO，可 Approve with P1

- [ ] 5 秒内理解页面用途
- [ ] 核心数据/操作在视口顶部
- [ ] 第一屏尽量不滚动
- [ ] 信息按业务含义分组
- [ ] 无冗余/无价值信息
- [ ] 数字有适当格式化

**D3 TODO 项：** ________

---

## D4: Interaction（交互）🖱️

> 未通过记录 TODO，可 Approve with P1

- [ ] 成功 Toast / 失败 Error 提示
- [ ] 删除有 Popconfirm
- [ ] 加载有 Spin
- [ ] 所有 Select 支持关键字搜索
- [ ] 弹窗尺寸 500/600px
- [ ] 按钮：取消在左，确定在右
- [ ] 标题：新增/编辑{名称}
- [ ] Form layout="vertical"

**D4 TODO 项：** ________

---

## D5: Data（数据）📊

> 未通过记录 TODO，可 Approve with P1

- [ ] 金额精度 ¥0.00
- [ ] 百分比精度 X.X%
- [ ] 日期格式 YYYY-MM-DD
- [ ] 空值显示 `-`
- [ ] 收入 blue / 成本 red / 利润 green

**D5 TODO 项：** ________

---

## D6: Performance（性能）⚡

> 未通过记录 TODO，可 Approve with P1

- [ ] 页面 API 调用 ≤ 5 个
- [ ] 无 N+1 查询模式
- [ ] 无大型图表库

**D6 TODO 项：** ________

---

## D7: Release Readiness（发布就绪）🚀

> 未通过记录 TODO，可 Approve with P1

- [ ] 原型包含完整流程（含弹窗/异常状态）
- [ ] Mock 数据覆盖典型场景
- [ ] TS 编译零错误
- [ ] 浏览器截图保存
- [ ] Console 无错误
- [ ] 原型 vs 实现逐项对照完成

**D7 TODO 项：** ________

---

## 评审结论

| 维度 | 结果 | TODO 数量 |
|------|------|-----------|
| D1 Business | ✅ / ❌ | — |
| D2 Excel First | ✅ / ⚠️ P1 | __ |
| D3 Information Architecture | ✅ / ⚠️ P1 | __ |
| D4 Interaction | ✅ / ⚠️ P1 | __ |
| D5 Data | ✅ / ⚠️ P1 | __ |
| D6 Performance | ✅ / ⚠️ P1 | __ |
| D7 Release Readiness | ✅ / ⚠️ P1 | __ |

**最终结果**：`[ ] Approve` / `[ ] Approve with P1` / `[ ] Reject`

> 填写完成 → 进入 Review 阶段，输出 decision.md
