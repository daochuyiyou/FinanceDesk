"""数据库连接配置（兼容 PyInstaller 打包环境）"""
import os
import sys
from datetime import datetime
from decimal import Decimal

from sqlalchemy import create_engine, Column, Integer, Boolean, DateTime, event
from sqlalchemy.orm import sessionmaker, declarative_base

if getattr(sys, "frozen", False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DB_DIR = os.path.join(BASE_DIR, "FinanceDesk_Data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "finance.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class HermesBaseModel(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    is_deleted = Column(Boolean, default=False, comment="逻辑删除标记")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── before_flush 事件钩子：自动校验和计算 ────────────────────────


def validate_amounts(session, flush_context, instances):
    """在 flush 前自动校验金额字段：确保 Numeric 字段为 Decimal 类型且非负。

    影响模型：Order.amount, IncomeFlow.taxable_amount, CostFlow.taxable_amount,
               Collection.amount, Payment.amount
    """
    for obj in session.new:
        _normalize_amount_fields(obj)
    for obj in session.dirty:
        _normalize_amount_fields(obj)


AMOUNT_MODELS = {
    "Order": "amount",
    "IncomeFlow": "taxable_amount",
    "CostFlow": "taxable_amount",
    "Collection": "amount",
    "Payment": "amount",
}


def _normalize_amount_fields(obj):
    """将金额字段转为 Decimal，确保一致性。"""
    cls_name = type(obj).__name__
    field = AMOUNT_MODELS.get(cls_name)
    if field is None:
        return
    val = getattr(obj, field, None)
    if val is None:
        setattr(obj, field, Decimal("0.00"))
    elif not isinstance(val, Decimal):
        setattr(obj, field, Decimal(str(val)))


event.listen(SessionLocal, "before_flush", validate_amounts)
