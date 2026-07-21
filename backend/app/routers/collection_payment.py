"""回款 / 支付 CRUD 路由。"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Collection, CostFlow, IncomeFlow, Payment, Supplier
from app.schemas.collection_payment import (
    CollectionCreate,
    CollectionResponse,
    CollectionUpdate,
    PaginatedCollections,
    PaginatedPayments,
    PaymentCreate,
    PaymentResponse,
    PaymentUpdate,
)

collection_router = APIRouter(prefix="/collection", tags=["collections"])
payment_router = APIRouter(prefix="/payment", tags=["payments"])


# ================================================================
# Collection CRUD
# ================================================================


@collection_router.get(
    "/{order_id}/incomes/{flow_id}",
    response_model=PaginatedCollections,
)
def list_collections(
    order_id: str,
    flow_id: str,
    page: int = Query(1, ge=1, description="page"),
    page_size: int = Query(20, ge=1, le=5000, description="page size"),
    db: Session = Depends(get_db),
):
    flow = db.get(IncomeFlow, flow_id)
    if not flow or flow.is_deleted or flow.order_id != order_id:
        raise HTTPException(404, "income flow not found")
    total = db.scalar(
        select(func.count())
        .select_from(Collection)
        .where(Collection.flow_id == flow_id, Collection.is_deleted.is_(False))
    )
    items = (
        db.execute(
            select(Collection)
            .where(Collection.flow_id == flow_id, Collection.is_deleted.is_(False))
            .order_by(Collection.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return PaginatedCollections(
        items=[CollectionResponse.model_validate(c) for c in items],
        total=total or 0, page=page, page_size=page_size,
    )


@collection_router.post(
    "/{order_id}/incomes/{flow_id}",
    response_model=CollectionResponse,
    status_code=201,
)
def create_collection(order_id: str, flow_id: str, body: CollectionCreate, db: Session = Depends(get_db)):
    flow = db.get(IncomeFlow, flow_id)
    if not flow or flow.is_deleted or flow.order_id != order_id:
        raise HTTPException(404, "income flow not found")
    obj = Collection(flow_id=flow_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return CollectionResponse.model_validate(obj)


@collection_router.get(
    "/{order_id}/incomes/{flow_id}/{collection_id}",
    response_model=CollectionResponse,
)
def get_collection(order_id: str, flow_id: str, collection_id: str, db: Session = Depends(get_db)):
    flow = db.get(IncomeFlow, flow_id)
    if not flow or flow.is_deleted or flow.order_id != order_id:
        raise HTTPException(404, "income flow not found")
    obj = db.get(Collection, collection_id)
    if not obj or obj.is_deleted or obj.flow_id != flow_id:
        raise HTTPException(404, "collection not found")
    return CollectionResponse.model_validate(obj)


@collection_router.patch(
    "/{order_id}/incomes/{flow_id}/{collection_id}",
    response_model=CollectionResponse,
)
def update_collection(order_id: str, flow_id: str, collection_id: str, body: CollectionUpdate, db: Session = Depends(get_db)):
    flow = db.get(IncomeFlow, flow_id)
    if not flow or flow.is_deleted or flow.order_id != order_id:
        raise HTTPException(404, "income flow not found")
    obj = db.get(Collection, collection_id)
    if not obj or obj.is_deleted or obj.flow_id != flow_id:
        raise HTTPException(404, "collection not found")
    update_data = body.model_dump(exclude_unset=True)
    LOCKED = {"flow_id"}
    for field in update_data:
        if field in LOCKED:
            raise HTTPException(422, f"字段 '{field}' 不可修改")
    for field, value in update_data.items():
        if value is not None:
            setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return CollectionResponse.model_validate(obj)


@collection_router.delete(
    "/{order_id}/incomes/{flow_id}/{collection_id}",
    status_code=204,
)
def delete_collection(order_id: str, flow_id: str, collection_id: str, db: Session = Depends(get_db)):
    flow = db.get(IncomeFlow, flow_id)
    if not flow or flow.is_deleted or flow.order_id != order_id:
        raise HTTPException(404, "income flow not found")
    obj = db.get(Collection, collection_id)
    if not obj or obj.is_deleted or obj.flow_id != flow_id:
        raise HTTPException(404, "collection not found")
    obj.is_deleted = True
    obj.deleted_at = datetime.now(timezone.utc)
    db.commit()


# ================================================================
# Payment CRUD
# ================================================================


@payment_router.get(
    "/{order_id}/costs/{flow_id}",
    response_model=PaginatedPayments,
)
def list_payments(
    order_id: str,
    flow_id: str,
    page: int = Query(1, ge=1, description="page"),
    page_size: int = Query(20, ge=1, le=5000, description="page size"),
    db: Session = Depends(get_db),
):
    flow = db.get(CostFlow, flow_id)
    if not flow or flow.is_deleted or flow.order_id != order_id:
        raise HTTPException(404, "cost flow not found")
    total = db.scalar(
        select(func.count())
        .select_from(Payment)
        .where(Payment.cost_id == flow_id, Payment.is_deleted.is_(False))
    )
    items = (
        db.execute(
            select(Payment)
            .where(Payment.cost_id == flow_id, Payment.is_deleted.is_(False))
            .order_by(Payment.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return PaginatedPayments(
        items=[PaymentResponse.model_validate(p) for p in items],
        total=total or 0, page=page, page_size=page_size,
    )


@payment_router.post(
    "/{order_id}/costs/{flow_id}",
    response_model=PaymentResponse,
    status_code=201,
)
def create_payment(order_id: str, flow_id: str, body: PaymentCreate, db: Session = Depends(get_db)):
    flow = db.get(CostFlow, flow_id)
    if not flow or flow.is_deleted or flow.order_id != order_id:
        raise HTTPException(404, "cost flow not found")
    # 自动从成本流水关联的供应商填充 payee
    supplier_name = None
    if flow.supplier_id:
        sup = db.get(Supplier, flow.supplier_id)
        if sup and not sup.is_deleted:
            supplier_name = sup.name
    data = body.model_dump()
    data["payee"] = data.get("payee") or supplier_name
    obj = Payment(cost_id=flow_id, **data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return PaymentResponse.model_validate(obj)


@payment_router.get(
    "/{order_id}/costs/{flow_id}/{payment_id}",
    response_model=PaymentResponse,
)
def get_payment(order_id: str, flow_id: str, payment_id: str, db: Session = Depends(get_db)):
    flow = db.get(CostFlow, flow_id)
    if not flow or flow.is_deleted or flow.order_id != order_id:
        raise HTTPException(404, "cost flow not found")
    obj = db.get(Payment, payment_id)
    if not obj or obj.is_deleted or obj.cost_id != flow_id:
        raise HTTPException(404, "payment not found")
    return PaymentResponse.model_validate(obj)


@payment_router.patch(
    "/{order_id}/costs/{flow_id}/{payment_id}",
    response_model=PaymentResponse,
)
def update_payment(order_id: str, flow_id: str, payment_id: str, body: PaymentUpdate, db: Session = Depends(get_db)):
    flow = db.get(CostFlow, flow_id)
    if not flow or flow.is_deleted or flow.order_id != order_id:
        raise HTTPException(404, "cost flow not found")
    obj = db.get(Payment, payment_id)
    if not obj or obj.is_deleted or obj.cost_id != flow_id:
        raise HTTPException(404, "payment not found")
    update_data = body.model_dump(exclude_unset=True)
    LOCKED = {"cost_id"}
    for field in update_data:
        if field in LOCKED:
            raise HTTPException(422, f"字段 '{field}' 不可修改")
    for field, value in update_data.items():
        if value is not None:
            setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return PaymentResponse.model_validate(obj)


@payment_router.delete(
    "/{order_id}/costs/{flow_id}/{payment_id}",
    status_code=204,
)
def delete_payment(order_id: str, flow_id: str, payment_id: str, db: Session = Depends(get_db)):
    flow = db.get(CostFlow, flow_id)
    if not flow or flow.is_deleted or flow.order_id != order_id:
        raise HTTPException(404, "cost flow not found")
    obj = db.get(Payment, payment_id)
    if not obj or obj.is_deleted or obj.cost_id != flow_id:
        raise HTTPException(404, "payment not found")
    obj.is_deleted = True
    obj.deleted_at = datetime.now(timezone.utc)
    db.commit()


# ── Global list endpoints ──

# ── Standalone routers for global list endpoints ──
global_coll_router = APIRouter(tags=["collections-global"])
global_pay_router = APIRouter(tags=["payments-global"])


@global_coll_router.get("/collections")
def list_all_collections(
    order_id: int | None = Query(None, description="按订单筛选"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    base = select(Collection).where(Collection.is_deleted.is_(False))
    if order_id is not None:
        base = base.join(IncomeFlow).where(IncomeFlow.order_id == str(order_id))
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.execute(base.order_by(Collection.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).scalars().all()
    result = []
    for item in items:
        inc = db.get(IncomeFlow, item.flow_id)
        tc = db.scalar(select(func.coalesce(func.sum(Collection.amount), 0)).where(Collection.flow_id == item.flow_id, Collection.is_deleted.is_(False))) or 0
        d = {c.name: getattr(item, c.name) for c in item.__table__.columns}
        d["remaining_amount"] = max(0, float(inc.taxable_amount or 0) - float(tc)) if inc else 0
        result.append(d)
    return {"items": result, "total": total or 0, "page": page, "page_size": page_size}


@global_pay_router.get("/payments")
def list_all_payments(
    order_id: int | None = Query(None, description="按订单筛选"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    base = select(Payment).where(Payment.is_deleted.is_(False))
    if order_id is not None:
        base = base.join(CostFlow).where(CostFlow.order_id == str(order_id))
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.execute(base.order_by(Payment.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).scalars().all()
    result = []
    for item in items:
        cost = db.get(CostFlow, item.cost_id)
        tp = db.scalar(select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.cost_id == item.cost_id, Payment.is_deleted.is_(False))) or 0
        d = {c.name: getattr(item, c.name) for c in item.__table__.columns}
        d["remaining_amount"] = max(0, float(cost.taxable_amount or 0) - float(tp)) if cost else 0
        result.append(d)
    return {"items": result, "total": total or 0, "page": page, "page_size": page_size}
