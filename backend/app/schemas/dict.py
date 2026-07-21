from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from app.schemas.base import FinanceDeskBaseModel


class SysDictCreate(FinanceDeskBaseModel):
    category: str = Field(..., max_length=100)
    value: str = Field(..., max_length=100)
    label: Optional[str] = Field(None, max_length=200)
    sort_order: Optional[int] = None


class SysDictUpdate(FinanceDeskBaseModel):
    category: Optional[str] = Field(None, max_length=100)
    value: Optional[str] = Field(None, max_length=100)
    label: Optional[str] = Field(None, max_length=200)
    sort_order: Optional[int] = None


class SysDictResponse(FinanceDeskBaseModel):
    id: int
    category: str
    value: str
    label: Optional[str] = None
    sort_order: Optional[int] = None


class SysDictCategoryResponse(FinanceDeskBaseModel):
    category: str
    label: str
    count: int


class SysDictListResponse(FinanceDeskBaseModel):
    items: List[SysDictResponse]
    total: int
