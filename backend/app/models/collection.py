"""回款表 / 支付表模型。"""
from __future__ import annotations

from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import relationship

from ..database import HermesBaseModel


class Collection(HermesBaseModel):
    """回款表 —— 关联收入流水的每笔实际收款记录。"""

    __tablename__ = "collection"

    flow_id = Column(
        String(36),
        ForeignKey("income_flow.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="收入流水 ID（外键 → income_flow.id）",
    )
    collection_date = Column(
        Date,
        nullable=True,
        comment="回款日期",
    )
    amount = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.0,
        comment="回款金额（元）",
    )
    receipt_no = Column(
        String(200),
        nullable=True,
        comment="收款凭证号",
    )

    # ── ORM 关系 ──────────────────────────────────────────────
    income_flow = relationship("IncomeFlow", back_populates="collections")

    def __repr__(self) -> str:
        return f"<Collection flow={self.flow_id} amount={self.amount}>"


class Payment(HermesBaseModel):
    """支付表 —— 关联成本流水的每笔实际付款记录。"""

    __tablename__ = "payment"

    cost_id = Column(
        String(36),
        ForeignKey("cost_flow.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="成本流水 ID（外键 → cost_flow.id）",
    )
    payment_date = Column(
        Date,
        nullable=True,
        comment="支付日期",
    )
    payee = Column(
        String(200),
        nullable=True,
        comment="支付对象",
    )
    voucher_no = Column(
        String(200),
        nullable=True,
        comment="支付凭证",
    )
    amount = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.0,
        comment="支付金额（元）",
    )

    # ── ORM 关系 ──────────────────────────────────────────────
    cost_flow = relationship("CostFlow", back_populates="payments")

    def __repr__(self) -> str:
        return f"<Payment cost={self.cost_id} amount={self.amount}>"
