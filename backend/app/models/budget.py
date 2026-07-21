"""预算调整模型 — BudgetAdjustment，支持 Source 追溯。"""

from __future__ import annotations

from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from ..database import HermesBaseModel


class BudgetAdjustment(HermesBaseModel):
    """预算调整表 —— 记录项目预算的历次调整明细，每一笔均可追溯触发来源。"""

    __tablename__ = "budget_adjustment"

    project_id = Column(
        String(36),
        ForeignKey("project.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="项目 ID（外键 → project.id）",
    )
    adjustment_date = Column(
        Date,
        nullable=True,
        comment="调整日期",
    )
    adjustment_reason = Column(
        String(500),
        nullable=True,
        comment="调整原因",
    )
    adjustment_amount = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.0,
        comment="调整金额（元，正数=调增，负数=调减）",
    )
    source_type = Column(
        String(50),
        nullable=True,
        comment="触发来源类型: order / income_flow / cost_flow / manual",
    )
    source_id = Column(
        Integer,
        nullable=True,
        comment="触发来源记录 ID",
    )
    source_description = Column(
        String(500),
        nullable=True,
        comment="可读的触发来源描述（如 '订单 VERIFY-2026-001'）",
    )
    remark = Column(
        Text,
        nullable=True,
        comment="备注",
    )

    # ── ORM 关系 ──────────────────────────────────────────────
    project = relationship("Project", back_populates="budget_adjustments")

    def __repr__(self) -> str:
        return f"<BudgetAdjustment project={self.project_id} amount={self.adjustment_amount}>"
