"""Lifecycle derivation for Revenue (IncomeFlow) and Cost (CostFlow).
Mirror pair: derive_income_status ↔ derive_cost_status
BOS §5.3: 待开票 → 已开票 → 部分回款 → 已结清 (可红冲)
BOS §5.4: 待支付 → 部分付款 → 已结清
"""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Collection, CostFlow, IncomeFlow, Payment


def derive_income_status(flow_id: int, db: Session) -> str:
    """推导收入流水 Lifecycle。"""
    flow = db.get(IncomeFlow, flow_id)
    if not flow:
        return "未知"
    # 红冲标记
    if flow.invoice_reason == "红冲":
        return "红冲"
    # 计算已回款总额
    total_collected = db.scalar(
        select(func.coalesce(func.sum(Collection.amount), 0))
        .where(Collection.flow_id == str(flow_id), Collection.is_deleted == False)
    ) or 0
    total_collected = float(total_collected)
    taxable = float(flow.taxable_amount or 0)
    if total_collected <= 0:
        return "待回款" if flow.invoice_date else "待开票"
    elif total_collected < taxable:
        return "部分回款"
    else:
        return "已结清"


def derive_cost_status(flow_id: int, db: Session) -> str:
    """推导成本流水 Lifecycle（镜像）。"""
    flow = db.get(CostFlow, flow_id)
    if not flow:
        return "未知"
    total_paid = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.cost_id == str(flow_id), Payment.is_deleted == False)
    ) or 0
    total_paid = float(total_paid)
    taxable = float(flow.taxable_amount or 0)
    if total_paid <= 0:
        return "待支付"
    elif total_paid < taxable:
        return "部分付款"
    else:
        return "已结清"
