"""Payment Repository — Payment CRUD + 字段转换。"""

from app.repositories.base import BaseRepository
from app.models import Payment


class PaymentRepository(BaseRepository):
    """付款仓储。cost_id int → VARCHAR(36) 在 create 内转换。"""

    def create(self, fields: dict) -> int:
        orm = dict(fields)
        if orm.get("cost_id"):
            orm["cost_id"] = str(orm["cost_id"])
        obj = Payment(**orm)
        self.db.add(obj)
        self.db.flush()
        return obj.id

    def update(self, record_id: int, fields: dict) -> bool:
        cnt = self.db.query(Payment).filter(Payment.id == record_id).update(fields)
        return cnt > 0

    def rollback(self, record_id: int) -> bool:
        cnt = self.db.query(Payment).filter(Payment.id == record_id).update({"is_deleted": True})
        return cnt > 0

    def find(self, record_id: int) -> dict | None:
        obj = self.db.get(Payment, record_id)
        if not obj or obj.is_deleted:
            return None
        return {c.name: getattr(obj, c.name) for c in Payment.__table__.columns}

    def find_by_business_key(self, business_key: str) -> int | None:
        obj = self.db.query(Payment).filter(
            Payment.voucher_no == business_key,
            Payment.is_deleted == False,
        ).first()
        return obj.id if obj else None

    def exists(self, business_key: str) -> bool:
        return self.db.query(Payment).filter(
            Payment.voucher_no == business_key,
            Payment.is_deleted == False,
        ).first() is not None

    def rollback_by_voucher_no(self, voucher_no: str) -> bool:
        cnt = self.db.query(Payment).filter(
            Payment.voucher_no == voucher_no,
            Payment.is_deleted == False,
        ).update({"is_deleted": True})
        return cnt > 0
