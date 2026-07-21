"""Business Search — 统一业务查询 API（BDD-02B F5）。

支持合同维度 + 订单维度多条件 AND 查询。
禁止各模块自行实现不同查询逻辑。
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project, Order
from app.schemas.project import ProjectResponse
from app.schemas.order import OrderResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/business")
def business_search(
    # ── 合同维度 ──
    contract_no: Optional[str] = Query(None, description="合同编号精确匹配"),
    contract_name: Optional[str] = Query(None, description="合同名称模糊匹配"),
    owner_name: Optional[str] = Query(None, description="业主单位模糊匹配"),
    contract_type: Optional[str] = Query(None, description="合同类型"),
    contract_year: Optional[int] = Query(None, description="所属年度"),
    contract_status: Optional[str] = Query(None, description="合同状态"),
    # ── 订单维度 ──
    order_no: Optional[str] = Query(None, description="订单编号精确匹配"),
    order_name: Optional[str] = Query(None, description="订单名称模糊匹配"),
    owner_project_name: Optional[str] = Query(None, description="甲方项目名称"),
    owner_project_no: Optional[str] = Query(None, description="甲方项目编号"),
    order_source: Optional[str] = Query(None, description="订单来源"),
    # ── 页码 ──
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    """统一业务查询：同时搜索合同和订单，支持多维度 AND 组合。"""

    # ── 合同查询 ──
    proj_query = select(Project).where(Project.is_deleted == False)
    if contract_no:
        proj_query = proj_query.where(Project.contract_no == contract_no)
    if contract_name:
        proj_query = proj_query.where(Project.framework_name.ilike(f"%{contract_name}%"))
    if owner_name:
        proj_query = proj_query.where(Project.owner_name.ilike(f"%{owner_name}%"))
    if contract_type:
        proj_query = proj_query.where(Project.contract_type == contract_type)
    if contract_year:
        proj_query = proj_query.where(Project.contract_year == contract_year)
    if contract_status:
        proj_query = proj_query.where(Project.status == contract_status)

    proj_total = db.scalar(select(func.count()).select_from(proj_query.subquery()))
    proj_items = db.execute(
        proj_query.order_by(Project.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()

    # ── 订单查询 ──
    order_query = select(Order).where(Order.is_deleted == False)
    if order_no:
        order_query = order_query.where(Order.order_no == order_no)
    if order_name:
        order_query = order_query.where(Order.order_name.ilike(f"%{order_name}%"))
    if owner_project_name:
        order_query = order_query.where(Order.owner_project_name.ilike(f"%{owner_project_name}%"))
    if owner_project_no:
        order_query = order_query.where(Order.owner_project_no == owner_project_no)
    if order_source:
        order_query = order_query.where(Order.order_source == order_source)
    # 如果传了合同维度筛选条件，联表过滤
    if contract_no or contract_name or owner_name or contract_type or contract_year or contract_status:
        proj_sub = select(Project.id).where(Project.is_deleted == False)
        if contract_no:
            proj_sub = proj_sub.where(Project.contract_no == contract_no)
        if contract_name:
            proj_sub = proj_sub.where(Project.framework_name.ilike(f"%{contract_name}%"))
        if owner_name:
            proj_sub = proj_sub.where(Project.owner_name.ilike(f"%{owner_name}%"))
        if contract_type:
            proj_sub = proj_sub.where(Project.contract_type == contract_type)
        if contract_year:
            proj_sub = proj_sub.where(Project.contract_year == contract_year)
        if contract_status:
            proj_sub = proj_sub.where(Project.status == contract_status)
        order_query = order_query.where(Order.project_id.in_(proj_sub.subquery()))

    order_total = db.scalar(select(func.count()).select_from(order_query.subquery()))
    order_items = db.execute(
        order_query.order_by(Order.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()

    # ── 组装结果 ──
    return {
        "contracts": {
            "items": [ProjectResponse.model_validate(p) for p in proj_items],
            "total": proj_total or 0,
        },
        "orders": {
            "items": [OrderResponse.model_validate(o) for o in order_items],
            "total": order_total or 0,
        },
        "page": page,
        "page_size": page_size,
    }
