"""Summary Repository — Order Summary 实时计算（不落库）。"""

from sqlalchemy import func

from app.repositories.base import BaseRepository
from app.models import IncomeFlow, CostFlow


class SummaryRepository(BaseRepository):
    """订单经营汇总仓储 — 按 order_id 聚合计算（不落库）。"""

    def refresh_for_order(self, order_id: int) -> dict:
        order_id_str = str(order_id)
        rev = self.db.query(
            func.coalesce(func.sum(IncomeFlow.taxable_amount), 0)
        ).filter(
            IncomeFlow.order_id == order_id_str,
            IncomeFlow.is_deleted == False,
        ).scalar() or 0

        cost = self.db.query(
            func.coalesce(func.sum(CostFlow.taxable_amount), 0)
        ).filter(
            CostFlow.order_id == order_id_str,
            CostFlow.is_deleted == False,
        ).scalar() or 0

        return {
            "order_id": order_id,
            "revenue_amount": float(rev),
            "cost_amount": float(cost),
        }

    def refresh_batch(self, order_ids: set[int]) -> list[dict]:
        return [self.refresh_for_order(oid) for oid in order_ids if oid]
