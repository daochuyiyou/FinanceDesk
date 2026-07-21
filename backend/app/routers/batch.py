"""批量操作路由 —— 对所有模块提供批量删除和批量更新状态接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CostFlow, IncomeFlow, Order, Project, Supplier

router = APIRouter(prefix="/api/v1/batch", tags=["批量操作"])


class BatchIds(BaseModel):
    ids: list[int]


class BatchDeleteResponse(BaseModel):
    deleted: int
    total: int

class BatchUpdateResponse(BaseModel):
    updated: int
    total: int

class BatchStatus(BatchIds):
    status: str


# 各模块的模型映射
MODEL_MAP = {
    "projects": Project,
    "suppliers": Supplier,
    "orders": Order,
    "income-flows": IncomeFlow,
    "cost-flows": CostFlow,
}

# 有 status 字段的模块
STATUS_MODULES = {"orders", "income-flows", "cost-flows"}


@router.delete("/{module}", response_model=BatchDeleteResponse)
def batch_delete(module: str, body: BatchIds, db: Session = Depends(get_db)):
    model = MODEL_MAP.get(module)
    if not model:
        raise HTTPException(404, f"未知模块: {module}")
    if not body.ids:
        raise HTTPException(400, "请选择要删除的数据")
    cnt = 0
    for mid in body.ids:
        obj = db.get(model, mid)
        if obj and not obj.is_deleted:
            obj.is_deleted = True
            cnt += 1
    db.commit()
    return {"deleted": cnt, "total": len(body.ids)}


@router.patch("/{module}/status", response_model=BatchUpdateResponse)
def batch_update_status(module: str, body: BatchStatus, db: Session = Depends(get_db)):
    model = MODEL_MAP.get(module)
    if not model:
        raise HTTPException(404, f"未知模块: {module}")
    if module not in STATUS_MODULES:
        raise HTTPException(400, f"{module} 不支持批量更新状态")
    if not body.ids:
        raise HTTPException(400, "请选择要更新的数据")
    if not body.status:
        raise HTTPException(400, "请指定目标状态")
    cnt = db.execute(
        update(model)
        .where(model.id.in_(body.ids), model.is_deleted == False)
        .values(status=body.status)
    ).rowcount
    db.commit()
    return {"updated": cnt, "total": len(body.ids)}
