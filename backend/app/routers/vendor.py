"""Supplier CRUD routes (merged from Vendor)."""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Supplier
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse, PaginatedVendors

router = APIRouter(prefix="/vendors", tags=["vendors"])


@router.get("", response_model=PaginatedVendors)
def list_vendors(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=5000), db: Session = Depends(get_db)):
    base = select(Supplier).where(Supplier.is_deleted.is_(False))
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.execute(base.order_by(Supplier.name).offset((page - 1) * page_size).limit(page_size)).scalars().all()
    return PaginatedVendors(items=[VendorResponse.model_validate(v) for v in items], total=total or 0, page=page, page_size=page_size)


@router.post("", response_model=VendorResponse, status_code=201)
def create_vendor(body: VendorCreate, db: Session = Depends(get_db)):
    obj = Supplier(name=body.name, framework_no="NEW-" + datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S"))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return VendorResponse.model_validate(obj)


@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: str, db: Session = Depends(get_db)):
    obj = db.get(Supplier, vendor_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "供应商不存在")
    return VendorResponse.model_validate(obj)


@router.patch("/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: str, body: VendorUpdate, db: Session = Depends(get_db)):
    obj = db.get(Supplier, vendor_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "供应商不存在")
    for f, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return VendorResponse.model_validate(obj)


@router.delete("/{vendor_id}", status_code=204)
def delete_vendor(vendor_id: str, db: Session = Depends(get_db)):
    obj = db.get(Supplier, vendor_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "供应商不存在")
    obj.is_deleted = True
    if hasattr(obj, "deleted_at"):
        obj.deleted_at = datetime.now(timezone.utc)
    db.commit()
