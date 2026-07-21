"""供应商框架合同 Pydantic v2 校验与响应模型。"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


class SupplierCreate(FinanceDeskBaseModel):
    name: str = Field(..., max_length=200, description="供应商名称")
    framework: Optional[str] = Field(None, max_length=200, description="所属框架")
    framework_no: str = Field(..., max_length=100, description="框架编号")
    framework_start_date: Optional[date] = Field(None, description="框架开始时间")
    framework_end_date: Optional[date] = Field(None, description="框架结束时间")
    year: Optional[int] = Field(None, description="年度")


class SupplierUpdate(FinanceDeskBaseModel):
    name: Optional[str] = Field(None, max_length=200)
    framework: Optional[str] = Field(None, max_length=200)
    framework_no: Optional[str] = Field(None, max_length=100)
    framework_start_date: Optional[date] = None
    framework_end_date: Optional[date] = None
    year: Optional[int] = None


class SupplierResponse(FinanceDeskBaseModel):

    id: int
    name: str
    framework: Optional[str] = None
    framework_no: str
    framework_start_date: Optional[date] = None
    framework_end_date: Optional[date] = None
    year: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


class PaginatedSuppliers(FinanceDeskBaseModel):
    items: list[SupplierResponse]
    total: int
    page: int
    page_size: int


# ── SupplierPrice (旧表，兼容) ────────────────────


class SupplierPriceCreate(FinanceDeskBaseModel):
    work_type: str = Field(..., max_length=100, description="工种名称")
    unit_price: Optional[str] = Field(None, description="综合单价")
    remark: Optional[str] = Field(None, description="备注")


class SupplierPriceUpdate(FinanceDeskBaseModel):
    work_type: Optional[str] = Field(None, max_length=100)
    unit_price: Optional[str] = None
    remark: Optional[str] = None


class SupplierPriceResponse(FinanceDeskBaseModel):
    id: int
    supplier_id: str
    work_type: str
    unit_price: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


class PaginatedSupplierPrices(FinanceDeskBaseModel):
    items: list[SupplierPriceResponse]
    total: int
    page: int
    page_size: int
