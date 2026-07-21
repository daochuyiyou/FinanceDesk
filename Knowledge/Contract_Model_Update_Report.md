# Contract Model Update Report

> **BDD-01 F0.1 产出**
> 生成时间：2026-07-04
> 变更根据业务负责人最终确认执行

---

## 一、修改的字段

| # | 字段名 | 类型 | 必填 | UK | NULL | 默认值 | 说明 |
|:-:|--------|------|:----:|:--:|:----:|--------|------|
| 1 | `contract_no` | String(100) | ✅(新增) | ✅ | ✅(历史) | 自动生成 | 合同编号；新增合同必填，历史数据允许为空 |
| 2 | `owner_name` | String(200) | ✅ | — | — | — | 业主单位；不建独立业主表，支持 AutoComplete |
| 3 | `owner_contact` | String(100) | ❌ | — | ✅ | — | 联系人 |
| 4 | `owner_phone` | String(50) | ❌ | — | ✅ | — | 联系电话 |
| 5 | `contract_year` | Integer | ❌ | — | ✅ | sign_date.year | 所属年度；默认取签订日期年份，允许修改 |
| 6 | `status` | String(50) | ❌ | — | ✅ | "待执行" | 合同状态；系统推导为主，人工仅可终止 |

---

## 二、受影响的页面

| 页面 | 影响程度 | 说明 |
|------|:--------:|------|
| 合同列表 (ProjectList.tsx) | 🟡 中 | 新增列：合同编号、业主单位、所属年度、合同状态 |
| 合同新增 (ProjectModal.tsx) | 🔴 高 | 新增 6 个字段表单控件；合同编号必填校验；业主单位必填 |
| 合同编辑 | 🟡 中 | 编辑模式下 status 不可修改（系统推导）；contract_no 新建后不可修改 |
| 合同详情 (ProjectDetail.tsx) | 🟡 中 | 展示新增 6 个字段；详情页顶部经营摘要增加"合同状态"标签 |
| 数据导入 (DataImport.tsx) | 🟡 中 | 导入模板需新增 6 列（合同编号、业主单位、年度等） |

---

## 三、受影响的 API

| API | 影响 | 说明 |
|:---:|:----:|------|
| `POST /api/v1/projects` | 🟡 | 请求体需包含 `contract_no`（必填），`owner_name`（必填），`owner_contact`, `owner_phone`, `contract_year`, `status`（可选） |
| `PATCH /api/v1/projects/{id}` | 🟡 | 更新体允许修改非 ERP 字段；`status` 在编辑模式限制（人工仅可终止） |
| `GET /api/v1/projects` | 🟢 | 响应体中新增 6 个字段 |
| `GET /api/v1/projects/{id}` | 🟢 | 响应体中新增 6 个字段 |
| 导入端点 | 🟡 | 导入模板需新增 6 列，导入模型需新增字段 |

### API 变更详情

```python
# ProjectCreate Schema — 新增字段
class ProjectCreate(BaseModel):
    framework_name: str = Field(..., max_length=200)
    contract_no: str = Field(..., max_length=100)          # 新增必填
    owner_name: str = Field(..., max_length=200)           # 新增必填
    owner_contact: Optional[str] = Field(None, max_length=100)  # 新增
    owner_phone: Optional[str] = Field(None, max_length=50)     # 新增
    contract_year: Optional[int] = Field(None)                  # 新增
    status: Optional[str] = Field("待执行", max_length=50)     # 新增
    sign_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    internal_or_external: str = "集团内"
    project_type: str = "其他"
```

---

## 四、新增的数据库字段

| # | 字段 | 类型 | 约束 | 默认值 |
|:-:|------|------|------|--------|
| 1 | `contract_no` | String(100) | UNIQUE | — |
| 2 | `owner_name` | String(200) | NOT NULL | — |
| 3 | `owner_contact` | String(100) | NULL | — |
| 4 | `owner_phone` | String(50) | NULL | — |
| 5 | `contract_year` | Integer | NULL | — |
| 6 | `status` | String(50) | NULL, default="待执行" | "待执行" |

### 对应的 SQLAlchemy 模型变更

```python
# project.py — Project 模型新增字段
contract_no = Column(String(100), unique=True, nullable=True, comment="合同编号（新增必填，历史可为空）")
owner_name = Column(String(200), nullable=False, default="", comment="业主单位")
owner_contact = Column(String(100), nullable=True, comment="联系人")
owner_phone = Column(String(50), nullable=True, comment="联系电话")
contract_year = Column(Integer, nullable=True, comment="所属年度（默认取签订日期年份）")
status = Column(String(50), nullable=True, default="待执行", comment="合同状态（系统推导为主，人工仅可终止）")
```

---

## 五、历史数据影响

| 字段 | 历史数据 | 处理方式 |
|------|---------|---------|
| `contract_no` | 空 | 允许为 NULL；历史数据不强制回填 |
| `owner_name` | 空 | **需迁移**：已存在的合同需设置默认业主名（如"待补充"） |
| `owner_contact` | 空 | 允许为 NULL |
| `owner_phone` | 空 | 允许为 NULL |
| `contract_year` | 空 | 可从 `sign_date` 推算，移至迁移脚本处理 |
| `status` | 空 | 默认填充"待执行" |

### 迁移脚本建议

```sql
-- 历史数据迁移 (Alembic migration)
UPDATE project SET owner_name = '待补充' WHERE owner_name IS NULL OR owner_name = '';
UPDATE project SET contract_year = CAST(strftime('%Y', sign_date) AS INTEGER) WHERE contract_year IS NULL AND sign_date IS NOT NULL;
UPDATE project SET status = '待执行' WHERE status IS NULL;
```

---

## 六、Alembic 评估（仅评估，不实施）

| 项目 | 评估 |
|------|------|
| 是否需要 Alembic | **是**。6 个字段新增需要迁移脚本 |
| 迁移类型 | 纯新增列（无列删除、无重命名） |
| 回滚 | `op.drop_column()` 即可回滚 |
| 数据迁移 | 需同时执行历史数据填充（owner_name 默认值、contract_year 推算） |
| 风险 | 🟢 低。新增列不会破坏现有功能 |
| 建议 | 在 BDD-01 F1 开发时一并生成 Alembic 迁移脚本 |

---

## 七、更新的文档清单

| 文档 | 变更内容 | 状态 |
|------|---------|:----:|
| `Business_Data_Model.md` | §1 Contract 表新增 6 字段 | ✅ |
| `Business_Field_Standard.md` | 新增 `contract_no` / `owner_name` 标准 | ✅ |
| `Contract_Entry_Model.md` | §1 布局 + §2 字段定义 + §2.2 status | ✅ |
| `UI_Data_Source_Matrix.md` | §2 合同中心新增 6 字段来源矩阵 | ✅ |
| **`Contract_Model_Update_Report.md`** | 本文档 | **✅ 当前** |

---

## 八、等待审批后启动

| 审批项 | 状态 |
|--------|:----:|
| 6 个新增字段定义 | ✅ 已确认 |
| 4 份 SSoT 文档同步 | ✅ 已完成 |
| API Schema 变更 | 📋 已设计 |
| 数据库迁移 | 📋 已评估 |
| 历史数据迁移 | 📋 已规划 |

**等待你审批确认后，进入 F1（合同新增）代码开发。**
