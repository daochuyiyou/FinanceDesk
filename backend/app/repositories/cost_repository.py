"""Cost Repository — CostFlow CRUD + 字段转换。"""

from app.repositories.base import BaseRepository
from app.models import CostFlow


class CostRepository(BaseRepository):
    """成本流水仓储。order_id int → VARCHAR(36) 在 create 内转换。"""

    def create(self, fields: dict) -> int:
        orm = dict(fields)
        orm["order_id"] = str(orm["order_id"])
        obj = CostFlow(**orm)
        self.db.add(obj)
        self.db.flush()
        return obj.id

    def update(self, record_id: int, fields: dict) -> bool:
        cnt = self.db.query(CostFlow).filter(CostFlow.id == record_id).update(fields)
        return cnt > 0

    def rollback(self, record_id: int) -> bool:
        cnt = self.db.query(CostFlow).filter(CostFlow.id == record_id).update({"is_deleted": True})
        return cnt > 0

    def find(self, record_id: int) -> dict | None:
        obj = self.db.get(CostFlow, record_id)
        if not obj or obj.is_deleted:
            return None
        return {c.name: getattr(obj, c.name) for c in CostFlow.__table__.columns}

    def find_by_business_key(self, business_key: str) -> int | None:
        obj = self.db.query(CostFlow).filter(
            CostFlow.remark.contains(business_key),
            CostFlow.is_deleted == False,
        ).first()
        return obj.id if obj else None

    def exists(self, business_key: str) -> bool:
        return self.db.query(CostFlow).filter(
            CostFlow.remark.contains(business_key),
            CostFlow.is_deleted == False,
        ).first() is not None

    def find_by_order_id(self, order_id: int) -> list:
        return self.db.query(CostFlow).filter(
            CostFlow.order_id == str(order_id),
            CostFlow.is_deleted == False,
        ).all()

    def rollback_by_order_id(self, order_id: int) -> int:
        cnt = self.db.query(CostFlow).filter(
            CostFlow.order_id == str(order_id),
            CostFlow.is_deleted == False,
        ).update({"is_deleted": True})
        return cnt
