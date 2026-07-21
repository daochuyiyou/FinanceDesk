"""供应商框架合同模型。"""

from __future__ import annotations

from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from ..database import HermesBaseModel


class SupplierContract(HermesBaseModel):
    """供应商框架合同。"""

    __tablename__ = "supplier_contract"

    supplier_id = Column(
        Integer,
        ForeignKey("supplier.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="供应商ID",
    )
    contract_no = Column(
        String(100), nullable=False, unique=True, comment="合同编号"
    )
    sign_date = Column(Date, nullable=True, comment="签订日期")
    start_date = Column(Date, nullable=True, comment="合同开始日期")
    end_date = Column(Date, nullable=True, comment="合同结束日期")
    amount = Column(
        Numeric(15, 2), nullable=True, default=0, comment="合同金额"
    )
    status = Column(
        String(50), nullable=True, default="有效", comment="合同状态"
    )
    remark = Column(Text, nullable=True, comment="备注")

    supplier = relationship("Supplier", backref="contracts")

    def __repr__(self) -> str:
        return f"<SupplierContract {self.contract_no}>"
