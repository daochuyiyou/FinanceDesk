"""预算调整 Pydantic v2 校验与响应模型（含 Source 追溯）。"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


class BudgetAdjustmentCreate(FinanceDeskBaseModel):
    """创建预算调整请求体。"""

    adjustment_date: Optional[date] = Field(None, description="调整日期")
    adjustment_reason: Optional[str] = Field(
        None, max_length=500, description="调整原因"
    )
    adjustment_amount: Decimal = Field(
        ..., ge=-1_000_000_000, le=1_000_000_000, decimal_places=2,
        description="调整金额（元）",
    )
    source_type: Optional[str] = Field(
        None, max_length=50, description="触发来源类型: order / income_flow / cost_flow / manual",
    )
    source_id: Optional[int] = Field(
        None, description="触发来源记录 ID",
    )
    source_description: Optional[str] = Field(
        None, max_length=500, description="可读触发来源描述",
    )
    remark: Optional[str] = Field(None, description="备注")


class BudgetAdjustmentUpdate(FinanceDeskBaseModel):
    """更新预算调整请求体（所有字段可选）。"""

    adjustment_date: Optional[date] = None
    adjustment_reason: Optional[str] = Field(None, max_length=500)
    adjustment_amount: Optional[Decimal] = Field(None, ge=-1_000_000_000, le=1_000_000_000, decimal_places=2)
    source_type: Optional[str] = Field(None, max_length=50)
    source_id: Optional[int] = None
    source_description: Optional[str] = Field(None, max_length=500)
    remark: Optional[str] = None


class BudgetAdjustmentResponse(FinanceDeskBaseModel):
    """预算调整标准响应体。"""


    id: int
    project_id: str
    adjustment_date: Optional[date] = None
    adjustment_reason: Optional[str] = None
    adjustment_amount: Decimal
    source_type: Optional[str] = None
    source_id: Optional[int] = None
    source_description: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool


class PaginatedBudgetAdjustments(FinanceDeskBaseModel):
    """分页预算调整列表。"""

    items: list[BudgetAdjustmentResponse]
    total: int
    page: int
    page_size: int
