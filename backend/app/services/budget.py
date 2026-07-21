"""
统一预算服务层 —— 所有预算调整均通过此模块创建，
确保每一笔变动都有明确的触发来源（source_type / source_id）。

使用示例:
    from app.services.budget import record_budget_adjustment

    # 从订单创建预算调整
    record_budget_adjustment(
        db, project_id="1",
        amount=Decimal("50000.00"),
        source_type="order",
        source_id=order.id,
        source_description=f"订单 {order.order_no}",
        adjustment_reason="新建订单自动调整",
    )
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.models import BudgetAdjustment, Order, IncomeFlow, CostFlow


# 合法的 source_type 取值
VALID_SOURCE_TYPES = {"order", "income_flow", "cost_flow", "manual"}


def record_budget_adjustment(
    db: Session,
    project_id: str,
    amount: Decimal | float,
    source_type: str = "manual",
    source_id: Optional[int] = None,
    source_description: Optional[str] = None,
    adjustment_reason: Optional[str] = None,
    adjustment_date: Optional[date] = None,
    remark: Optional[str] = None,
) -> BudgetAdjustment:
    """
    创建一笔预算调整记录，并校验 source 合法性。

    Args:
        db: SQLAlchemy Session
        project_id: 项目 ID（字符串）
        amount: 调整金额（正=调增，负=调减）
        source_type: 触发来源类型，支持 order / income_flow / cost_flow / manual
        source_id: 触发来源记录 ID（manual 可为 None）
        source_description: 可读描述（如 "订单 VERIFY-2026-001"）
        adjustment_reason: 调整原因
        adjustment_date: 调整日期，默认今天
        remark: 备注

    Returns:
        BudgetAdjustment ORM 实例（已 commit + refresh）

    Raises:
        ValueError: source_type 不合法或 source 记录不存在
    """
    # 校验 source_type
    if source_type not in VALID_SOURCE_TYPES:
        raise ValueError(f"不支持的 source_type: {source_type}，可用: {VALID_SOURCE_TYPES}")

    # 校验 source 存在（如果是自动类型）
    _validate_source_exists(db, source_type, source_id)

    # 构造调整记录
    obj = BudgetAdjustment(
        project_id=project_id,
        adjustment_amount=Decimal(str(amount)),
        adjustment_date=adjustment_date or date.today(),
        adjustment_reason=adjustment_reason,
        source_type=source_type,
        source_id=source_id,
        source_description=source_description,
        remark=remark,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def _validate_source_exists(db: Session, source_type: str, source_id: Optional[int]) -> None:
    """校验 source 记录在数据库中真实存在。"""
    if source_type == "manual":
        return  # 手动调整无需校验

    if source_id is None:
        raise ValueError(f"source_type={source_type} 时 source_id 不能为空")

    model_map = {
        "order": Order,
        "income_flow": IncomeFlow,
        "cost_flow": CostFlow,
    }
    model = model_map.get(source_type)
    if model is None:
        raise ValueError(f"不支持的 source_type: {source_type}")

    obj = db.get(model, source_id)
    if obj is None or (hasattr(obj, "is_deleted") and obj.is_deleted):
        raise ValueError(f"{source_type} id={source_id} 不存在或已被删除")
