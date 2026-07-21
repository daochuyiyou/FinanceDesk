"""Collection Repository — Collection CRUD + 字段转换。"""

from app.repositories.base import BaseRepository
from app.models import Collection


class CollectionRepository(BaseRepository):
    """收款仓储。flow_id int → VARCHAR(36) 在 create 内转换。"""

    def create(self, fields: dict) -> int:
        orm = dict(fields)
        if orm.get("flow_id"):
            orm["flow_id"] = str(orm["flow_id"])
        obj = Collection(**orm)
        self.db.add(obj)
        self.db.flush()
        return obj.id

    def update(self, record_id: int, fields: dict) -> bool:
        cnt = self.db.query(Collection).filter(Collection.id == record_id).update(fields)
        return cnt > 0

    def rollback(self, record_id: int) -> bool:
        cnt = self.db.query(Collection).filter(Collection.id == record_id).update({"is_deleted": True})
        return cnt > 0

    def find(self, record_id: int) -> dict | None:
        obj = self.db.get(Collection, record_id)
        if not obj or obj.is_deleted:
            return None
        return {c.name: getattr(obj, c.name) for c in Collection.__table__.columns}

    def find_by_business_key(self, business_key: str) -> int | None:
        obj = self.db.query(Collection).filter(
            Collection.receipt_no == business_key,
            Collection.is_deleted == False,
        ).first()
        return obj.id if obj else None

    def exists(self, business_key: str) -> bool:
        return self.db.query(Collection).filter(
            Collection.receipt_no == business_key,
            Collection.is_deleted == False,
        ).first() is not None

    def rollback_by_receipt_no(self, receipt_no: str) -> bool:
        cnt = self.db.query(Collection).filter(
            Collection.receipt_no == receipt_no,
            Collection.is_deleted == False,
        ).update({"is_deleted": True})
        return cnt > 0
