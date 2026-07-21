"""供应商合同 Schema。"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


class SupplierContractCreate(FinanceDeskBaseModel):
    supplier_id: int = Field(..., description="供应商ID")
    contract_no: str = Field(..., max_length=100, description="合同编号")
    sign_date: Optional[date] = Field(None, description="签订日期")
    start_date: Optional[date] = Field(None, description="合同开始日期")
    end_date: Optional[date] = Field(None, description="合同结束日期")
    amount: Optional[float] = Field(None, description="合同金额")
    status: Optional[str] = Field("有效", max_length=50, description="合同状态")
    remark: Optional[str] = Field(None, description="备注")


class SupplierContractUpdate(FinanceDeskBaseModel):
    contract_no: Optional[str] = Field(None, max_length=100)
    sign_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    amount: Optional[float] = None
    status: Optional[str] = Field(None, max_length=50)
    remark: Optional[str] = None


class SupplierContractResponse(FinanceDeskBaseModel):
    id: int
    supplier_id: int
    contract_no: str
    sign_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


class PaginatedSupplierContracts(FinanceDeskBaseModel):
    items: list[SupplierContractResponse]
    total: int
    page: int
    page_size: int
