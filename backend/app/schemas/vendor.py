from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


class VendorCreate(FinanceDeskBaseModel):
    name: str = Field(..., max_length=200, description="供应商名称")
    remark: Optional[str] = Field(None, description="备注")


class VendorUpdate(FinanceDeskBaseModel):
    name: Optional[str] = Field(None, max_length=200)
    remark: Optional[str] = None


class VendorResponse(FinanceDeskBaseModel):
    id: int
    name: str
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


class PaginatedVendors(FinanceDeskBaseModel):
    items: list[VendorResponse]
    total: int
    page: int
    page_size: int
