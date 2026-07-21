"""订单 Pydantic v2 校验与响应模型。"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


class OrderCreate(FinanceDeskBaseModel):
    """创建订单请求体。"""

    project_id: int = Field(..., description="关联的项目 ID")
    supplier_id: Optional[int] = Field(None, description="关联的供应商 ID")
    customer_name: Optional[str] = Field(None, max_length=200, description="甲方单位名称")
    order_no: str = Field(..., max_length=100, description="甲方订单编号（ERP 匹配键，禁止自动生成）")
    order_name: Optional[str] = Field(None, max_length=200, description="订单名称")
    owner_project_name: Optional[str] = Field(None, max_length=200, description="甲方项目名称")
    owner_project_no: Optional[str] = Field(None, max_length=100, description="甲方项目编号")
    order_date: Optional[date] = Field(None, description="生成订单日期")
    amount: Decimal = Field(default=Decimal("0.00"), ge=0, decimal_places=2, description="订单金额含税（元）")
    non_tax_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="订单金额不含税（元）")
    erp_no: Optional[str] = Field(None, max_length=100, description="智慧工程ERP项目编号")
    mobile_project_no: Optional[str] = Field(None, max_length=100, description="移动项目编号")
    order_type: Optional[str] = Field(None, max_length=50, description="订单类型")
    mobile_contact: Optional[str] = Field(None, max_length=100, description="移动对接人")
    status: Optional[str] = Field(None, max_length=50, description="状态")


class OrderUpdate(FinanceDeskBaseModel):
    """更新订单请求体（所有字段可选，只传需修改的字段）。"""

    supplier_id: Optional[int] = Field(None, description="关联的供应商 ID")
    order_no: Optional[str] = Field(None, max_length=100)
    order_name: Optional[str] = Field(None, max_length=200)
    owner_project_name: Optional[str] = Field(None, max_length=200)
    owner_project_no: Optional[str] = Field(None, max_length=100)
    customer_name: Optional[str] = Field(None, max_length=200)
    order_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    non_tax_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    erp_no: Optional[str] = Field(None, max_length=100)
    mobile_project_no: Optional[str] = Field(None, max_length=100)
    order_type: Optional[str] = Field(None, max_length=50)
    mobile_contact: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)


class OrderResponse(FinanceDeskBaseModel):
    """订单标准响应体。"""

    id: int
    project_id: int
    supplier_id: Optional[int] = None
    order_no: str
    order_source: Optional[str] = None
    order_name: Optional[str] = None
    customer_name: Optional[str] = None
    owner_project_name: Optional[str] = None
    owner_project_no: Optional[str] = None
    contract_name: Optional[str] = None
    contract_type: Optional[str] = None
    order_date: Optional[date] = None
    amount: Decimal
    non_tax_amount: Optional[Decimal] = None
    erp_no: Optional[str] = None
    mobile_project_no: Optional[str] = None
    order_type: Optional[str] = None
    mobile_contact: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


class PaginatedOrders(FinanceDeskBaseModel):
    """分页订单列表。"""

    items: list[OrderResponse]
    total: int
    page: int
    page_size: int
