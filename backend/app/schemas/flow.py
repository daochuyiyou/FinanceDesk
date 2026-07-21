"""收入流水 / 成本流水 Pydantic v2 校验与响应模型。"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


# ═══════════════════════════════════════════════════════════════
# IncomeFlow
# ═══════════════════════════════════════════════════════════════


class IncomeFlowCreate(FinanceDeskBaseModel):
    """创建收入流水请求体。"""

    invoice_count: int = Field(default=1, ge=1, description="开票次数")
    tax_rate: Optional[Decimal] = Field(None, decimal_places=2, description="税率（%）")
    taxable_amount: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2, description="开票金额含税（元）")
    non_taxable_amount: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0, decimal_places=2, description="开票金额不含税（元）")
    invoice_date: Optional[date] = Field(None, description="开票时间")
    invoice_no: Optional[str] = Field(None, max_length=200, description="发票号码")
    invoice_stage: Optional[str] = Field(None, max_length=50, description="开票阶段")
    invoice_reason: Optional[str] = Field(None, max_length=50, description="开票原因")
    business_date: Optional[date] = Field(None, description="经营发生日期")
    expected_collection_date: Optional[date] = Field(None, description="预计回款日期")
    business_owner: Optional[str] = Field(None, max_length=100, description="经营责任人")
    remark: Optional[str] = Field(None, description="备注")
    status: str = Field(default="待回款", max_length=50, description="状态")


class IncomeFlowUpdate(FinanceDeskBaseModel):
    """更新收入流水请求体（所有字段可选）。"""

    invoice_count: Optional[int] = Field(None, ge=1)
    tax_rate: Optional[Decimal] = Field(None, decimal_places=2)
    taxable_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    non_taxable_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    invoice_date: Optional[date] = None
    invoice_no: Optional[str] = Field(None, max_length=200)
    invoice_stage: Optional[str] = Field(None, max_length=50)
    invoice_reason: Optional[str] = Field(None, max_length=50)
    business_date: Optional[date] = None
    expected_collection_date: Optional[date] = None
    business_owner: Optional[str] = Field(None, max_length=100)
    remark: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)


class IncomeFlowResponse(FinanceDeskBaseModel):
    """收入流水标准响应体。"""


    id: int
    order_id: str
    invoice_count: int
    tax_rate: Optional[Decimal] = None
    taxable_amount: Decimal
    non_taxable_amount: Decimal
    invoice_date: Optional[date] = None
    invoice_no: Optional[str] = None
    invoice_stage: Optional[str] = None
    invoice_reason: Optional[str] = None
    business_date: Optional[date] = None
    expected_collection_date: Optional[date] = None
    business_owner: Optional[str] = None
    remark: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


# ═══════════════════════════════════════════════════════════════
# CostFlow
# ═══════════════════════════════════════════════════════════════


class CostFlowCreate(FinanceDeskBaseModel):
    """创建成本流水请求体。"""

    cost_party: Optional[str] = Field(None, max_length=200, description="成本方")
    supplier_id: int = Field(..., description="关联供应商 ID（必选）")
    cost_type: str = Field(default="其他", max_length=100, description="成本类型")
    tax_rate: Optional[Decimal] = Field(None, decimal_places=2, description="税率（%）")
    taxable_amount: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2, description="成本金额含税（元）")
    non_taxable_amount: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0, decimal_places=2, description="成本金额不含税（元）")
    cost_subject: Optional[str] = Field(None, max_length=200, description="成本科目")
    budget_item: Optional[str] = Field(None, max_length=200, description="对应预算项")
    cost_stage: Optional[str] = Field(None, max_length=50, description="成本阶段")
    cost_reason: Optional[str] = Field(None, max_length=50, description="成本原因")
    business_date: Optional[date] = Field(None, description="经营发生日期")
    expected_payment_date: Optional[date] = Field(None, description="预计付款日期")
    business_owner: Optional[str] = Field(None, max_length=100, description="经营责任人")
    remark: Optional[str] = Field(None, description="备注")
    status: str = Field(default="待支付", max_length=50, description="状态")


class CostFlowUpdate(FinanceDeskBaseModel):
    """更新成本流水请求体（所有字段可选）。"""

    cost_party: Optional[str] = Field(None, max_length=200)
    supplier_id: Optional[int] = Field(None, description="关联供应商 ID")
    cost_type: Optional[str] = Field(None, max_length=100)
    tax_rate: Optional[Decimal] = Field(None, decimal_places=2)
    taxable_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    non_taxable_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    cost_subject: Optional[str] = Field(None, max_length=200)
    budget_item: Optional[str] = Field(None, max_length=200)
    cost_stage: Optional[str] = Field(None, max_length=50)
    cost_reason: Optional[str] = Field(None, max_length=50)
    business_date: Optional[date] = None
    expected_payment_date: Optional[date] = None
    business_owner: Optional[str] = Field(None, max_length=100)
    remark: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)


class CostFlowResponse(FinanceDeskBaseModel):
    """成本流水标准响应体。"""


    id: int
    order_id: str
    cost_party: Optional[str] = None
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = Field(None, description="供应商名称（只读）")
    cost_type: str
    tax_rate: Optional[Decimal] = None
    taxable_amount: Decimal
    non_taxable_amount: Decimal
    cost_subject: Optional[str] = None
    budget_item: Optional[str] = None
    cost_stage: Optional[str] = None
    cost_reason: Optional[str] = None
    business_date: Optional[date] = None
    expected_payment_date: Optional[date] = None
    business_owner: Optional[str] = None
    remark: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


# ── 分页 ────────────────────────────────────────────────────────


class PaginatedIncomeFlows(FinanceDeskBaseModel):
    """分页收入流水列表。"""

    items: list[IncomeFlowResponse]
    total: int
    page: int
    page_size: int


class PaginatedCostFlows(FinanceDeskBaseModel):
    """分页成本流水列表。"""

    items: list[CostFlowResponse]
    total: int
    page: int
    page_size: int
