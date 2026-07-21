"""预算调整 CRUD 路由（含项目的预算调整子路由），使用统一服务层。"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BudgetAdjustment, Project
from app.schemas.budget import (
    BudgetAdjustmentCreate,
    BudgetAdjustmentResponse,
    BudgetAdjustmentUpdate,
    PaginatedBudgetAdjustments,
)
from app.services.budget import record_budget_adjustment

router = APIRouter(prefix="/projects", tags=["budget-adjustments"])


@router.get(
    "/{project_id}/adjustments",
    response_model=PaginatedBudgetAdjustments,
)
def list_budget_adjustments(
    project_id: str,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=5000, description="每页条数"),
    db: Session = Depends(get_db),
):
    """获取指定项目的预算调整列表（支持分页）。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "项目不存在")
    total = db.scalar(
        select(func.count())
        .select_from(BudgetAdjustment)
        .where(
            BudgetAdjustment.project_id == project_id,
            BudgetAdjustment.is_deleted == False,  # noqa: E712
        )
    )
    items = (
        db.execute(
            select(BudgetAdjustment)
            .where(
                BudgetAdjustment.project_id == project_id,
                BudgetAdjustment.is_deleted == False,  # noqa: E712
            )
            .order_by(BudgetAdjustment.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return PaginatedBudgetAdjustments(
        items=[BudgetAdjustmentResponse.model_validate(b) for b in items],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/{project_id}/adjustments",
    response_model=BudgetAdjustmentResponse,
    status_code=201,
)
def create_budget_adjustment(
    project_id: str,
    body: BudgetAdjustmentCreate,
    db: Session = Depends(get_db),
):
    """为指定项目创建预算调整记录（通过统一服务层）。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "项目不存在")
    try:
        obj = record_budget_adjustment(
            db=db,
            project_id=project_id,
            amount=body.adjustment_amount,
            source_type=body.source_type or "manual",
            source_id=body.source_id,
            source_description=body.source_description,
            adjustment_reason=body.adjustment_reason,
            adjustment_date=body.adjustment_date,
            remark=body.remark,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    return BudgetAdjustmentResponse.model_validate(obj)


@router.get(
    "/{project_id}/adjustments/{adjustment_id}",
    response_model=BudgetAdjustmentResponse,
)
def get_budget_adjustment(
    project_id: str,
    adjustment_id: str,
    db: Session = Depends(get_db),
):
    """获取指定项目的单条预算调整记录。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "项目不存在")
    obj = db.get(BudgetAdjustment, adjustment_id)
    if not obj or obj.is_deleted or obj.project_id != project_id:
        raise HTTPException(404, "预算调整记录不存在")
    return BudgetAdjustmentResponse.model_validate(obj)


@router.patch(
    "/{project_id}/adjustments/{adjustment_id}",
    response_model=BudgetAdjustmentResponse,
)
def update_budget_adjustment(
    project_id: str,
    adjustment_id: str,
    body: BudgetAdjustmentUpdate,
    db: Session = Depends(get_db),
):
    """更新指定项目的单条预算调整记录。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "项目不存在")
    obj = db.get(BudgetAdjustment, adjustment_id)
    if not obj or obj.is_deleted or obj.project_id != project_id:
        raise HTTPException(404, "预算调整记录不存在")
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return BudgetAdjustmentResponse.model_validate(obj)


@router.delete(
    "/{project_id}/adjustments/{adjustment_id}",
    status_code=204,
)
def delete_budget_adjustment(
    project_id: str,
    adjustment_id: str,
    db: Session = Depends(get_db),
):
    """逻辑删除指定项目的单条预算调整记录。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "项目不存在")
    obj = db.get(BudgetAdjustment, adjustment_id)
    if not obj or obj.is_deleted or obj.project_id != project_id:
        raise HTTPException(404, "预算调整记录不存在")
    obj.is_deleted = True
    obj.deleted_at = datetime.now(timezone.utc)
    db.commit()
