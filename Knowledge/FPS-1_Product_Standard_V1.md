# FinanceDesk Product Standard V1（FPS-1）

> **版本：V1.0 | 唯一产品验收标准**
> 生效：即日起，替换所有零散检查组
> 所有 Prototype Review 必须按本标准执行，未获得 Approve 的 Prototype 禁止进入 Develop

---

## 概述

FPS-1 定义了 FinanceDesk 所有页面的**七个维度的产品标准**。

每个 Prototype 必须经过完整的七维度评审，输出评审结果（Approve / Approve with P1 / Reject）后方可进入 Develop。

---

## 评审结果定义

| 结果 | 含义 | 后续动作 |
|------|------|---------|
| **Approve** | 全部维度通过 | 进入 Develop |
| **Approve with P1** | 非阻止性维度有未通过项，已记录 TODO | 进入 Develop，TODO 必须在 Freeze 前完成 |
| **Reject** | Business 维度未通过 / 多个维度有严重问题 | 不可进入 Develop，返回 Prototype 修改 |

**未获得 Approve 的 Prototype，禁止进入 Develop 阶段。**

---

## 第一维度：Business（业务正确性）

> 阻止级 — 不通过 = Reject

### 角色与场景
- [ ] 页面服务的目标角色明确（项目经理/经营人员/财务/采购）
- [ ] 页面覆盖该角色的核心业务流程（不是边缘场景）
- [ ] 页面名称与业务认知一致（用户不需要猜这是什么页面）

### 流程覆盖
- [ ] 业务数据的完整流向：新增 → 查看 → 编辑 → 删除
- [ ] 关联对象的引用关系正确（订单↔项目↔合同↔供应商）
- [ ] 业务状态流转符合真实世界规则

### Mock 数据
- [ ] Mock 数据模拟真实业务场景（非全空/全零/全测试数据）
- [ ] Mock 数据包含典型业务值（如正常金额、边界值）

### 通过规则
- **全部通过** → 进入下一维度
- **任一未通过** → **Reject**

---

## 第二维度：Excel First（Excel 优先）

> 非阻止级 — 未通过记录 TODO，可带 P1 进入 Develop

### 录入效率
- [ ] 用户完成主要任务的点击次数 ≤ Excel 同类操作
- [ ] 新增表单默认仅展示 6-8 个最常用字段
- [ ] 不常用字段折叠在"高级信息"中
- [ ] 编辑时已有值不要求重新选择/输入

### 感知效率
- [ ] 同一页面可完成的任务不跳转其他页面
- [ ] 使用 Drawer/Dialog/Tab 代替页面跳转

### 识别效率
- [ ] 所有关联对象同时展示 **编号+名称**
- [ ] 禁止仅展示编码、ID、UUID 等数据库主键
- [ ] 表格中的名称可点击进入详情

---

## 第三维度：Information Architecture（信息架构）

> 非阻止级 — 未通过记录 TODO，可带 P1 进入 Develop

### 首屏理解
- [ ] 页面打开后 **5 秒内**能理解页面用途
- [ ] 核心数据/操作优先展示在视口顶部
- [ ] 第一屏尽量不滚动

### 信息分组
- [ ] 信息按业务含义分组（基础信息 → 高级信息 → 扩展信息）
- [ ] 分组标题有明确业务语义（非"其他"）
- [ ] 无关信息不混在一起

### 信息密度
- [ ] 无冗余/无价值信息
- [ ] 无不需要的图表
- [ ] 数字/金额有适当的格式化（千分位、单位、颜色）

---

## 第四维度：Interaction（交互）

> 非阻止级 — 未通过记录 TODO，可带 P1 进入 Develop

### 操作反馈
- [ ] 成功操作有 Toast 提示（message.success）
- [ ] 失败操作有错误提示（message.error）
- [ ] 删除操作有 Popconfirm 二次确认
- [ ] 加载状态有 Spin/loading 指示

### 控件规范
- [ ] 所有 Select 支持关键字搜索（showSearch + filterOption）
- [ ] 筛选下拉框选项格式统一：`编号 - 名称`
- [ ] 搜索无需记忆编码即可找到目标

### 布局规范
- [ ] 弹窗尺寸：窄 500px / 宽 600px
- [ ] 按钮顺序：取消在左，确定在右（antd 默认）
- [ ] 弹窗标题：`新增{名称}` / `编辑{名称}`
- [ ] Form Item 纵向排列（layout="vertical"）

---

## 第五维度：Data（数据）

> 非阻止级 — 未通过记录 TODO，可带 P1 进入 Develop

### 精度与格式
- [ ] 金额字段精度统一（保留两位小数 ¥0.00）
- [ ] 百分比字段精度统一（保留一位小数 X.X%）
- [ ] 日期字段格式统一（YYYY-MM-DD）
- [ ] 千分位格式化使用 locale 字符串

### 显示规则
- [ ] 空值显示 `-`（非 0 或空白）
- [ ] 数值 0 正常显示 `0` / `¥0.00`
- [ ] 长文本有 ellipsis 截断 + tooltip

### 颜色语义
- [ ] 收入/回款：blue（#1677ff）
- [ ] 成本/支出：red（#ff4d4f）
- [ ] 利润正数：green（#52c41a）
- [ ] 利润负数：red（#ff4d4f）
- [ ] 中性数据：default（#333）

---

## 第六维度：Performance（性能）

> 非阻止级 — 未通过记录 TODO，可带 P1 进入 Develop

### 原型阶段可评估项
- [ ] 页面请求数量合理（不超过 5 个独立 API 调用）
- [ ] 无需在列表中逐一查询详情（N+1 问题）
- [ ] 列表分页使用服务端分页（非全量加载）

### 打包体积
- [ ] 无大型图表库引入（Dashboard 不包含 @ant-design/charts）
- [ ] 使用 ProTable 的页面评估 ProComponents 体积影响

---

## 第七维度：Release Readiness（发布就绪）

> 非阻止级 — 未通过记录 TODO，可带 P1 进入 Develop

### 原型阶段
- [ ] Prototype 已输出完整交互流程（含弹窗、折叠、异常状态）
- [ ] Mock 数据已覆盖典型业务场景
- [ ] 已知的 UI 未通过项已记录为开发 TODO

### 开发完成前
- [ ] TypeScript 编译零错误
- [ ] 浏览器验证截图已保存
- [ ] Console 无错误（network 4xx/5xx 排除）
- [ ] 原型 vs 实现逐项对照完成
- [ ] 冻结记录（freeze.md）已填写

---

## 评审流程

```
Prototype 完成
    ↓
Hermes 自检 FPS-1 全部 7 个维度
    ↓
产品负责人逐维度评审
    ↓
输出评审结果：
  ├─ Approve          → 进入 Develop
  ├─ Approve with P1  → 进入 Develop，TODO 在 Freeze 前完成
  └─ Reject           → 返回 Prototype 修改
    ↓
Develop → Verify → Freeze
```

---

## 与现有标准的关系

| 现有文档 | 与 FPS-1 的关系 | 处理 |
|---------|----------------|------|
| UI Standard V1 | FPS-1 第七维度的具体实现规范 | 保留，作为 UI 标准参考 |
| Product Checklist | 更新为 FPS-1 的 7 维度检查清单 | 立即更新 |
| Product Governance V1 | 治理流程框架，FPS-1 嵌入为 Checklist 阶段 | 立即更新引用 |

---

## 附录：维度过关矩阵

| 维度 | 级别 | 未通过后果 |
|------|------|-----------|
| Business | 🚫 阻止级 | **Reject**，不可进入 Develop |
| Excel First | ⚠️ 非阻止 | Approve with P1 |
| Information Architecture | ⚠️ 非阻止 | Approve with P1 |
| Interaction | ⚠️ 非阻止 | Approve with P1 |
| Data | ⚠️ 非阻止 | Approve with P1 |
| Performance | ⚠️ 非阻止 | Approve with P1 |
| Release Readiness | ⚠️ 非阻止 | Approve with P1 |
