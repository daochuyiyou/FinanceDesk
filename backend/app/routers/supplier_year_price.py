"""供应商年度单价 CRUD 路由（嵌套在供应商下）。"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Supplier, SupplierYearPrice
from app.schemas.supplier_year_price import (
    PaginatedSupplierYearPrices,
    SupplierYearPriceCreate,
    SupplierYearPriceResponse,
    SupplierYearPriceUpdate,
)

router = APIRouter(prefix="/vendors", tags=["supplier-year-prices"])


def _get_supplier_or_404(supplier_id: str, db: Session) -> Supplier:
    obj = db.get(Supplier, supplier_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "供应商不存在")
    return obj


@router.get("/{vendor_id}/year-prices", response_model=PaginatedSupplierYearPrices)
def list_supplier_year_prices(
    vendor_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    _get_supplier_or_404(vendor_id, db)
    base = select(SupplierYearPrice).where(
        SupplierYearPrice.supplier_id == vendor_id,
        SupplierYearPrice.is_deleted.is_(False),
    )
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.execute(
        base.order_by(SupplierYearPrice.year.desc().nullslast(), SupplierYearPrice.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    return PaginatedSupplierYearPrices(
        items=[SupplierYearPriceResponse.model_validate(p) for p in items],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("/{vendor_id}/year-prices", response_model=SupplierYearPriceResponse, status_code=201)
def create_supplier_year_price(
    vendor_id: str, body: SupplierYearPriceCreate, db: Session = Depends(get_db),
):
    _get_supplier_or_404(vendor_id, db)
    obj = SupplierYearPrice(supplier_id=vendor_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return SupplierYearPriceResponse.model_validate(obj)


@router.get("/{vendor_id}/year-prices/{price_id}", response_model=SupplierYearPriceResponse)
def get_supplier_year_price(vendor_id: str, price_id: str, db: Session = Depends(get_db)):
    _get_supplier_or_404(vendor_id, db)
    obj = db.get(SupplierYearPrice, price_id)
    if not obj or obj.is_deleted or obj.supplier_id != vendor_id:
        raise HTTPException(404, "供应商年度单价不存在")
    return SupplierYearPriceResponse.model_validate(obj)


@router.patch("/{vendor_id}/year-prices/{price_id}", response_model=SupplierYearPriceResponse)
def update_supplier_year_price(
    vendor_id: str, price_id: str, body: SupplierYearPriceUpdate, db: Session = Depends(get_db),
):
    _get_supplier_or_404(vendor_id, db)
    obj = db.get(SupplierYearPrice, price_id)
    if not obj or obj.is_deleted or obj.supplier_id != vendor_id:
        raise HTTPException(404, "供应商年度单价不存在")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return SupplierYearPriceResponse.model_validate(obj)


@router.delete("/{vendor_id}/year-prices/{price_id}", status_code=204)
def delete_supplier_year_price(vendor_id: str, price_id: str, db: Session = Depends(get_db)):
    _get_supplier_or_404(vendor_id, db)
    obj = db.get(SupplierYearPrice, price_id)
    if not obj or obj.is_deleted or obj.supplier_id != vendor_id:
        raise HTTPException(404, "供应商年度单价不存在")
    obj.is_deleted = True
    if hasattr(obj, "deleted_at"):
        obj.deleted_at = datetime.now(timezone.utc)
    db.commit()
