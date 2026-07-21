"""供应商 CRUD 路由。"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Supplier, SupplierPrice
from app.schemas.supplier import (
    PaginatedSuppliers,
    PaginatedSupplierPrices,
    SupplierCreate,
    SupplierPriceCreate,
    SupplierPriceResponse,
    SupplierPriceUpdate,
    SupplierResponse,
    SupplierUpdate,
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


# ════════════════════════════════════════════════════════════════
# 供应商 CRUD
# ════════════════════════════════════════════════════════════════


@router.get("", response_model=PaginatedSuppliers)
def list_suppliers(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=5000, description="每页条数"),
    db: Session = Depends(get_db),
):
    """获取供应商列表（支持分页，按创建时间倒序）。"""
    total = db.scalar(
        select(func.count()).select_from(Supplier).where(Supplier.is_deleted == False)  # noqa: E712
    )
    items = (
        db.execute(
            select(Supplier)
            .where(Supplier.is_deleted == False)  # noqa: E712
            .order_by(Supplier.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return PaginatedSuppliers(
        items=[SupplierResponse.model_validate(s) for s in items],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=SupplierResponse, status_code=201)
def create_supplier(body: SupplierCreate, db: Session = Depends(get_db)):
    """创建新供应商。"""
    obj = Supplier(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return SupplierResponse.model_validate(obj)


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: str, db: Session = Depends(get_db)):
    """根据 ID 获取单个供应商。"""
    obj = db.get(Supplier, supplier_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "供应商不存在")
    return SupplierResponse.model_validate(obj)


@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: str, body: SupplierUpdate, db: Session = Depends(get_db)
):
    """更新供应商部分字段。"""
    obj = db.get(Supplier, supplier_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "供应商不存在")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return SupplierResponse.model_validate(obj)


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: str, db: Session = Depends(get_db)):
    """逻辑删除供应商。"""
    obj = db.get(Supplier, supplier_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "供应商不存在")
    obj.is_deleted = True
    obj.deleted_at = datetime.now(timezone.utc)
    db.commit()


# ════════════════════════════════════════════════════════════════
# 辅助函数
# ════════════════════════════════════════════════════════════════


def _get_supplier_or_404(supplier_id: str, db: Session) -> Supplier:
    """校验 supplier_id 存在且未被逻辑删除。"""
    obj = db.get(Supplier, supplier_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "供应商不存在")
    return obj


# ════════════════════════════════════════════════════════════════
# 供应商单价 CRUD（嵌套路由 /suppliers/{sid}/prices）
# ════════════════════════════════════════════════════════════════


@router.get("/{supplier_id}/prices", response_model=PaginatedSupplierPrices)
def list_supplier_prices(
    supplier_id: str,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=5000, description="每页条数"),
    db: Session = Depends(get_db),
):
    """获取指定供应商的单价列表（分页）。"""
    _get_supplier_or_404(supplier_id, db)
    base = select(SupplierPrice).where(
        SupplierPrice.supplier_id == supplier_id,
        SupplierPrice.is_deleted.is_(False),
    )
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = (
        db.execute(
            base.order_by(SupplierPrice.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return PaginatedSupplierPrices(
        items=[SupplierPriceResponse.model_validate(p) for p in items],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.post("/{supplier_id}/prices", response_model=SupplierPriceResponse, status_code=201)
def create_supplier_price(
    supplier_id: str,
    body: SupplierPriceCreate,
    db: Session = Depends(get_db),
):
    """为指定供应商创建单价。"""
    _get_supplier_or_404(supplier_id, db)
    obj = SupplierPrice(supplier_id=supplier_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return SupplierPriceResponse.model_validate(obj)


@router.get("/{supplier_id}/prices/{price_id}", response_model=SupplierPriceResponse)
def get_supplier_price(
    supplier_id: str,
    price_id: str,
    db: Session = Depends(get_db),
):
    """获取指定供应商的单个单价详情。"""
    _get_supplier_or_404(supplier_id, db)
    obj = db.get(SupplierPrice, price_id)
    if not obj or obj.is_deleted or obj.supplier_id != supplier_id:
        raise HTTPException(404, "供应商单价不存在")
    return SupplierPriceResponse.model_validate(obj)


@router.patch("/{supplier_id}/prices/{price_id}", response_model=SupplierPriceResponse)
def update_supplier_price(
    supplier_id: str,
    price_id: str,
    body: SupplierPriceUpdate,
    db: Session = Depends(get_db),
):
    """更新指定供应商的单价（支持置空字段）。"""
    _get_supplier_or_404(supplier_id, db)
    obj = db.get(SupplierPrice, price_id)
    if not obj or obj.is_deleted or obj.supplier_id != supplier_id:
        raise HTTPException(404, "供应商单价不存在")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return SupplierPriceResponse.model_validate(obj)


@router.delete("/{supplier_id}/prices/{price_id}", status_code=204)
def delete_supplier_price(
    supplier_id: str,
    price_id: str,
    db: Session = Depends(get_db),
):
    """逻辑删除指定供应商的单价。"""
    _get_supplier_or_404(supplier_id, db)
    obj = db.get(SupplierPrice, price_id)
    if not obj or obj.is_deleted or obj.supplier_id != supplier_id:
        raise HTTPException(404, "供应商单价不存在")
    obj.is_deleted = True
    if hasattr(obj, "deleted_at"):
        obj.deleted_at = datetime.now(timezone.utc)
    db.commit()
