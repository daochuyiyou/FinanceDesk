"""供应商年度单价 Pydantic v2 模型。"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


class SupplierYearPriceCreate(FinanceDeskBaseModel):
    year: Optional[int] = Field(None, description="年度")
    laborer_unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="普工单价")
    technician_unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="技工单价")
    senior_technician_unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="高级技工单价")
    special_work_type: Optional[str] = Field(None, max_length=100, description="特种作业工种")
    special_work_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="特种作业单价")
    comprehensive_unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="综合单价")
    remark: Optional[str] = Field(None, description="备注")


class SupplierYearPriceUpdate(FinanceDeskBaseModel):
    year: Optional[int] = None
    laborer_unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    technician_unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    senior_technician_unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    special_work_type: Optional[str] = Field(None, max_length=100)
    special_work_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    comprehensive_unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    remark: Optional[str] = None


class SupplierYearPriceResponse(FinanceDeskBaseModel):
    id: int
    supplier_id: str
    year: Optional[int] = None
    laborer_unit_price: Optional[Decimal] = None
    technician_unit_price: Optional[Decimal] = None
    senior_technician_unit_price: Optional[Decimal] = None
    special_work_type: Optional[str] = None
    special_work_price: Optional[Decimal] = None
    comprehensive_unit_price: Optional[Decimal] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


class PaginatedSupplierYearPrices(FinanceDeskBaseModel):
    items: list[SupplierYearPriceResponse]
    total: int
    page: int
    page_size: int
