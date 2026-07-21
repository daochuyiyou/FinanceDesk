"""审计日志帮助函数。"""
from __future__ import annotations
import json
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

def log_action(db: Session, action: str, module: str, target_id: int | None = None,
               target_name: str | None = None, changes: dict | None = None,
               username: str | None = None, ip_address: str | None = None):
    log = AuditLog(action=action, module=module, target_id=target_id, target_name=target_name,
                   changes=json.dumps(changes, ensure_ascii=False) if changes else None,
                   username=username or "admin", ip_address=ip_address)
    db.add(log)
    db.flush()
