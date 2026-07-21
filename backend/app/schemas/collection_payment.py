"""回款 / 支付 Pydantic v2 校验与响应模型。"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


# ═══════════════════════════════════════════════════════════════
# Collection（回款）
# ═══════════════════════════════════════════════════════════════


class CollectionCreate(FinanceDeskBaseModel):
    """创建回款记录请求体。"""

    collection_date: Optional[date] = Field(None, description="回款日期")
    amount: Decimal = Field(..., ge=0, decimal_places=2, description="回款金额（元）")
    receipt_no: Optional[str] = Field(None, max_length=200, description="收款凭证号")


class CollectionUpdate(FinanceDeskBaseModel):
    """更新回款记录请求体（所有字段可选）。"""

    collection_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    receipt_no: Optional[str] = Field(None, max_length=200)


class CollectionResponse(FinanceDeskBaseModel):
    """回款标准响应体。"""


    id: int
    flow_id: str
    collection_date: Optional[date] = None
    amount: Decimal
    receipt_no: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


# ═══════════════════════════════════════════════════════════════
# Payment（支付）
# ═══════════════════════════════════════════════════════════════


class PaymentCreate(FinanceDeskBaseModel):
    """创建支付记录请求体。"""

    payment_date: Optional[date] = Field(None, description="支付日期")
    payee: Optional[str] = Field(None, max_length=200, description="支付对象")
    voucher_no: Optional[str] = Field(None, max_length=200, description="支付凭证")
    amount: Decimal = Field(..., ge=0, decimal_places=2, description="支付金额（元）")


class PaymentUpdate(FinanceDeskBaseModel):
    """更新支付记录请求体（所有字段可选）。"""

    payment_date: Optional[date] = None
    payee: Optional[str] = Field(None, max_length=200)
    voucher_no: Optional[str] = Field(None, max_length=200)
    amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)


class PaymentResponse(FinanceDeskBaseModel):
    """支付标准响应体。"""


    id: int
    cost_id: str
    payment_date: Optional[date] = None
    payee: Optional[str] = None
    voucher_no: Optional[str] = None
    amount: Decimal
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


# ── 分页 ────────────────────────────────────────────────────────


class PaginatedCollections(FinanceDeskBaseModel):
    """分页回款列表。"""

    items: list[CollectionResponse]
    total: int
    page: int
    page_size: int


class PaginatedPayments(FinanceDeskBaseModel):
    """分页支付列表。"""

    items: list[PaymentResponse]
    total: int
    page: int
    page_size: int
