"""
合同中心 CRUD 路由（Project + ProjectBudget）。
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, Project, ProjectBudget
from app.schemas.order import OrderResponse
from app.utils.contract_status import derive_contract_status, TERMINATED
from app.schemas.project import (
    PaginatedProjectBudgets,
    PaginatedProjects,
    ProjectBudgetCreate,
    ProjectBudgetResponse,
    ProjectBudgetUpdate,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


# ════════════════════════════════════════════════════════════════
# 合同 CRUD
# ════════════════════════════════════════════════════════════════


@router.get("", response_model=PaginatedProjects)
def list_projects(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=5000, description="每页条数"),
    db: Session = Depends(get_db),
):
    """获取合同列表（支持分页，按创建时间倒序，包含订单金额合计和订单数量）。"""
    total = db.scalar(
        select(func.count()).select_from(Project).where(Project.is_deleted == False)
    )
    items = (
        db.execute(
            select(Project)
            .where(Project.is_deleted == False)
            .order_by(Project.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    project_ids = [p.id for p in items]
    order_data = {}
    if project_ids:
        rows = db.execute(
            select(
                Order.project_id,
                func.sum(Order.amount).label("total_amount"),
                func.count(Order.id).label("order_count"),
            )
            .where(Order.project_id.in_([str(pid) for pid in project_ids]), Order.is_deleted == False)
            .group_by(Order.project_id)
        ).all()
        for r in rows:
            order_data[r[0]] = {
                "total_order_amount": float(r[1] or 0),
                "order_count": r[2] or 0,
            }
    result = []
    for p in items:
        d = {c.name: getattr(p, c.name) for c in p.__table__.columns}
        od = order_data.get(str(p.id), {})
        d["total_order_amount"] = od.get("total_order_amount", 0)
        d["order_count"] = od.get("order_count", 0)
        # 状态推导（非终止状态覆盖）
        if d.get("status") != TERMINATED:
            d["status"] = derive_contract_status(p.id, db)
        result.append(d)
    return {"items": result, "total": total or 0, "page": page, "page_size": page_size}


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(body: ProjectCreate, db: Session = Depends(get_db)):
    """创建新合同。"""
    # ── H2: 校验 contract_no 唯一性（标准化：trim + upper）──
    raw_no = (body.contract_no or '').strip().upper()
    if raw_no:
        existing = db.execute(
            select(Project).where(Project.contract_no == raw_no)
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(409, f"合同编号已存在: {raw_no}")
    body.contract_no = raw_no if raw_no else body.contract_no

    obj = Project(**body.model_dump())
    db.add(obj)
    try:
        db.commit()
        db.refresh(obj)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "合同编号冲突，请重试")
    return ProjectResponse.model_validate(obj)


@router.get("/next-contract-no")
def generate_next_contract_no():
    """生成下一个合同编号（预留接口，当前返回 None）。"""
    return {"next_contract_no": None}


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """根据 ID 获取单个合同。"""
    obj = db.get(Project, project_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "合同不存在")
    # 状态推导（非终止不覆盖）
    if obj.status != TERMINATED:
        obj.status = derive_contract_status(obj.id, db)
    return ProjectResponse.model_validate(obj)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str, body: ProjectUpdate, db: Session = Depends(get_db)
):
    """更新合同部分字段。"""
    obj = db.get(Project, project_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "合同不存在")
    # status: 仅允许手动终止（其他状态由系统推导）
    update_data = body.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] != "终止":
        raise HTTPException(422, "合同状态仅允许系统推导或手动终止")
    for field, value in update_data.items():
        if value is not None:
            setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return ProjectResponse.model_validate(obj)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    """逻辑删除合同 — 有关联订单时拒绝删除。"""
    obj = db.get(Project, project_id)
    if not obj or obj.is_deleted:
        raise HTTPException(404, "合同不存在")
    # PS-005: 检查是否有订单引用
    from sqlalchemy import func, select
    from app.models import Order
    order_count = db.scalar(
        select(func.count()).select_from(Order)
        .where(Order.project_id == project_id, Order.is_deleted == False)
    ) or 0
    if order_count > 0:
        raise HTTPException(409, f"该合同存在 {order_count} 个关联订单，禁止删除")
    obj.is_deleted = True
    obj.deleted_at = datetime.now(timezone.utc)
    db.commit()


# ════════════════════════════════════════════════════════════════
# H3: 合同编号生成（预留接口，当前返回 None）
# ════════════════════════════════════════════════════════════════

@router.get("/next-contract-no")
def generate_next_contract_no():
    """生成下一个合同编号（预留接口，当前返回 None）。"""
    return {"next_contract_no": None}

# ════════════════════════════════════════════════════════════════
# 项目预算 CRUD
# ════════════════════════════════════════════════════════════════


@router.get("/{project_id}/budgets", response_model=PaginatedProjectBudgets)
def list_project_budgets(
    project_id: str,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=5000, description="每页条数"),
    db: Session = Depends(get_db),
):
    """获取指定合同项的预算列表（支持分页）。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "合同不存在")
    total = db.scalar(
        select(func.count())
        .select_from(ProjectBudget)
        .where(
            ProjectBudget.project_id == project_id,
            ProjectBudget.is_deleted == False,
        )
    )
    items = (
        db.execute(
            select(ProjectBudget)
            .where(
                ProjectBudget.project_id == project_id,
                ProjectBudget.is_deleted == False,
            )
            .order_by(ProjectBudget.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return PaginatedProjectBudgets(
        items=[ProjectBudgetResponse.model_validate(b) for b in items],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/{project_id}/budgets",
    response_model=ProjectBudgetResponse,
    status_code=201,
)
def create_project_budget(
    project_id: str,
    body: ProjectBudgetCreate,
    db: Session = Depends(get_db),
):
    """为指定合同创建预算记录。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "合同不存在")
    obj = ProjectBudget(project_id=project_id, **body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return ProjectBudgetResponse.model_validate(obj)


@router.get(
    "/{project_id}/budgets/{budget_id}",
    response_model=ProjectBudgetResponse,
)
def get_project_budget(
    project_id: str,
    budget_id: str,
    db: Session = Depends(get_db),
):
    """获取指定合同的单条预算。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "合同不存在")
    obj = db.get(ProjectBudget, budget_id)
    if not obj or obj.is_deleted or obj.project_id != project_id:
        raise HTTPException(404, "预算记录不存在")
    return ProjectBudgetResponse.model_validate(obj)


@router.patch(
    "/{project_id}/budgets/{budget_id}",
    response_model=ProjectBudgetResponse,
)
def update_project_budget(
    project_id: str,
    budget_id: str,
    body: ProjectBudgetUpdate,
    db: Session = Depends(get_db),
):
    """更新指定合同的单条预算。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "合同不存在")
    obj = db.get(ProjectBudget, budget_id)
    if not obj or obj.is_deleted or obj.project_id != project_id:
        raise HTTPException(404, "预算记录不存在")
    for field, value in body.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return ProjectBudgetResponse.model_validate(obj)


@router.delete(
    "/{project_id}/budgets/{budget_id}",
    status_code=204,
)
def delete_project_budget(
    project_id: str,
    budget_id: str,
    db: Session = Depends(get_db),
):
    """逻辑删除指定合同的单条预算。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "合同不存在")
    obj = db.get(ProjectBudget, budget_id)
    if not obj or obj.is_deleted or obj.project_id != project_id:
        raise HTTPException(404, "预算记录不存在")
    obj.is_deleted = True
    obj.deleted_at = datetime.now(timezone.utc)
    db.commit()


# ════════════════════════════════════════════════════════════════
# 合同项下的订单
# ════════════════════════════════════════════════════════════════


@router.get("/{project_id}/orders", response_model=list[OrderResponse])
def list_project_orders(project_id: str, db: Session = Depends(get_db)):
    """根据合同 ID 获取该合同的所有关联订单。"""
    project = db.get(Project, project_id)
    if not project or project.is_deleted:
        raise HTTPException(404, "合同不存在")
    rows = (
        db.execute(
            select(Order)
            .where(
                Order.project_id == project_id,
                Order.is_deleted == False,
            )
            .order_by(Order.created_at.desc())
        )
        .scalars()
        .all()
    )
    return [OrderResponse.model_validate(r) for r in rows]
