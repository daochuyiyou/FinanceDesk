"""订单模型。"""
from __future__ import annotations

from sqlalchemy import Column, Date, ForeignKey, Numeric, String
from sqlalchemy.orm import relationship

from ..database import HermesBaseModel


class Order(HermesBaseModel):
    """订单表 — 唯一经营结算单元（R001）。"""

    __tablename__ = "order"

    project_id = Column(
        String(36),
        ForeignKey("project.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="关联 Project.id（物理外键）",
    )
    supplier_id = Column(
        String(36),
        ForeignKey("supplier.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
        comment="关联 Supplier.id（物理外键）",
    )
    order_no = Column(
        String(100),
        nullable=False,
        unique=True,
        comment="甲方订单编号（ERP 按此匹配，禁止自动生成）",
    )
    order_source = Column(
        String(20),
        nullable=True,
        comment="订单来源：自动推导（框架合同/单项合同），禁止人工修改",
    )
    order_name = Column(
        String(200),
        nullable=True,
        comment="订单名称",
    )
    customer_name = Column(
        String(200),
        nullable=True,
        comment="甲方单位名称",
    )
    owner_project_name = Column(
        String(200),
        nullable=True,
        comment="甲方项目名称（仅归属信息，不建立立项模块）",
    )
    owner_project_no = Column(
        String(100),
        nullable=True,
        comment="甲方项目编号（可选）",
    )
    order_date = Column(
        Date,
        nullable=True,
        comment="生成订单日期",
    )
    amount = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.0,
        comment="订单金额含税（元）",
    )
    non_tax_amount = Column(
        Numeric(15, 2),
        nullable=True,
        default=0.0,
        comment="订单金额不含税（元）",
    )
    erp_no = Column(
        String(100),
        nullable=True,
        comment="智慧工程ERP项目编号",
    )
    mobile_project_no = Column(
        String(100),
        nullable=True,
        comment="移动项目编号",
    )
    order_type = Column(
        String(50),
        nullable=True,
        comment="订单类型（工程施工/维护服务/设备采购/其他）",
    )
    mobile_contact = Column(
        String(100),
        nullable=True,
        comment="移动对接人",
    )
    status = Column(
        String(50),
        nullable=True,
        default="待执行",
        comment="状态（待执行/执行中/已完成/已作废）",
    )

    # ── ORM 关系 ──────────────────────────────────────────────
    income_flows = relationship(
        "IncomeFlow", back_populates="order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    cost_flows = relationship(
        "CostFlow", back_populates="order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Order {self.order_no}>"
