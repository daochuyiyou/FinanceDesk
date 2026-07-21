"""审计日志查询路由。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit_log import AuditLog
from pydantic import BaseModel
from datetime import datetime

class AuditLogItem(BaseModel):
    id: int
    username: str
    action: str
    module: str
    target_id: int | None = None
    target_name: str | None = None
    changes: str | None = None
    ip_address: str | None = None
    created_at: str

class AuditLogPage(BaseModel):
    items: list[AuditLogItem]
    total: int
    page: int
    page_size: int

router = APIRouter(prefix="/api/v1/audit-logs", tags=["审计日志"])


@router.get("", response_model=AuditLogPage)
def list_audit_logs(
    module: str | None = Query(None, description="按模块筛选"),
    action: str | None = Query(None, description="按操作类型筛选"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    base = select(AuditLog).where(AuditLog.is_deleted.is_(False))
    if module:
        base = base.where(AuditLog.module == module)
    if action:
        base = base.where(AuditLog.action == action)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.execute(
        base.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()
    return {
        "items": [{
            "id": log.id,
            "username": log.username,
            "action": log.action,
            "module": log.module,
            "target_id": log.target_id,
            "target_name": log.target_name,
            "changes": log.changes,
            "ip_address": log.ip_address,
            "created_at": str(log.created_at),
        } for log in items],
        "total": total or 0,
        "page": page,
        "page_size": page_size,
    }
