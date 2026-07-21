"""收入流水 / 成本流水 CRUD 路由（嵌套在订单下）。"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Collection, CostFlow, IncomeFlow, Order, Payment, Supplier
from app.utils.lifecycle import derive_income_status, derive_cost_status
from app.schemas.flow import (
    CostFlowCreate,
    CostFlowResponse,
    CostFlowUpdate,
    IncomeFlowCreate,
    IncomeFlowResponse,
    IncomeFlowUpdate,
    PaginatedCostFlows,
    PaginatedIncomeFlows,
)

router = APIRouter(prefix="/orders", tags=["flows"])


# ════════════════════════════════════════════════════════════════
# 通用：检查订单是否存在
# ════════════════════════════════════════════════════════════════


def _get_order_or_404(order_id: str, db: Session) -> Order:
    obj = db.get(Order, order_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "订单不存在")
    return obj


# ════════════════════════════════════════════════════════════════
# IncomeFlow CRUD（/orders/{oid}/incomes）
# ════════════════════════════════════════════════════════════════


@router.get(
    "/{order_id}/incomes",
    response_model=PaginatedIncomeFlows,
)
def list_income_flows(
    order_id: str,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=5000, description="每页条数"),
    db: Session = Depends(get_db),
):
    """获取指定订单的收入流水列表（支持分页）。"""
    _get_order_or_404(order_id, db)
    total = db.scalar(
        select(func.count())
        .select_from(IncomeFlow)
        .where(
            IncomeFlow.order_id == order_id,
            IncomeFlow.is_deleted == False,  # noqa: E712
        )
    )
    items = (
        db.execute(
            select(IncomeFlow)
            .where(
                IncomeFlow.order_id == order_id,
                IncomeFlow.is_deleted == False,  # noqa: E712
            )
            .order_by(IncomeFlow.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    result = []
    for f in items:
        d = {c.name: getattr(f, c.name) for c in f.__table__.columns}
        d["status"] = derive_income_status(f.id, db)
        result.append(d)
    return PaginatedIncomeFlows(
        items=[IncomeFlowResponse.model_validate(r) for r in result],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/{order_id}/incomes",
    response_model=IncomeFlowResponse,
    status_code=201,
)
def create_income_flow(
    order_id: str,
    body: IncomeFlowCreate,
    db: Session = Depends(get_db),
):
    """为指定订单创建收入流水。"""
    _get_order_or_404(order_id, db)
    obj = IncomeFlow(order_id=order_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return IncomeFlowResponse.model_validate(obj)


@router.get(
    "/{order_id}/incomes/{flow_id}",
    response_model=IncomeFlowResponse,
)
def get_income_flow(
    order_id: str,
    flow_id: str,
    db: Session = Depends(get_db),
):
    """获取指定订单的单条收入流水。"""
    _get_order_or_404(order_id, db)
    obj = db.get(IncomeFlow, flow_id)
    if not obj or obj.is_deleted or obj.order_id != order_id:
        raise HTTPException(404, "收入流水不存在")
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    d["status"] = derive_income_status(obj.id, db)
    return IncomeFlowResponse.model_validate(d)


@router.patch(
    "/{order_id}/incomes/{flow_id}",
    response_model=IncomeFlowResponse,
)
def update_income_flow(
    order_id: str,
    flow_id: str,
    body: IncomeFlowUpdate,
    db: Session = Depends(get_db),
):
    """更新指定订单的单条收入流水。"""
    _get_order_or_404(order_id, db)
    obj = db.get(IncomeFlow, flow_id)
    if not obj or obj.is_deleted or obj.order_id != order_id:
        raise HTTPException(404, "收入流水不存在")
    update_data = body.model_dump(exclude_unset=True)
    # BOS §3.3: 锁定字段 + status 仅允许系统推导
    LOCKED = {"order_id", "invoice_count"}
    for field in update_data:
        if field in LOCKED:
            raise HTTPException(422, f"字段 '{field}' 不可修改")
    if "status" in update_data and update_data["status"] not in (None, "红冲"):
        raise HTTPException(422, "状态仅允许系统推导")
    for field, value in update_data.items():
        if value is not None:
            setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return IncomeFlowResponse.model_validate(obj)


@router.delete(
    "/{order_id}/incomes/{flow_id}",
    status_code=204,
)
def delete_income_flow(
    order_id: str,
    flow_id: str,
    db: Session = Depends(get_db),
):
    """逻辑删除指定订单的单条收入流水。"""
    _get_order_or_404(order_id, db)
    obj = db.get(IncomeFlow, flow_id)
    if not obj or obj.is_deleted or obj.order_id != order_id:
        raise HTTPException(404, "收入流水不存在")
    # BOS §7.2: 检查 Collection 引用
    coll_count = db.scalar(
        select(func.count()).select_from(Collection)
        .where(Collection.flow_id == flow_id, Collection.is_deleted == False)
    ) or 0
    if coll_count > 0:
        raise HTTPException(409, f"该收入流水存在 {coll_count} 条回款记录，请先删除关联回款")
    # BOS §7.2: 检查 Payment 引用
    pay_count = db.scalar(
        select(func.count()).select_from(Payment)
        .where(Payment.cost_id == flow_id, Payment.is_deleted == False)
    ) or 0
    if pay_count > 0:
        raise HTTPException(409, f"该成本流水存在 {pay_count} 条付款记录，请先删除关联付款")
    obj.is_deleted = True
    obj.deleted_at = datetime.now(timezone.utc)
    db.commit()


# ════════════════════════════════════════════════════════════════
# CostFlow CRUD（/orders/{oid}/costs）
# ════════════════════════════════════════════════════════════════


def _enrich_cost_flow(d: dict, db) -> dict:
    """补充成本流水响应的 supplier_name。"""
    sup = db.get(Supplier, d.get("supplier_id"))
    d["supplier_name"] = sup.name if sup and not sup.is_deleted else None
    return d


@router.get(
    "/{order_id}/costs",
    response_model=PaginatedCostFlows,
)
def list_cost_flows(
    order_id: str,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=5000, description="每页条数"),
    db: Session = Depends(get_db),
):
    """获取指定订单的成本流水列表（支持分页）。"""
    _get_order_or_404(order_id, db)
    total = db.scalar(
        select(func.count())
        .select_from(CostFlow)
        .where(
            CostFlow.order_id == order_id,
            CostFlow.is_deleted == False,  # noqa: E712
        )
    )
    items = (
        db.execute(
            select(CostFlow)
            .where(
                CostFlow.order_id == order_id,
                CostFlow.is_deleted == False,  # noqa: E712
            )
            .order_by(CostFlow.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    result = []
    for f in items:
        d = {c.name: getattr(f, c.name) for c in f.__table__.columns}
        d["status"] = derive_cost_status(f.id, db)
        d = _enrich_cost_flow(d, db)
        result.append(d)
    return PaginatedCostFlows(
        items=[CostFlowResponse.model_validate(r) for r in result],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/{order_id}/costs",
    response_model=CostFlowResponse,
    status_code=201,
)
def create_cost_flow(
    order_id: str,
    body: CostFlowCreate,
    db: Session = Depends(get_db),
):
    """为指定订单创建成本流水。"""
    _get_order_or_404(order_id, db)
    if body.supplier_id is not None:
        sup = db.get(Supplier, body.supplier_id)
        if not sup or sup.is_deleted:
            raise HTTPException(404, "供应商不存在")
    obj = CostFlow(order_id=order_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    d["status"] = derive_cost_status(obj.id, db)
    d = _enrich_cost_flow(d, db)
    return CostFlowResponse.model_validate(d)


@router.get(
    "/{order_id}/costs/{flow_id}",
    response_model=CostFlowResponse,
)
def get_cost_flow(
    order_id: str,
    flow_id: str,
    db: Session = Depends(get_db),
):
    """获取指定订单的单条成本流水。"""
    _get_order_or_404(order_id, db)
    obj = db.get(CostFlow, flow_id)
    if not obj or obj.is_deleted or obj.order_id != order_id:
        raise HTTPException(404, "成本流水不存在")
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    d["status"] = derive_cost_status(obj.id, db)
    d = _enrich_cost_flow(d, db)
    return CostFlowResponse.model_validate(d)


@router.patch(
    "/{order_id}/costs/{flow_id}",
    response_model=CostFlowResponse,
)
def update_cost_flow(
    order_id: str,
    flow_id: str,
    body: CostFlowUpdate,
    db: Session = Depends(get_db),
):
    """更新指定订单的单条成本流水。"""
    _get_order_or_404(order_id, db)
    obj = db.get(CostFlow, flow_id)
    if not obj or obj.is_deleted or obj.order_id != order_id:
        raise HTTPException(404, "成本流水不存在")
    update_data = body.model_dump(exclude_unset=True)
    # BOS §3.3: 锁定字段 + status 仅允许系统推导
    LOCKED = {"order_id", "invoice_count"}
    for field in update_data:
        if field in LOCKED:
            raise HTTPException(422, f"字段 '{field}' 不可修改")
    if "status" in update_data and update_data["status"] not in (None, "红冲"):
        raise HTTPException(422, "状态仅允许系统推导")
    for field, value in update_data.items():
        if value is not None:
            setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    d["status"] = derive_cost_status(obj.id, db)
    d = _enrich_cost_flow(d, db)
    return CostFlowResponse.model_validate(d)


@router.delete(
    "/{order_id}/costs/{flow_id}",
    status_code=204,
)
def delete_cost_flow(
    order_id: str,
    flow_id: str,
    db: Session = Depends(get_db),
):
    """逻辑删除指定订单的单条成本流水。"""
    _get_order_or_404(order_id, db)
    obj = db.get(CostFlow, flow_id)
    if not obj or obj.is_deleted or obj.order_id != order_id:
        raise HTTPException(404, "成本流水不存在")
    # BOS §7.2: 检查 Collection 引用
    coll_count = db.scalar(
        select(func.count()).select_from(Collection)
        .where(Collection.flow_id == flow_id, Collection.is_deleted == False)
    ) or 0
    if coll_count > 0:
        raise HTTPException(409, f"该收入流水存在 {coll_count} 条回款记录，请先删除关联回款")
    # BOS §7.2: 检查 Payment 引用
    pay_count = db.scalar(
        select(func.count()).select_from(Payment)
        .where(Payment.cost_id == flow_id, Payment.is_deleted == False)
    ) or 0
    if pay_count > 0:
        raise HTTPException(409, f"该成本流水存在 {pay_count} 条付款记录，请先删除关联付款")
    obj.is_deleted = True
    obj.deleted_at = datetime.now(timezone.utc)
    db.commit()



# ── Standalone router for global flow lists (no /orders prefix) ──
global_flow_router = APIRouter(tags=["flows-global"])


@global_flow_router.get("/income-flows")
def list_all_income_flows(
    order_id: int | None = Query(None, description="按订单筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=5000, description="每页条数"),
    db: Session = Depends(get_db),
):
    base = select(IncomeFlow).where(IncomeFlow.is_deleted.is_(False))
    if order_id is not None:
        base = base.where(IncomeFlow.order_id == order_id)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.execute(
        base.order_by(IncomeFlow.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()
    result = []
    for f in items:
        d = {c.name: getattr(f, c.name) for c in f.__table__.columns}
        d["status"] = derive_income_status(f.id, db)
        result.append(d)
    return {"items": [IncomeFlowResponse.model_validate(r) for r in result],
            "total": total or 0, "page": page, "page_size": page_size}


@global_flow_router.get("/cost-flows")
def list_all_cost_flows(
    order_id: int | None = Query(None, description="按订单筛选"),
    supplier_id: int | None = Query(None, description="按供应商筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=5000, description="每页条数"),
    db: Session = Depends(get_db),
):
    base = select(CostFlow).where(CostFlow.is_deleted.is_(False))
    if order_id is not None:
        base = base.where(CostFlow.order_id == order_id)
    if supplier_id is not None:
        base = base.where(CostFlow.supplier_id == supplier_id)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.execute(
        base.order_by(CostFlow.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()
    result = []
    for f in items:
        d = {c.name: getattr(f, c.name) for c in f.__table__.columns}
        d["status"] = derive_cost_status(f.id, db)
        d = _enrich_cost_flow(d, db)
        result.append(d)
    return {"items": [CostFlowResponse.model_validate(r) for r in result],
            "total": total or 0, "page": page, "page_size": page_size}
