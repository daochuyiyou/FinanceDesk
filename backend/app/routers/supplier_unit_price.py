"""供应商工种单价 CRUD 路由。"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SupplierUnitPrice
from app.schemas.supplier_unit_price import (
    SupplierUnitPriceCreate, SupplierUnitPriceUpdate,
    SupplierUnitPriceResponse, PaginatedSupplierUnitPrices,
)

router = APIRouter(prefix="/supplier-unit-prices", tags=["supplier-unit-prices"])


@router.get("", response_model=PaginatedSupplierUnitPrices)
def list_unit_prices(
    supplier_id: int | None = Query(None, description="按供应商筛选"),
    year: int | None = Query(None, description="按年度筛选"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    base = select(SupplierUnitPrice).where(SupplierUnitPrice.is_deleted.is_(False))
    if supplier_id is not None:
        base = base.where(SupplierUnitPrice.supplier_id == supplier_id)
    if year is not None:
        base = base.where(SupplierUnitPrice.year == year)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.execute(
        base.order_by(SupplierUnitPrice.year.desc())
        .offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()
    return PaginatedSupplierUnitPrices(
        items=[SupplierUnitPriceResponse.model_validate(p) for p in items],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("", response_model=SupplierUnitPriceResponse, status_code=201)
def create_unit_price(body: SupplierUnitPriceCreate, db: Session = Depends(get_db)):
    obj = SupplierUnitPrice(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return SupplierUnitPriceResponse.model_validate(obj)


@router.get("/{price_id}", response_model=SupplierUnitPriceResponse)
def get_unit_price(price_id: str, db: Session = Depends(get_db)):
    obj = db.get(SupplierUnitPrice, price_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "单价记录不存在")
    return SupplierUnitPriceResponse.model_validate(obj)


@router.patch("/{price_id}", response_model=SupplierUnitPriceResponse)
def update_unit_price(price_id: str, body: SupplierUnitPriceUpdate, db: Session = Depends(get_db)):
    obj = db.get(SupplierUnitPrice, price_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "单价记录不存在")
    for f, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return SupplierUnitPriceResponse.model_validate(obj)


@router.delete("/{price_id}", status_code=204)
def delete_unit_price(price_id: str, db: Session = Depends(get_db)):
    obj = db.get(SupplierUnitPrice, price_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "单价记录不存在")
    obj.is_deleted = True
    db.commit()
