"""合同状态推导工具。

状态机：
  待执行 ──(首单创建)──→ 执行中 ──(全部订单完成)──→ 已完成
     │                     │
     └──(手动终止)─────────┴──(手动终止)─────────→ 终止
"""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Order

# 终止状态——手动设置，系统不自动覆盖
TERMINATED = "终止"
# 系统推导状态
PENDING = "待执行"
IN_PROGRESS = "执行中"
COMPLETED = "已完成"


def derive_contract_status(project_id: int, db: Session) -> str:
    """根据项目下所有订单状态推导合同状态。

    规则：
    - 没有订单 → 待执行
    - 有任意订单状态为 执行中/待执行 → 执行中
    - 所有订单已完成或已作废 → 已完成
    """
    order_statuses = db.execute(
        select(Order.status).where(
            Order.project_id == str(project_id),
            Order.is_deleted == False,
        )
    ).scalars().all()

    if not order_statuses:
        return PENDING

    # 有任意订单处于未完成状态
    if any(s in (IN_PROGRESS, PENDING) for s in order_statuses if s):
        return IN_PROGRESS

    # 所有订单已完成或已作废
    all_finished = all(
        s in (COMPLETED, "已作废") for s in order_statuses if s
    )
    return COMPLETED if all_finished else PENDING
