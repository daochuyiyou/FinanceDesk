"""供应商工种单价模型（按年度版本）。"""

from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Index, Integer, Numeric, String, Text, text
from sqlalchemy.orm import relationship

from ..database import HermesBaseModel


class SupplierUnitPrice(HermesBaseModel):
    """供应商工种单价表 —— 按年度版本，独立于 old supplier_price。"""

    __tablename__ = "supplier_unit_price"
    __table_args__ = (
        Index("uq_supplier_unit_year_active", "supplier_id", "year", unique=True,
              sqlite_where=text("is_deleted = 0")),
    )

    supplier_id = Column(
        Integer,
        ForeignKey("supplier.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="供应商ID",
    )
    year = Column(Integer, nullable=False, comment="年度")
    laborer_price = Column(
        Numeric(10, 2), nullable=True, default=0, comment="普工单价"
    )
    technician_price = Column(
        Numeric(10, 2), nullable=True, default=0, comment="技工单价"
    )
    senior_technician_price = Column(
        Numeric(10, 2), nullable=True, default=0, comment="高级技工单价"
    )
    special_work_price = Column(
        Numeric(10, 2), nullable=True, default=0, comment="特种作业单价"
    )
    comprehensive_price = Column(
        Numeric(10, 2), nullable=True, default=0, comment="综合单价"
    )
    remark = Column(Text, nullable=True, comment="备注")

    supplier = relationship("Supplier", backref="unit_prices")

    def __repr__(self) -> str:
        return f"<SupplierUnitPrice supplier={self.supplier_id} year={self.year}>"
