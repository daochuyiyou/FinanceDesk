"""
Developer Tools — 级联数据清理工具。
仅限 DEV_MODE=true 环境使用。禁止在正式发布环境启用。
"""
from __future__ import annotations
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    BudgetAdjustment, Collection, CostFlow, IncomeFlow, Order,
    Payment, Project, ProjectBudget
)
from app.utils.audit import log_action

DEV_MODE = os.environ.get("DEV_MODE", "").lower() in ("true", "1", "yes")
router = APIRouter(prefix="/dev", tags=["developer-tools"])

def _gate():
    if not DEV_MODE:
        raise HTTPException(403, "DEV_MODE required")

class CascadePreviewItem(BaseModel):
    table: str
    count: int

class CascadePreviewResponse(BaseModel):
    project_id: str
    project_name: str
    total_records: int
    items: list[CascadePreviewItem]

class CascadeExecuteResponse(BaseModel):
    project_id: str
    deleted: dict[str, int]
    success: bool

def _pid_cond(model, pid):
    if model == Payment:     return Payment.id == CostFlow.id, CostFlow.order_id == Order.id, Order.project_id == pid
    if model == Collection:  return Collection.flow_id == IncomeFlow.id, IncomeFlow.order_id == Order.id, Order.project_id == pid
    if model == CostFlow:    return CostFlow.order_id == Order.id, Order.project_id == pid
    if model == IncomeFlow:  return IncomeFlow.order_id == Order.id, Order.project_id == pid
    if model == Order:       return (Order.project_id == pid,)
    if model == BudgetAdjustment: return (BudgetAdjustment.project_id == pid,)
    if model == ProjectBudget:    return (ProjectBudget.project_id == pid,)
    return ()

def _count(db, model, pid):
    conds = _pid_cond(model, pid)
    if not conds:
        return 0
    q = select(func.count()).select_from(model)
    for c in conds:
        q = q.where(c)
    return db.scalar(q) or 0

CASCADE_TABLES = [
    ("payment", Payment), ("collection", Collection),
    ("cost_flow", CostFlow), ("income_flow", IncomeFlow),
    ("order", Order),
    ("budget_adjustment", BudgetAdjustment), ("project_budget", ProjectBudget),
]

@router.get("/cascade-preview", response_model=CascadePreviewResponse)
def cascade_preview(project_id: str = Query(...), db: Session = Depends(get_db)):
    _gate()
    proj = db.get(Project, project_id)
    if not proj or proj.is_deleted:
        raise HTTPException(404, "项目不存在")
    items = []
    total = 0
    for name, model in CASCADE_TABLES:
        c = _count(db, model, project_id)
        if c > 0:
            items.append(CascadePreviewItem(table=name, count=c))
            total += c
    return CascadePreviewResponse(
        project_id=project_id,
        project_name=proj.framework_name or proj.contract_no or "",
        total_records=total,
        items=list(reversed(items)),
    )

@router.delete("/cascade-delete", response_model=CascadeExecuteResponse)
def cascade_delete(project_id: str = Query(...), confirm: bool = Query(False), db: Session = Depends(get_db)):
    _gate()
    if not confirm:
        raise HTTPException(400, "set ?confirm=true")
    proj = db.get(Project, project_id)
    if not proj or proj.is_deleted:
        raise HTTPException(404, "项目不存在")
    deleted = {}
    try:
        for name, model in CASCADE_TABLES:
            ids = []
            if model == Payment:
                ids = list(db.execute(select(Payment.id).join(CostFlow).join(Order).where(Order.project_id == project_id)).scalars().all())
            elif model == Collection:
                ids = list(db.execute(select(Collection.id).join(IncomeFlow).join(Order).where(Order.project_id == project_id)).scalars().all())
            elif model == CostFlow:
                ids = list(db.execute(select(CostFlow.id).join(Order).where(Order.project_id == project_id)).scalars().all())
            elif model == IncomeFlow:
                ids = list(db.execute(select(IncomeFlow.id).join(Order).where(Order.project_id == project_id)).scalars().all())
            elif model == Order:
                ids = list(db.execute(select(Order.id).where(Order.project_id == project_id)).scalars().all())
            elif model == BudgetAdjustment:
                ids = list(db.execute(select(BudgetAdjustment.id).where(BudgetAdjustment.project_id == project_id)).scalars().all())
            elif model == ProjectBudget:
                ids = list(db.execute(select(ProjectBudget.id).where(ProjectBudget.project_id == project_id)).scalars().all())
            n = 0
            for pk in ids:
                obj = db.get(model, pk)
                if obj: setattr(obj, "is_deleted", True); n += 1
            if n: deleted[name] = n
            db.flush()
        db.execute(Project.__table__.update().where(Project.id == project_id).values(is_deleted=True))
        deleted["project"] = 1
        db.commit()
        log_action(db, action_type="CASCADE_DELETE", entity_type="Project",
                   entity_id=project_id, detail=f"cascade delete project")
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"cascade delete failed: {e}")
    return CascadeExecuteResponse(project_id=project_id, deleted=deleted, success=True)
