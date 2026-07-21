"""供应商合同 CRUD 路由。"""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SupplierContract
from app.schemas.supplier_contract import (
    SupplierContractCreate, SupplierContractUpdate,
    SupplierContractResponse, PaginatedSupplierContracts,
)

router = APIRouter(prefix="/supplier-contracts", tags=["supplier-contracts"])


@router.get("", response_model=PaginatedSupplierContracts)
def list_contracts(
    supplier_id: int | None = Query(None, description="按供应商筛选"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    base = select(SupplierContract).where(SupplierContract.is_deleted.is_(False))
    if supplier_id is not None:
        base = base.where(SupplierContract.supplier_id == supplier_id)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.execute(
        base.order_by(SupplierContract.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()
    return PaginatedSupplierContracts(
        items=[SupplierContractResponse.model_validate(c) for c in items],
        total=total or 0, page=page, page_size=page_size,
    )


@router.post("", response_model=SupplierContractResponse, status_code=201)
def create_contract(body: SupplierContractCreate, db: Session = Depends(get_db)):
    obj = SupplierContract(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return SupplierContractResponse.model_validate(obj)


@router.get("/{contract_id}", response_model=SupplierContractResponse)
def get_contract(contract_id: str, db: Session = Depends(get_db)):
    obj = db.get(SupplierContract, contract_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "合同不存在")
    return SupplierContractResponse.model_validate(obj)


@router.patch("/{contract_id}", response_model=SupplierContractResponse)
def update_contract(contract_id: str, body: SupplierContractUpdate, db: Session = Depends(get_db)):
    obj = db.get(SupplierContract, contract_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "合同不存在")
    for f, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, f, v)
    db.commit()
    db.refresh(obj)
    return SupplierContractResponse.model_validate(obj)


@router.delete("/{contract_id}", status_code=204)
def delete_contract(contract_id: str, db: Session = Depends(get_db)):
    obj = db.get(SupplierContract, contract_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "合同不存在")
    obj.is_deleted = True
    db.commit()
