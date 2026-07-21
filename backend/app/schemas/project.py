"""项目 Pydantic v2 校验与响应模型（含 ProjectBudget）。"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


# ── Project ─────────────────────────────────────────────────────


class ProjectCreate(FinanceDeskBaseModel):
    """创建合同请求体。"""

    framework_name: str = Field(..., max_length=200, description="合同名称")
    contract_no: str = Field(..., max_length=100, description="合同编号（新增必填）")
    contract_type: str = Field(default="框架合同", max_length=20, description="合同类型：单项合同 / 框架合同")
    owner_name: str = Field(..., max_length=200, description="业主单位")
    owner_contact: Optional[str] = Field(None, max_length=100, description="联系人")
    owner_phone: Optional[str] = Field(None, max_length=50, description="联系电话")
    contract_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="合同金额（元）")
    budget_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="预算金额（元）")
    sign_date: Optional[date] = Field(None, description="签订时间")
    start_date: Optional[date] = Field(None, description="合同开始时间")
    end_date: Optional[date] = Field(None, description="合同结束时间")
    contract_year: Optional[int] = Field(None, description="所属年度")
    department: Optional[str] = Field(None, max_length=100, description="所属部门")
    manager: Optional[str] = Field(None, max_length=100, description="负责人")
    internal_or_external: str = Field(default="集团内", max_length=20, description="集团内外（集团内 / 集团外）")
    project_type: str = Field(default="其他", max_length=100, description="项目类型")
    status: str = Field(default="待执行", max_length=50, description="合同状态")
    remark: Optional[str] = Field(None, description="备注")


class ProjectUpdate(FinanceDeskBaseModel):
    """更新合同请求体（所有字段可选，只传需修改的字段）。"""

    framework_name: Optional[str] = Field(None, max_length=200)
    contract_no: Optional[str] = Field(None, max_length=100)
    contract_type: Optional[str] = Field(None, max_length=20)
    owner_name: Optional[str] = Field(None, max_length=200)
    owner_contact: Optional[str] = Field(None, max_length=100)
    owner_phone: Optional[str] = Field(None, max_length=50)
    contract_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    budget_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    sign_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    contract_year: Optional[int] = None
    department: Optional[str] = Field(None, max_length=100)
    manager: Optional[str] = Field(None, max_length=100)
    internal_or_external: Optional[str] = Field(None, max_length=20)
    project_type: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    remark: Optional[str] = None


class ProjectResponse(FinanceDeskBaseModel):
    """合同标准响应体。"""

    id: int
    framework_name: str
    contract_no: Optional[str] = None
    contract_type: str
    owner_name: str
    owner_contact: Optional[str] = None
    owner_phone: Optional[str] = None
    contract_amount: Optional[float] = 0
    budget_amount: Optional[float] = 0
    sign_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    contract_year: Optional[int] = None
    department: Optional[str] = None
    manager: Optional[str] = None
    internal_or_external: str
    project_type: str
    status: Optional[str] = "待执行"
    remark: Optional[str] = None
    erp_no: Optional[str] = None
    total_order_amount: float = 0
    order_count: int = 0
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


# ── ProjectBudget ─────────────────────────────────────────────


class ProjectBudgetCreate(FinanceDeskBaseModel):
    """创建项目预算请求体。"""

    budget_type: str = Field(default="初始预算", max_length=100, description="预算类型")
    labor_budget: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2, description="人工费预算（元）")
    material_budget: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2, description="材料费预算（元）")
    management_budget: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2, description="管理费预算（元）")
    gross_margin_rate: Optional[Decimal] = Field(None, decimal_places=2, description="成本管控毛利率（%）")
    preparation_date: Optional[date] = Field(None, description="编制日期")
    preparer: Optional[str] = Field(None, max_length=100, description="编制人")


class ProjectBudgetUpdate(FinanceDeskBaseModel):
    """更新项目预算请求体（所有字段可选）。"""

    budget_type: Optional[str] = Field(None, max_length=100)
    labor_budget: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    material_budget: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    management_budget: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    gross_margin_rate: Optional[Decimal] = Field(None, decimal_places=2)
    preparation_date: Optional[date] = None
    preparer: Optional[str] = Field(None, max_length=100)


class ProjectBudgetResponse(FinanceDeskBaseModel):
    """项目预算标准响应体。"""

    id: int
    project_id: str
    budget_type: str
    labor_budget: Decimal
    material_budget: Decimal
    management_budget: Decimal
    gross_margin_rate: Optional[Decimal] = None
    preparation_date: Optional[date] = None
    preparer: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


# ── 分页 ────────────────────────────────────────────────────────


class PaginatedProjects(FinanceDeskBaseModel):
    """分页合同列表。"""

    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int


class PaginatedProjectBudgets(FinanceDeskBaseModel):
    """分页项目预算列表。"""

    items: list[ProjectBudgetResponse]
    total: int
    page: int
    page_size: int
