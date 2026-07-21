# Layer Call Matrix — 层间调用许可矩阵

> **AHF-01.5 P2 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **每一层的允许/禁止/限制调用矩阵。所有开发必须遵循。** 

---

## 一、完整调用许可矩阵

| 调用方 → 被调方 | Router | Service | Engine | Repo | ORM | Dashboard | AI | Plugin | Event | Summary | Mapping | Rule Engine |
|:---------------:|:------:|:-------:|:------:|:----:|:---:|:---------:|:--:|:------:|:-----:|:-------:|:-------:|:-----------:|
| **Router** | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Service** | ❌ | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ | ❌ | ❌ |
| **Engine** | ❌ | ❌ | — | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Repository** | ❌ | ❌ | ❌ | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **ORM** | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Dashboard** | ❌ | ✅ | ✅ | ❌ | ❌ | — | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **AI** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | — | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Plugin** | ❌ | ❌ | ⚠️ | ✅ | ❌ | ❌ | ❌ | — | ⚠️ | ❌ | ❌ | ❌ |
| **Event** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ |
| **Summary** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| **Mapping** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | — | ❌ |
| **Rule Engine** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | — |

### 图例

| 符号 | 含义 |
|:----:|:-----|
| ✅ | **Allowed** — 标准调用方向 |
| ❌ | **Forbidden** — 禁止调用，违反分层 |
| ⚠️ | **Restricted** — 受限，需审批 |
| — | 自调用（不适用） |

---

## 二、各层调用详情

### 2.1 Router 可调用的层

| → 调用 | 许可 | 说明 |
|:-------|:----:|------|
| Service | ✅ | 主要调用方向 |
| Engine | ✅ | 直接调用核心引擎 |
| Repository | ❌ | 必须通过 Service/Engine |
| ORM | ❌ | 禁止直接 ORM |
| Dashboard | ❌ | Dashboard 不提供服务接口 |

### 2.2 Service 可调用的层

| → 调用 | 许可 | 说明 |
|:-------|:----:|------|
| Engine | ✅ | 协调多个 Engine |
| Repository | ✅ | 非 Engine 场景直接数据访问 |
| Summary | ✅ | 读取汇总数据 |
| ORM | ❌ | 必须通过 Repository |
| Event | ⚠️ | 仅在 Engine 上下文中 |

### 2.3 Engine 可调用的层

| → 调用 | 许可 | 说明 |
|:-------|:----:|------|
| Repository | ✅ | **唯一**数据访问通道 |
| Summary | ✅ | 触发/读取汇总 |
| Mapping | ✅ | 调用 Mapping Engine 生成事件 |
| Rule Engine | ✅ | 调用 Rule Engine 匹配规则 |
| Event | ✅ | 生成/消费业务事件 |
| Service | ❌ | 禁止反向调用 |
| ORM | ❌ | 必须通过 Repository |

### 2.4 Repository 可调用的层

| → 调用 | 许可 | 说明 |
|:-------|:----:|------|
| ORM | ✅ | **唯一**ORM 访问者 |
| Engine | ❌ | 禁止反向调用 |
| Service | ❌ | 禁止反向调用 |
| Repository | ❌ | 禁止交叉调用 |
| Summary | ❌ | Summary 不是 Repository 的职责 |

### 2.5 Dashboard 可调用的层

| → 调用 | 许可 | 说明 |
|:-------|:----:|------|
| Service | ✅ | 获取业务数据 |
| Engine | ✅ | 触发 Engine 计算 |
| Summary | ✅ | **推荐** — 读取汇总 |
| Repository | ❌ | 必须通过 Service/Engine |
| ORM | ❌ | 禁止直接访问 |

### 2.6 AI 可调用的层

| → 调用 | 许可 | 说明 |
|:-------|:----:|------|
| Engine | ✅ | 调用 Engine 分析数据 |
| Event | ✅ | 读取业务事件 |
| Summary | ✅ | 读取汇总数据 |
| Repository | ❌ | 禁止直接数据访问 |
| ORM | ❌ | 禁止直接数据访问 |

### 2.7 Plugin 可调用的层

| → 调用 | 许可 | 说明 |
|:-------|:----:|------|
| Repository | ✅ | 通过 Plugin Repository |
| Engine | ⚠️ | 受限，需审批 |
| Event | ⚠️ | 受限，需审批 |
| ORM | ❌ | 禁止直接 ORM |

---

## 三、关键禁令摘要

| 禁令 | 涉及路径 |
|:-----|:---------|
| **Router → ORM** | 最严重的分层违反 |
| **Engine → ORM** | 违反 Repository Standard |
| **Dashboard → ORM** | 违反 Dashboard 只读原则 |
| **AI → ORM** | 违反数据安全 |
| **Repository → Engine** | 循环依赖 |
| **Cross-Repository** | 耦合 |
| **Service → ORM** | 绕过 Repository 映射 |

---

## 四、调用许可统计

| 层 | 允许调用 | 禁止调用 | 受限 | 总计可能的被调方 |
|:--:|:--------:|:--------:|:----:|:----------------:|
| Router | 2 | 9 | 0 | 11 |
| Service | 4 | 5 | 1 | 11 |
| Engine | 6 | 2 | 0 | 11 |
| Repository | 1 | 10 | 0 | 11 |
| ORM | 0 | 11 | 0 | 11 |
| Dashboard | 3 | 8 | 0 | 11 |
| AI | 3 | 8 | 0 | 11 |
| Plugin | 1 | 8 | 2 | 11 |
| Event | 0 | 11 | 0 | 11 |
| Summary | 1 | 10 | 0 | 11 |
| Mapping | 2 | 9 | 0 | 11 |
| Rule Engine | 2 | 9 | 0 | 11 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
