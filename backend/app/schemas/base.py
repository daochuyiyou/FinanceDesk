"""FinanceDesk 统一 Pydantic 基类 — M1 Critical Fix。

提供统一的 Decimal→float 序列化配置，修复金额字段在 JSON 响应中
被序列化为 string 而非 number 的 Bug（治理报告 H-02）。
"""
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class FinanceDeskBaseModel(BaseModel):
    """所有 Schema 的基类。

    - from_attributes=True: 允许从 ORM 模型创建（ORM → Pydantic）
    - json_encoders: Decimal → float（修复金额序列化为 string 的问题）
    """

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={Decimal: lambda v: float(v)},
    )
