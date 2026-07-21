"""Income Repository — IncomeFlow CRUD + 字段转换。"""

from app.repositories.base import BaseRepository
from app.models import IncomeFlow


class IncomeRepository(BaseRepository):
    """收入流水仓储。order_id int → VARCHAR(36) 在 create 内转换。"""

    def create(self, fields: dict) -> int:
        orm = dict(fields)
        orm["order_id"] = str(orm["order_id"])
        obj = IncomeFlow(**orm)
        self.db.add(obj)
        self.db.flush()
        return obj.id

    def update(self, record_id: int, fields: dict) -> bool:
        cnt = self.db.query(IncomeFlow).filter(IncomeFlow.id == record_id).update(fields)
        return cnt > 0

    def rollback(self, record_id: int) -> bool:
        cnt = self.db.query(IncomeFlow).filter(IncomeFlow.id == record_id).update({"is_deleted": True})
        return cnt > 0

    def find(self, record_id: int) -> dict | None:
        obj = self.db.get(IncomeFlow, record_id)
        if not obj or obj.is_deleted:
            return None
        return {c.name: getattr(obj, c.name) for c in IncomeFlow.__table__.columns}

    def find_by_business_key(self, business_key: str) -> int | None:
        obj = self.db.query(IncomeFlow).filter(
            IncomeFlow.invoice_no == business_key,
            IncomeFlow.is_deleted == False,
        ).first()
        return obj.id if obj else None

    def exists(self, business_key: str) -> bool:
        return self.db.query(IncomeFlow).filter(
            IncomeFlow.invoice_no == business_key,
            IncomeFlow.is_deleted == False,
        ).first() is not None

    def find_by_order_id(self, order_id: int) -> list:
        return self.db.query(IncomeFlow).filter(
            IncomeFlow.order_id == str(order_id),
            IncomeFlow.is_deleted == False,
        ).all()

    def rollback_by_invoice_no(self, invoice_no: str) -> bool:
        cnt = self.db.query(IncomeFlow).filter(
            IncomeFlow.invoice_no == invoice_no,
            IncomeFlow.is_deleted == False,
        ).update({"is_deleted": True})
        return cnt > 0
