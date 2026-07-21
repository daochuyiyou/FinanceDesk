"""供应商主体、框架合同及年度单价模型。"""
from __future__ import annotations

from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint

from ..database import HermesBaseModel


class Supplier(HermesBaseModel):
    """供应商（合并 Vendor 后的单一表）。"""

    __tablename__ = "supplier"

    name = Column(
        String(200),
        nullable=False,
        comment="供应商名称",
    )
    framework = Column(
        String(200),
        nullable=True,
        comment="所属框架",
    )
    framework_no = Column(
        String(100),
        nullable=False,
        comment="框架编号",
    )
    framework_start_date = Column(
        Date,
        nullable=True,
        comment="框架开始时间",
    )
    framework_end_date = Column(
        Date,
        nullable=True,
        comment="框架结束时间",
    )
    year = Column(
        Integer,
        nullable=True,
        comment="年度",
    )

    def __repr__(self) -> str:
        return f"<Supplier {self.framework_no}>"


class SupplierPrice(HermesBaseModel):
    """旧单价表（保持不动，兼容已有数据）。"""
    __tablename__ = "supplier_price"
    supplier_id = Column(
        String(36),
        ForeignKey("supplier.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="关联 Supplier.id（物理外键）",
    )
    work_type = Column(String(100), nullable=False)
    unit_price = Column(Text, nullable=True)
    remark = Column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<SupplierPrice supplier={self.supplier_id} {self.work_type}>"


class SupplierYearPrice(HermesBaseModel):
    """供应商年度综合单价表（宽表，一行一个 Vendor × 年度）。"""

    __tablename__ = "supplier_year_price"
    __table_args__ = (UniqueConstraint("supplier_id", "year", name="uq_supplier_year"),)

    supplier_id = Column(
        String(36),
        ForeignKey("supplier.id", ondelete="CASCADE"),
        nullable=False,
        comment="关联 Supplier.id（物理外键）",
    )
    year = Column(Integer, nullable=True, comment="年度")
    laborer_unit_price = Column(Numeric(10, 2), nullable=True, comment="普工单价")
    technician_unit_price = Column(Numeric(10, 2), nullable=True, comment="技工单价")
    senior_technician_unit_price = Column(Numeric(10, 2), nullable=True, comment="高级技工单价")
    special_work_type = Column(String(100), nullable=True, comment="特种作业工种")
    special_work_price = Column(Numeric(10, 2), nullable=True, comment="特种作业单价")
    comprehensive_unit_price = Column(Numeric(10, 2), nullable=True, comment="综合单价")
    remark = Column(Text, nullable=True, comment="备注")

    def __repr__(self) -> str:
        return f"<SupplierYearPrice supplier={self.supplier_id} year={self.year}>"
