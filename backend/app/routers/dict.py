"""系统字典 CRUD + 按分类查询 + auto-create 新值。"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SysDictionary
from app.schemas.dict import (
    SysDictCreate,
    SysDictUpdate,
    SysDictListResponse,
    SysDictResponse,
    SysDictCategoryResponse,
)

categories_router = APIRouter(prefix="/dict-categories", tags=["系统字典"])
router = APIRouter(prefix="/dict", tags=["系统字典"])


@categories_router.get("", response_model=List[SysDictCategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """获取所有字典分类（去重），返回分类名、标签和条目数。"""
    # 查询所有未删除的字典项，按 category 分组统计
    result = db.execute(
        select(
            SysDictionary.category,
            func.count(SysDictionary.id).label("item_count"),
        )
        .where(SysDictionary.is_deleted == False)
        .group_by(SysDictionary.category)
        .order_by(SysDictionary.category.asc())
    ).all()

    categories = []
    for row in result:
        # 使用 category 值作为 label（因为没有单独的 label 字段）
        categories.append(
            SysDictCategoryResponse(
                category=row.category,
                label=row.category,  # 简化处理，使用 category 作为 label
                count=row.item_count,
            )
        )
    return categories


@router.get("/{category}", response_model=SysDictListResponse)
def list_dict(category: str, db: Session = Depends(get_db)):
    """按分类获取所有字典项。"""
    items = (
        db.execute(
            select(SysDictionary)
            .where(
                SysDictionary.category == category,
                SysDictionary.is_deleted == False,
            )
            .order_by(SysDictionary.sort_order.asc(), SysDictionary.value.asc())
        )
        .scalars()
        .all()
    )
    return SysDictListResponse(
        items=[SysDictResponse.model_validate(i) for i in items],
        total=len(items),
    )


@router.post("/{category}", response_model=SysDictResponse, status_code=201)
def create_dict_item(category: str, body: SysDictCreate, db: Session = Depends(get_db)):
    """新增字典项。如已存在同 category+value 则直接返回。"""
    if body.category != category:
        raise HTTPException(400, "路径 category 与请求体不一致")

    existing = db.execute(
        select(SysDictionary).where(
            SysDictionary.category == category,
            SysDictionary.value == body.value,
            SysDictionary.is_deleted == False,
        )
    ).scalar_one_or_none()
    if existing:
        return SysDictResponse.model_validate(existing)

    obj = SysDictionary(**body.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return SysDictResponse.model_validate(obj)


@router.put("/{category}/{dict_id}", response_model=SysDictResponse)
def update_dict_item(
    category: str,
    dict_id: int,
    body: SysDictUpdate,
    db: Session = Depends(get_db),
):
    """更新字典条目。"""
    obj = db.get(SysDictionary, dict_id)
    if not obj or obj.is_deleted or obj.category != category:
        raise HTTPException(404, "字典项不存在")

    # 检查 value 是否与其他条目冲突
    if body.value and body.value != obj.value:
        conflict = db.execute(
            select(SysDictionary).where(
                SysDictionary.category == category,
                SysDictionary.value == body.value,
                SysDictionary.id != dict_id,
                SysDictionary.is_deleted == False,
            )
        ).scalar_one_or_none()
        if conflict:
            raise HTTPException(400, f"值 '{body.value}' 在该分类下已存在")

    # 更新字段
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(obj, field, value)

    db.commit()
    db.refresh(obj)
    return SysDictResponse.model_validate(obj)


@router.post("/{category}/ensure", response_model=SysDictResponse, status_code=201)
def ensure_dict_item(category: str, body: SysDictCreate, db: Session = Depends(get_db)):
    """确保字典项存在（不存在则创建），用于前端自动扩充。"""
    return create_dict_item(category, body, db)


@router.delete("/{category}/{dict_id}", status_code=204)
def delete_dict_item(category: str, dict_id: int, db: Session = Depends(get_db)):
    """逻辑删除字典项。"""
    obj = db.get(SysDictionary, dict_id)
    if not obj or obj.is_deleted or obj.category != category:
        raise HTTPException(404, "字典项不存在")
    obj.is_deleted = True
    db.commit()
