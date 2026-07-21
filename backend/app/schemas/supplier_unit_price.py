"""供应商工种单价 Schema。"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


class SupplierUnitPriceCreate(FinanceDeskBaseModel):
    supplier_id: int = Field(..., description="供应商ID")
    year: int = Field(..., description="年度")
    laborer_price: Optional[float] = Field(None, description="普工单价")
    technician_price: Optional[float] = Field(None, description="技工单价")
    senior_technician_price: Optional[float] = Field(None, description="高级技工单价")
    special_work_price: Optional[float] = Field(None, description="特种作业单价")
    comprehensive_price: Optional[float] = Field(None, description="综合单价")
    remark: Optional[str] = Field(None, description="备注")


class SupplierUnitPriceUpdate(FinanceDeskBaseModel):
    year: Optional[int] = None
    laborer_price: Optional[float] = None
    technician_price: Optional[float] = None
    senior_technician_price: Optional[float] = None
    special_work_price: Optional[float] = None
    comprehensive_price: Optional[float] = None
    remark: Optional[str] = None


class SupplierUnitPriceResponse(FinanceDeskBaseModel):
    id: int
    supplier_id: int
    year: int
    laborer_price: Optional[float] = None
    technician_price: Optional[float] = None
    senior_technician_price: Optional[float] = None
    special_work_price: Optional[float] = None
    comprehensive_price: Optional[float] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


class PaginatedSupplierUnitPrices(FinanceDeskBaseModel):
    items: list[SupplierUnitPriceResponse]
    total: int
    page: int
    page_size: int
