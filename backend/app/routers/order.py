"""
订单 CRUD 路由。
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Collection, CostFlow, IncomeFlow, Order, Payment, Project, Supplier
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderUpdate,
    PaginatedOrders,
)
from app.utils.audit import log_action

router = APIRouter(prefix="/orders", tags=["orders"])


# ════════════════════════════════════════════════════════════════
# 订单 CRUD
# ════════════════════════════════════════════════════════════════


@router.get("", response_model=PaginatedOrders)
def list_orders(
    project_id: str | None = Query(None, description="按项目 ID 筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=5000, description="每页条数"),
    db: Session = Depends(get_db),
):
    """获取订单列表（支持分页 + 按项目筛选，按创建时间倒序）。"""
    base = select(Order).where(Order.is_deleted == False)
    if project_id:
        base = base.where(Order.project_id == project_id)

    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = (
        db.execute(
            base.order_by(Order.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    # Enrich with project info
    result = []
    for o in items:
        d = {c.name: getattr(o, c.name) for c in o.__table__.columns}
        proj = db.get(Project, o.project_id) if o.project_id else None
        if proj:
            d["contract_name"] = proj.framework_name
            d["contract_type"] = proj.contract_type
        result.append(d)
    return PaginatedOrders(
        items=[OrderResponse.model_validate(r) for r in result],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(body: OrderCreate, db: Session = Depends(get_db)):
    """创建新订单。"""
    # ── 1. 校验 project_id ──
    project = db.get(Project, body.project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, f"项目不存在: {body.project_id}")

    # ── 2. 校验 supplier_id（可选）──
    if body.supplier_id is not None:
        supplier = db.get(Supplier, body.supplier_id)
        if not supplier or supplier.is_deleted:
            raise HTTPException(404, f"供应商不存在: {body.supplier_id}")

    # ── 3. 单项合同订单数量限制 ──
    if project.contract_type == "单项合同":
        existing_count = db.scalar(
            select(func.count()).select_from(Order)
            .where(Order.project_id == str(project.id), Order.is_deleted == False)
        )
        if existing_count and existing_count >= 1:
            raise HTTPException(422, "单项合同仅允许创建一个订单")

    # ── 4. 标准化 order_no（trim + upper）──
    raw_no = (body.order_no or "").strip().upper()
    if not raw_no:
        raise HTTPException(422, "订单编号不能为空")
    body.order_no = raw_no

    # ── 5. 自动推导 order_source ──
    order_source = project.contract_type  # "框架合同" or "单项合同"

    # ── 6. 兼容字段映射 ──
    data = body.model_dump()
    data["order_source"] = order_source
    if 'tax_inclusive_amount' in data and 'amount' not in data:
        data['amount'] = data.pop('tax_inclusive_amount')
    if data.get('customer_name') is None and 'party_a' in data:
        data['customer_name'] = data.pop('party_a')

    obj = Order(**data)
    db.add(obj)
    try:
        db.flush()
        log_action(db, "CREATE", "order", target_id=obj.id, target_name=obj.order_no)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"订单编号 '{raw_no}' 已存在，请使用不同的订单编号"
        )
    db.refresh(obj)
    return OrderResponse.model_validate(obj)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    """根据 ID 获取单个订单。"""
    obj = db.get(Order, order_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "订单不存在")
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    proj = db.get(Project, obj.project_id) if obj.project_id else None
    if proj:
        d["contract_name"] = proj.framework_name
        d["contract_type"] = proj.contract_type
    return OrderResponse.model_validate(d)


@router.patch("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: str,
    body: OrderUpdate,
    db: Session = Depends(get_db),
):
    """更新订单部分字段。"""
    obj = db.get(Order, order_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "订单不存在")

    if body.supplier_id is not None:
        supplier = db.get(Supplier, body.supplier_id)
        if not supplier or supplier.is_deleted:
            raise HTTPException(404, f"供应商不存在: {body.supplier_id}")

    update_data = body.model_dump(exclude_unset=True)

    # ── F4: 锁定字段校验（前端灰显 + 后端双重保护）──
    LOCKED_FIELDS = {"order_no", "project_id", "order_source", "erp_no", "amount", "contract_type"}
    for field in update_data:
        if field in LOCKED_FIELDS:
            raise HTTPException(422, f"字段 '{field}' 不可修改")

    # order_source 禁止人工修改
    if "order_source" in update_data:
        del update_data["order_source"]

    # status 仅允许→终止
    if "status" in update_data and update_data["status"] is not None and update_data["status"] != "终止":
        raise HTTPException(422, "状态仅允许系统推导或手动终止")

    for field, value in update_data.items():
        if value is not None:
            setattr(obj, field, value)
    log_action(db, "UPDATE", "order", target_id=obj.id, target_name=obj.order_no)
    db.commit()
    db.refresh(obj)
    return OrderResponse.model_validate(obj)


@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: str, db: Session = Depends(get_db)):
    """逻辑删除订单 — 禁止删除有流水记录的订单。"""
    obj = db.get(Order, order_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "订单不存在")

    # PS-005: 检查收入/成本/回款/付款引用
    income_count = db.scalar(
        select(func.count()).select_from(IncomeFlow)
        .where(IncomeFlow.order_id == order_id, IncomeFlow.is_deleted == False)
    ) or 0
    cost_count = db.scalar(
        select(func.count()).select_from(CostFlow)
        .where(CostFlow.order_id == order_id, CostFlow.is_deleted == False)
    ) or 0
    collection_count = db.scalar(
        select(func.count()).select_from(Collection)
        .join(IncomeFlow, Collection.flow_id == IncomeFlow.id)
        .where(IncomeFlow.order_id == order_id, Collection.is_deleted == False)
    ) or 0
    payment_count = db.scalar(
        select(func.count()).select_from(Payment)
        .join(CostFlow, Payment.cost_id == CostFlow.id)
        .where(CostFlow.order_id == order_id, Payment.is_deleted == False)
    ) or 0
    if income_count > 0 or cost_count > 0 or collection_count > 0 or payment_count > 0:
        parts = []
        if income_count > 0: parts.append(f"收入流水 {income_count} 条")
        if cost_count > 0: parts.append(f"成本流水 {cost_count} 条")
        if collection_count > 0: parts.append(f"回款 {collection_count} 笔")
        if payment_count > 0: parts.append(f"付款 {payment_count} 笔")
        raise HTTPException(409, f"该订单存在 {'、'.join(parts)}，禁止删除。请先将订单状态设为「已作废」")


    obj.is_deleted = True
    obj.deleted_at = datetime.now(timezone.utc)
    log_action(db, "DELETE", "order", target_id=obj.id, target_name=obj.order_no)
    db.commit()


@router.get("/{order_id}/summary")
def get_order_summary(order_id: str, db: Session = Depends(get_db)):
    """获取订单经营摘要 — 使用 Dashboard 统一聚合逻辑。"""
    from sqlalchemy import text as sa_text

    order = db.get(Order, order_id)
    if not order or order.is_deleted:
        raise HTTPException(404, "订单不存在")

    rows = db.execute(sa_text("""
        SELECT
            o.amount AS order_amount,
            COALESCE(inc.income_total, 0) AS income_total,
            COALESCE(col.collection_total, 0) AS collection_total,
            COALESCE(cst.cost_total, 0) AS cost_total,
            COALESCE(pmt.payment_total, 0) AS payment_total,
            COALESCE(inc.income_total, 0) - COALESCE(col.collection_total, 0) AS erp_gap,
            COALESCE(inc.income_total, 0) - COALESCE(cst.cost_total, 0) AS profit
        FROM "order" o
        LEFT JOIN (SELECT order_id, SUM(taxable_amount) AS income_total FROM income_flow WHERE is_deleted = 0 GROUP BY order_id) inc ON inc.order_id = o.id
        LEFT JOIN (SELECT i.order_id, SUM(c.amount) AS collection_total FROM collection c JOIN income_flow i ON i.id = c.flow_id AND i.is_deleted = 0 WHERE c.is_deleted = 0 GROUP BY i.order_id) col ON col.order_id = o.id
        LEFT JOIN (SELECT order_id, SUM(taxable_amount) AS cost_total FROM cost_flow WHERE is_deleted = 0 GROUP BY order_id) cst ON cst.order_id = o.id
        LEFT JOIN (SELECT co.order_id, SUM(p.amount) AS payment_total FROM payment p JOIN cost_flow co ON co.id = p.cost_id AND co.is_deleted = 0 WHERE p.is_deleted = 0 GROUP BY co.order_id) pmt ON pmt.order_id = o.id
        WHERE o.id = :oid AND o.is_deleted = 0
    """), {"oid": order_id}).mappings().all()

    if not rows:
        return {"order_amount": 0, "income_total": 0, "cost_total": 0, "profit": 0, "collection_total": 0, "payment_total": 0, "erp_gap": 0}
    return dict(rows[0])


@router.get("/{order_id}/next-action")
def get_order_next_action(order_id: str, db: Session = Depends(get_db)):
    """获取订单下一步动作（系统自动推导，禁止人工维护）。"""
    order = db.get(Order, order_id)
    if not order or order.is_deleted:
        raise HTTPException(404, "订单不存在")

    income_count = db.scalar(
        select(func.count()).select_from(IncomeFlow)
        .where(IncomeFlow.order_id == order_id, IncomeFlow.is_deleted == False)
    ) or 0
    cost_count = db.scalar(
        select(func.count()).select_from(CostFlow)
        .where(CostFlow.order_id == order_id, CostFlow.is_deleted == False)
    ) or 0
    income_total = db.scalar(
        select(func.coalesce(func.sum(IncomeFlow.taxable_amount), 0))
        .where(IncomeFlow.order_id == order_id, IncomeFlow.is_deleted == False)
    ) or 0
    cost_total = db.scalar(
        select(func.coalesce(func.sum(CostFlow.taxable_amount), 0))
        .where(CostFlow.order_id == order_id, CostFlow.is_deleted == False)
    ) or 0
    collection_total = db.scalar(
        select(func.coalesce(func.sum(Collection.amount), 0))
        .select_from(Collection).join(IncomeFlow, Collection.flow_id == IncomeFlow.id)
        .where(IncomeFlow.order_id == order_id, Collection.is_deleted == False)
    ) or 0
    payment_total = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .select_from(Payment).join(CostFlow, Payment.cost_id == CostFlow.id)
        .where(CostFlow.order_id == order_id, Payment.is_deleted == False)
    ) or 0

    if income_count == 0 and cost_count == 0:
        action, priority = "等待录收入 / 等待录成本", "P0"
    elif float(income_total) > float(collection_total) and float(collection_total) == 0:
        action, priority = "等待收款", "P0"
    elif float(cost_total) > float(payment_total) and float(payment_total) == 0:
        action, priority = "等待付款", "P0"
    elif float(income_total) > float(collection_total):
        action, priority = "继续收款", "P1"
    elif float(cost_total) > float(payment_total):
        action, priority = "继续安排付款", "P1"
    elif float(income_total) == float(collection_total) and float(cost_total) == float(payment_total):
        action, priority = "已完成", "DONE"
    else:
        action, priority = "需要人工核对", "P0"

    return {"order_id": int(order_id), "action": action, "priority": priority}
