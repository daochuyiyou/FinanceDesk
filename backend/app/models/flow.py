"""收入流水 / 成本流水模型（取代旧版 IncomeStream / CostStream）。"""
from __future__ import annotations

from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from ..database import HermesBaseModel


class IncomeFlow(HermesBaseModel):
    """收入流水表 —— 记录按订单维度的开票收入明细。"""

    __tablename__ = "income_flow"

    order_id = Column(
        String(36),
        ForeignKey("order.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="订单 ID（外键 → order.id）",
    )
    invoice_count = Column(
        Integer,
        nullable=False,
        default=1,
        comment="开票次数",
    )
    tax_rate = Column(
        Numeric(5, 2),
        nullable=True,
        comment="税率（百分比，如 9.0 表示 9%）",
    )
    taxable_amount = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.0,
        comment="开票金额含税（元）",
    )
    non_taxable_amount = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.0,
        comment="开票金额不含税（元）",
    )
    invoice_date = Column(
        Date,
        nullable=True,
        comment="开票时间",
    )
    invoice_no = Column(
        String(200),
        nullable=True,
        comment="发票号码",
    )
    invoice_stage = Column(
        String(50),
        nullable=True,
        comment="开票阶段（初验/终验/审计/月度/一次性/其他）",
    )
    invoice_reason = Column(
        String(50),
        nullable=True,
        comment="开票原因（正常开票/补开发票/红冲/审减/设计变更/其他）",
    )
    business_date = Column(
        Date,
        nullable=True,
        comment="经营发生日期（≠ invoice_date）",
    )
    expected_collection_date = Column(
        Date,
        nullable=True,
        comment="预计回款日期",
    )
    business_owner = Column(
        String(100),
        nullable=True,
        comment="经营责任人",
    )
    remark = Column(
        Text,
        nullable=True,
        comment="备注",
    )
    status = Column(
        String(50),
        nullable=False,
        default="待回款",
        comment="状态（系统推导，不落库于人工维护）",
    )

    # ── ORM 关系 ──────────────────────────────────────────────
    order = relationship("Order", back_populates="income_flows")
    collections = relationship(
        "Collection",
        back_populates="income_flow",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<IncomeFlow order={self.order_id} invoice={self.invoice_no}>"


class CostFlow(HermesBaseModel):
    """成本流水表 —— 记录按订单维度的成本支出明细。"""

    __tablename__ = "cost_flow"

    order_id = Column(
        String(36),
        ForeignKey("order.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="订单 ID（外键 → order.id）",
    )
    cost_party = Column(
        String(200),
        nullable=True,
        comment="成本方（供应商 / 个人 / 内部等）",
    )
    supplier_id = Column(
        Integer,
        ForeignKey("supplier.id", ondelete="RESTRICT"),
        nullable=False,
        comment="关联供应商 ID（外键 → supplier.id，防误删）",
    )
    cost_type = Column(
        String(100),
        nullable=False,
        default="其他",
        comment="成本类型（如：施工费 / 材料费 / 管理费等）",
    )
    tax_rate = Column(
        Numeric(5, 2),
        nullable=True,
        comment="税率（百分比，如 9.0 表示 9%）",
    )
    taxable_amount = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.0,
        comment="成本金额含税（元）",
    )
    non_taxable_amount = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.0,
        comment="成本金额不含税（元）",
    )
    cost_subject = Column(
        String(200),
        nullable=True,
        comment="成本科目",
    )
    budget_item = Column(
        String(200),
        nullable=True,
        comment="对应预算项",
    )
    cost_stage = Column(
        String(50),
        nullable=True,
        comment="成本阶段（镜像 invoice_stage）",
    )
    cost_reason = Column(
        String(50),
        nullable=True,
        comment="成本原因（镜像 invoice_reason）",
    )
    business_date = Column(
        Date,
        nullable=True,
        comment="经营发生日期（镜像 Revenue）",
    )
    expected_payment_date = Column(
        Date,
        nullable=True,
        comment="预计付款日期（镜像 expected_collection_date）",
    )
    business_owner = Column(
        String(100),
        nullable=True,
        comment="经营责任人（镜像 Revenue）",
    )
    remark = Column(
        Text,
        nullable=True,
        comment="备注",
    )
    status = Column(
        String(50),
        nullable=False,
        default="待支付",
        comment="状态（系统推导，禁止人工维护）",
    )

    # ── ORM 关系 ──────────────────────────────────────────────
    order = relationship("Order", back_populates="cost_flows")
    payments = relationship(
        "Payment",
        back_populates="cost_flow",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<CostFlow order={self.order_id} type={self.cost_type}>"
