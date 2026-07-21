"""系统字典表 — 存储下拉选项，支持预设+动态扩展。"""

from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import HermesBaseModel


class SysDictionary(HermesBaseModel):
    """字典项表。category 分组，value 唯一值，label 展示名，sort_order 排序。"""

    __tablename__ = "sys_dictionary"
    __table_args__ = (
        UniqueConstraint("category", "value", name="uq_dict_category_value"),
    )

    category = Column(
        String(100), nullable=False, index=True, comment="字典分类",
    )
    value = Column(
        String(100), nullable=False, comment="选项值",
    )
    label = Column(
        String(200), nullable=True, comment="展示标签（为空时视为与 value 一致）",
    )
    sort_order = Column(
        Integer, nullable=True, default=0, comment="排序号",
    )

    def __repr__(self) -> str:
        return f"<Dict {self.category}={self.value}>"
