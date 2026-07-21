"""操作日志模型。"""
from __future__ import annotations
from sqlalchemy import Column, Integer, String, Text
from ..database import HermesBaseModel

class AuditLog(HermesBaseModel):
    __tablename__ = "audit_log"
    user_id = Column(Integer, nullable=True, comment="用户ID")
    username = Column(String(100), nullable=True, comment="用户名")
    action = Column(String(50), nullable=False, comment="操作类型")
    module = Column(String(50), nullable=False, comment="模块")
    target_id = Column(Integer, nullable=True, comment="目标ID")
    target_name = Column(String(200), nullable=True, comment="目标名称")
    changes = Column(Text, nullable=True, comment="变更JSON")
    ip_address = Column(String(50), nullable=True, comment="操作IP")
