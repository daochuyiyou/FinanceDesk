# VERSION: engine-v1-import
"""
ERP 分层归集与匹配算法 + 聚合对账服务。

三级匹配策略:
  1. 强关联 — summary 直接含系统内 ProjectID / 订单编号
  2. 词库匹配 — 遍历 ProjectKeywordMapping
  3. 异常兜底 — 保持 pending

聚合计算:
  get_execution_gap() — [系统约定额] - [ERP 实绩] = [差异]
"""

from __future__ import annotations

import re
from collections import defaultdict
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.models import ERPStagingFlow, Order, Project, ProjectKeywordMapping


def match_erp_records(db: Session) -> dict:
    """对全部 pending 流水执行三级匹配，含自动学习。"""
    flows = db.execute(
        select(ERPStagingFlow).where(
            ERPStagingFlow.is_deleted == False,
            ERPStagingFlow.match_status == "pending",
        )
    ).scalars().all()

    auto_matched = 0
    keyword_matched = 0
    still_pending = 0

    keywords = db.execute(
        select(ProjectKeywordMapping).where(ProjectKeywordMapping.is_deleted == False)
    ).scalars().all()

    for flow in flows:
        matched = False

        # 一级：强关联
        if flow.summary:
            id_candidates = re.findall(r"(?:项目|订单)[#\s]*(\d+)", flow.summary)
            for cid in id_candidates:
                cid_int = int(cid)
                project = db.get(Project, cid_int)
                if project and not project.is_deleted:
                    flow.matched_project_id = cid_int
                    flow.match_status = "auto_matched"
                    auto_matched += 1
                    matched = True
                    break
                order = db.get(Order, cid_int)
                if order and not order.is_deleted:
                    flow.matched_order_id = cid_int
                    flow.matched_project_id = order.project_id
                    flow.match_status = "auto_matched"
                    auto_matched += 1
                    matched = True
                    break
        if matched:
            continue

        # 二级：词库匹配
        search_text = (flow.summary or "") + " " + (flow.raw_project_name or "")
        for kw in keywords:
            if kw.keyword.lower() in search_text.lower():
                flow.matched_project_id = kw.target_project_id
                flow.match_status = "auto_matched"
                keyword_matched += 1
                matched = True
                break
        if matched:
            continue

        # 三级：未匹配
        still_pending += 1

    db.commit()
    return {
        "total": len(flows),
        "auto_matched": auto_matched,
        "keyword_matched": keyword_matched,
        "still_pending": still_pending,
    }


def get_execution_gap(db: Session) -> list[dict]:
    """
    聚合对账：按项目维度对比 FinanceDesk 约定额 vs ERP 实绩。

    返回:
      [
        {
          "project_id": int,
          "project_name": str,
          "system_contract_amount": Decimal,    # 系统约定合同总额
          "erp_income_amount": Decimal,         # ERP 实收/贷方
          "erp_expense_amount": Decimal,        # ERP 实支/借方
          "gap_income": Decimal,                # 合同 - 应收 = 差异（正=欠款）
          "gap_expense": Decimal,               # 合同 - 实支 = 差异
        },
        ...
      ]
    """
    # 1. 系统侧：每个项目的订单金额合计
    system_rows = db.execute(
        select(
            Project.id.label("project_id"),
            Project.framework_name.label("project_name"),
            func.sum(Order.amount).label("contract_amount"),
        )
        .select_from(Project)
        .outerjoin(Order, Order.project_id == Project.id)
        .where(Project.is_deleted == False, Order.is_deleted == False)
        .group_by(Project.id)
    ).all()

    system_map = {}
    for r in system_rows:
        system_map[r.project_id] = {
            "project_name": r.project_name,
            "contract_amount": Decimal(str(r.contract_amount or 0)),
        }

    # 2. ERP 侧：已匹配流水的 amount_in / amount_out 汇总
    all_project_ids = list(system_map.keys())

    if all_project_ids:
        erp_rows = db.execute(
            select(
                ERPStagingFlow.matched_project_id,
                func.sum(ERPStagingFlow.amount_in).label("total_in"),
                func.sum(ERPStagingFlow.amount_out).label("total_out"),
            )
            .where(
                ERPStagingFlow.is_deleted == False,
                ERPStagingFlow.matched_project_id.isnot(None),
                ERPStagingFlow.matched_project_id.in_(all_project_ids),
            )
            .group_by(ERPStagingFlow.matched_project_id)
        ).all()
    else:
        erp_rows = []

    erp_map = {}
    for r in erp_rows:
        erp_map[r.matched_project_id] = {
            "total_in": Decimal(str(r.total_in or 0)),
            "total_out": Decimal(str(r.total_out or 0)),
        }

    # 3. 合并输出
    result = []
    for pid, sys_data in system_map.items():
        erp_data = erp_map.get(pid, {"total_in": Decimal("0"), "total_out": Decimal("0")})
        result.append({
            "project_id": pid,
            "project_name": sys_data["project_name"],
            "system_contract_amount": sys_data["contract_amount"],
            "erp_income_amount": erp_data["total_in"],
            "erp_expense_amount": erp_data["total_out"],
            "gap_income": sys_data["contract_amount"] - erp_data["total_in"],
            "gap_expense": sys_data["contract_amount"] - erp_data["total_out"],
        })

    return sorted(result, key=lambda x: x["project_id"])

# ═══════════════════════════════════════════════════════════
# ERP Import Engine — BDD-06F/06.5/06.8 编码实现
# 职责: Mapping Engine → Business Event → Rule Engine → Action → Summary
# ═══════════════════════════════════════════════════════════


from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy import func, select, update
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.models import (
    Collection, CostFlow, ERPStagingFlow, IncomeFlow,
    ImportBatch, Order, Payment, ProjectKeywordMapping,
)


# ── 1. Business Event Model ────────────────────────────────

@dataclass
class BusinessEvent:
    """标准业务事件（Memory 对象，不落库）。"""
    event_type: str          # create / update / reverse / rollback / skip
    business_object: str     # IncomeFlow / CostFlow / Collection / Payment
    source_flow: ERPStagingFlow
    matched_order_id: Optional[int]
    matched_project_id: Optional[int]
    field_values: dict
    summary_action: str      # recalc / skip
    original_record_id: Optional[int] = None
    original_amount: Optional[Decimal] = None


# ── 2. Mapping Engine — ERPStagingFlow → BusinessEvent ─────

DIRECTION_RULES = [
    
        {"direction": "贷方", "voucher_type": "invoice",
     "business_object": "IncomeFlow", "priority": 10},
    
        {"direction": "借方", "voucher_type": "cost",
     "business_object": "CostFlow", "priority": 10},
]

RED_FLUSH_KEYWORDS = ["红冲", "冲红", "负数", "退款", "退票"]


def infer_voucher_type(flow: ERPStagingFlow) -> str:
    """推断凭证类型（v1: Collection/Payment 映射为 Income/Cost）。"""
    if flow.record_type == "collection":
        return "invoice"
    if flow.record_type == "payment":
        return "cost"
    summary = (flow.summary or "").lower()
    for kw in RED_FLUSH_KEYWORDS:
        if kw in summary:
            return "reverse_invoice" if (flow.amount_in or 0) > 0 else "reverse_cost"
    if (flow.amount_in or 0) > 0:
        return "invoice"
    if (flow.amount_out or 0) > 0:
        return "cost"
    return "unknown"


def apply_field_mapping(flow: ERPStagingFlow, target: str) -> dict:
    """字段映射：ERPStagingFlow → 业务对象字段（基于实际 ORM 模型）。"""
    if target == "IncomeFlow":
        if not flow.matched_order_id:
            return {}  # skip - no order
        return {
            "invoice_no": flow.erp_record_id,
            "invoice_date": flow.occur_date,
            "invoice_count": 1,
            "taxable_amount": flow.amount_in or Decimal("0"),
            "non_taxable_amount": Decimal("0"),
            "remark": flow.summary,
            "order_id": flow.matched_order_id,
            "status": "待回款",
        }
    elif target == "CostFlow":
        if not flow.matched_order_id:
            return {}  # skip - no order
        return {
            "cost_party": flow.raw_project_name,
            "taxable_amount": flow.amount_out or Decimal("0"),
            "non_taxable_amount": Decimal("0"),
            "remark": flow.summary,
            "order_id": flow.matched_order_id,
            "cost_type": "ERP导入",
            "status": "待支付",
        }
    elif target == "Collection":
        return {
            "receipt_no": flow.erp_record_id,
            "collection_date": flow.occur_date,
            "amount": flow.amount_in or Decimal("0"),
            "flow_id": None,  # 需查找关联 IncomeFlow
        }
    elif target == "Payment":
        return {
            "voucher_no": flow.erp_record_id,
            "payment_date": flow.occur_date,
            "amount": flow.amount_out or Decimal("0"),
            "payee": flow.raw_project_name,
            "cost_id": None,  # 需查找关联 CostFlow
        }
    return {}


def interpret_flow(flow: ERPStagingFlow) -> BusinessEvent:
    """Mapping Engine: 将已匹配的 ERPStagingFlow 转为 BusinessEvent。"""
    vtype = infer_voucher_type(flow)

    # 红冲检测
    if vtype in ("reverse_invoice", "reverse_cost"):
        bo = "IncomeFlow" if vtype == "reverse_invoice" else "CostFlow"
        fields = apply_field_mapping(flow, bo)
        # 红冲金额为负
        if bo == "IncomeFlow":
            fields["taxable_amount"] = -(abs(flow.amount_in or Decimal("0")))
        else:
            fields["taxable_amount"] = -(abs(flow.amount_out or Decimal("0")))
        return BusinessEvent(
            event_type="reverse",
            business_object=bo,
            source_flow=flow,
            matched_order_id=flow.matched_order_id,
            matched_project_id=flow.matched_project_id,
            field_values=fields,
            summary_action="recalc",
        )

    # 常规映射
    for rule in sorted(DIRECTION_RULES, key=lambda r: r["priority"]):
        if rule["voucher_type"] == vtype:
            bo = rule["business_object"]
            fields = apply_field_mapping(flow, bo)
            return BusinessEvent(
                event_type="create",
                business_object=bo,
                source_flow=flow,
                matched_order_id=flow.matched_order_id,
                matched_project_id=flow.matched_project_id,
                field_values=fields,
                summary_action="recalc",
            )

    # 未知类型 → skip
    return BusinessEvent(
        event_type="skip",
        business_object="UNKNOWN",
        source_flow=flow,
        matched_order_id=flow.matched_order_id,
        matched_project_id=flow.matched_project_id,
        field_values={},
        summary_action="skip",
    )


# ── 3. Rule Engine — Event → Actions ───────────────────────

RULE_CATALOG = {
    "IncomeFlow.create":  {"summary_action": "recalc", "dashboard": True, "ai": False},
    "IncomeFlow.reverse": {"summary_action": "recalc", "dashboard": True, "ai": True},
    "CostFlow.create":    {"summary_action": "recalc", "dashboard": True, "ai": False},
    "CostFlow.reverse":   {"summary_action": "recalc", "dashboard": True, "ai": True},
    "Collection.create":  {"summary_action": "recalc", "dashboard": True, "ai": False},
    "Payment.create":     {"summary_action": "recalc", "dashboard": True, "ai": False},
}


def match_rules(event: BusinessEvent) -> dict:
    """Rule Engine: 匹配事件对应的规则动作。"""
    key = f"{event.business_object}.{event.event_type}"
    return RULE_CATALOG.get(key, {"summary_action": "skip", "dashboard": False, "ai": False})


# ── 4. Summary Engine — Order Summary Recalc ───────────────

def recalc_order_summary(order_id: int, db: Session) -> dict:
    """计算订单维度汇总（Revenue Counterpart + Cost Counterpart）。"""
    from sqlalchemy import func as f_

    # Revenue: IncomeFlow 合计
    rev = db.query(
        f_.coalesce(f_.sum(IncomeFlow.taxable_amount), 0).label("total"),
        f_.count(IncomeFlow.id).label("count"),
    ).filter(
        IncomeFlow.order_id == order_id,
        IncomeFlow.is_deleted == False,
    ).first()

    # Cost: CostFlow 合计（含冲红）
    cost = db.query(
        f_.coalesce(f_.sum(CostFlow.taxable_amount), 0).label("total"),
        f_.count(CostFlow.id).label("count"),
    ).filter(
        CostFlow.order_id == order_id,
        CostFlow.is_deleted == False,
    ).first()

    # Collection 合计
    coll = db.query(
        f_.coalesce(f_.sum(Collection.amount), 0).label("total"),
    ).filter(
        Collection.order_id == order_id,
        Collection.is_deleted == False,
    ).first()

    # Payment 合计
    pay = db.query(
        f_.coalesce(f_.sum(Payment.amount), 0).label("total"),
    ).filter(
        Payment.order_id == order_id,
        Payment.is_deleted == False,
    ).first()

    return {
        "order_id": order_id,
        "revenue_amount": float(rev.total) if rev else 0,
        "revenue_count": rev.count if rev else 0,
        "cost_amount": float(cost.total) if cost else 0,
        "cost_count": cost.count if cost else 0,
        "collection_amount": float(coll.total) if coll else 0,
        "payment_amount": float(pay.total) if pay else 0,
    }


def recalc_summaries(order_ids: set[int], db: Session) -> list[dict]:
    """批量刷新多个订单的 Summary。"""
    return [recalc_order_summary(oid, db) for oid in order_ids if oid]


# ── 5. Import Engine — execute(batch_no) ───────────────────

def execute_batch(batch_no: str, db: Session) -> dict:
    """事务性执行导入：Mapping → Event → Rule → Action → Summary → Log。

    整个 Batch 一个数据库事务。任何系统异常触发 ROLLBACK。
    """
    from app.utils.audit import log_action

    flows = db.execute(
        select(ERPStagingFlow).where(
            ERPStagingFlow.match_status.in_(["auto_matched", "manual_matched", "pending"]),
            ERPStagingFlow.is_deleted == False,
        )
    ).scalars().all()

    if not flows:
        raise ValueError(f"Batch {batch_no} 无待导入记录")

    affected_orders: set[int] = set()
    results = {
        "created": 0, "updated": 0, "reversed": 0,
        "skipped_duplicate": 0, "failed": 0, "skipped_unmatched": 0,
    }
    event_log = []
    import_log = []

    for flow in flows:
        try:
            # ── 去重检查 ──
            if flow.erp_record_id:
                existing = _check_duplicate(flow, db)
                if existing:
                    results["skipped_duplicate"] += 1
                    import_log.append({
                        "flow_id": flow.id, "action": "duplicate",
                        "detail": f"erp_record_id={flow.erp_record_id} 已存在"
                    })
                    continue

            # ── Mapping Engine: Flow → Event ──
            event = interpret_flow(flow)
            if event.event_type == "skip":
                results["skipped_unmatched"] += 1
                import_log.append({
                    "flow_id": flow.id, "action": "unmatched",
                    "detail": "无法映射到业务对象"
                })
                continue

            # ── Rule Engine: Event → Actions ──
            rule = match_rules(event)
            if rule["summary_action"] == "recalc" and event.matched_order_id:
                affected_orders.add(event.matched_order_id)

            # ── Action: 创建/更新/冲红业务对象 ──
            if event.event_type == "create":
                obj = _create_business_object(event, db)
                if obj is None:
                    results["skipped_unmatched"] += 1
                    import_log.append({
                        "flow_id": flow.id, "action": "skipped",
                        "detail": f"{event.business_object}: no parent"
                    })
                    continue
                results["created"] += 1
                action = "created"
            elif event.event_type == "reverse":
                obj = _create_business_object(event, db)
                results["reversed"] += 1
                action = "reversed"
            elif event.event_type == "update":
                obj = _update_business_object(event, db)
                results["updated"] += 1
                action = "updated"
            else:
                continue

            # ── 事件日志 ──
            event_log.append({
                "flow_id": flow.id,
                "event_type": event.event_type,
                "business_object": event.business_object,
                "target_id": obj.id if obj else None,
            })
            import_log.append({
                "flow_id": flow.id, "action": action,
                "detail": f"{event.business_object}(id={obj.id})"
            })

            # ── Audit Log ──
            try:
                log_action(db, "IMPORT", event.business_object,
                           target_id=obj.id,
                           target_name=str(flow.erp_record_id or ""))
            except Exception:
                pass  # audit log non-blocking

        except Exception as e:
            results["failed"] += 1
            import_log.append({
                "flow_id": flow.id, "action": "failed",
                "detail": str(e)
            })

    # ── Summary Engine ──
    summaries = []
    if affected_orders:
        summaries = recalc_summaries(affected_orders, db)

    # ── 更新 Batch 统计 ──
    db.execute(
        update(ImportBatch).where(ImportBatch.batch_no == batch_no).values(
            success_count=results["created"] + results["updated"] + results["reversed"],
            failed_count=results["failed"],
            duplicate_count=results["skipped_duplicate"],
            manual_match_count=results["skipped_unmatched"],
            total_count=len(flows),
        )
    )

    # ── 标记暂存记录为已导入 ──
    for flow in flows:
        flow.match_status = "imported"

    return {
        "batch_no": batch_no,
        "results": results,
        "affected_orders": len(affected_orders),
        "summaries": summaries,
        "event_log": event_log,
        "import_log": import_log,
    }


def _check_duplicate(flow: ERPStagingFlow, db: Session) -> bool:
    """检查 erp_record_id 是否已在业务表中存在。"""
    vtype = infer_voucher_type(flow)
    if vtype == "receipt":
        return db.query(Collection).filter(
            Collection.receipt_no == flow.erp_record_id,
            Collection.is_deleted == False,
        ).first() is not None
    elif vtype == "invoice":
        return db.query(IncomeFlow).filter(
            IncomeFlow.invoice_no == flow.erp_record_id,
            IncomeFlow.is_deleted == False,
        ).first() is not None
    elif vtype == "payment":
        return db.query(Payment).filter(
            Payment.voucher_no == flow.erp_record_id,
            Payment.is_deleted == False,
        ).first() is not None
    elif vtype == "cost":
        return db.query(CostFlow).filter(
            CostFlow.voucher_no == flow.erp_record_id,
            CostFlow.is_deleted == False,
        ).first() is not None
    return False


def _create_business_object(event: BusinessEvent, db: Session):
    """创建业务对象（含 Collection/Payment 的 parent FK 查找）。"""
    model_map = {
        "IncomeFlow": IncomeFlow,
        "CostFlow": CostFlow,
        "Collection": Collection,
        "Payment": Payment,
    }
    model = model_map.get(event.business_object)
    if not model:
        raise ValueError(f"未知业务对象: {event.business_object}")

    fields = dict(event.field_values)

    # Collection: 查找关联的 IncomeFlow
    if event.business_object == "Collection" and fields.get("flow_id") is None:
        income = db.query(IncomeFlow).filter(
            IncomeFlow.invoice_no == event.source_flow.erp_record_id,
            IncomeFlow.is_deleted == False,
        ).first()
        if income:
            fields["flow_id"] = income.id

    # Payment: 查找关联的 CostFlow
    if event.business_object == "Payment" and fields.get("cost_id") is None:
        cost = db.query(CostFlow).filter(
            CostFlow.order_id == event.matched_order_id,
            CostFlow.is_deleted == False,
        ).first()
        if cost:
            fields["cost_id"] = cost.id

    # 移除 target 模型不存在的字段
    mapper = inspect(model)
    valid_cols = {c.name for c in mapper.columns}
    fields = {k: v for k, v in fields.items() if k in valid_cols}

    obj = model(**fields)
    db.add(obj)
    db.flush()
    return obj


def _update_business_object(event: BusinessEvent, db: Session):
    """更新业务对象（按 ID 更新）。"""
    model_map = {
        "IncomeFlow": IncomeFlow,
        "CostFlow": CostFlow,
        "Collection": Collection,
        "Payment": Payment,
    }
    model = model_map.get(event.business_object)
    if not model or not event.original_record_id:
        raise ValueError("Update 需要 original_record_id")
    obj = db.get(model, event.original_record_id)
    if not obj:
        raise ValueError(f"{event.business_object} id={event.original_record_id} 不存在")
    for k, v in event.field_values.items():
        setattr(obj, k, v)
    return obj


# ── 6. Rollback Engine ─────────────────────────────────────

def rollback_batch(batch_no: str, db: Session) -> dict:
    """按 Batch 整体逻辑回滚。"""
    from app.utils.audit import log_action

    batch = db.execute(
        select(ImportBatch).where(
            ImportBatch.batch_no == batch_no,
            ImportBatch.is_deleted == False,
        )
    ).scalar_one_or_none()
    if not batch:
        raise ValueError(f"Batch {batch_no} 不存在")

    # 查找该 Batch 关联的业务记录
    flows = db.execute(
        select(ERPStagingFlow).where(
            ERPStagingFlow.match_status.in_(["auto_matched", "manual_matched", "pending"]),
            ERPStagingFlow.is_deleted == False,
        )
    ).scalars().all()

    order_ids: set[int] = set()
    rollback_count = 0

    for flow in flows:
        if not flow.erp_record_id:
            continue
        # 按 voucher_type 在各业务表中查找
        for model_cls, id_field in [
            (IncomeFlow, "invoice_no"),
            (CostFlow, "voucher_no"),
            (Collection, "receipt_no"),
            (Payment, "voucher_no"),
        ]:
            records = db.execute(
                select(model_cls).where(
                    getattr(model_cls, id_field) == flow.erp_record_id,
                    model_cls.is_deleted == False,
                )
            ).scalars().all()
            for rec in records:
                rec.is_deleted = True
                if rec.order_id:
                    order_ids.add(rec.order_id)
                rollback_count += 1
                try:
                    log_action(db, "ROLLBACK", model_cls.__tablename__,
                               target_id=rec.id,
                               target_name=str(flow.erp_record_id))
                except Exception:
                    pass

        flow.match_status = "rolled_back"

    # 重新刷新 Summary
    summaries = recalc_summaries(order_ids, db) if order_ids else []

    return {
        "batch_no": batch_no,
        "rollback_count": rollback_count,
        "affected_orders": len(order_ids),
        "summaries": summaries,
    }


# ── 7. Status Engine ───────────────────────────────────────

def get_batch_status(batch_no: str, db: Session) -> dict:
    """查询 Batch 导入状态。"""
    batch = db.execute(
        select(ImportBatch).where(ImportBatch.batch_no == batch_no)
    ).scalar_one_or_none()
    if not batch:
        raise ValueError(f"Batch {batch_no} 不存在")

    flows = db.execute(
        select(ERPStagingFlow).where(
            ERPStagingFlow.match_status.in_(["auto_matched", "manual_matched", "pending"]),
            ERPStagingFlow.is_deleted == False,
        )
    ).scalars().all()

    match_statuses = {}
    for f in flows:
        ms = f.match_status
        match_statuses[ms] = match_statuses.get(ms, 0) + 1

    return {
        "batch_no": batch.batch_no,
        "import_time": batch.import_time,
        "total_count": batch.total_count,
        "success_count": batch.success_count,
        "failed_count": batch.failed_count,
        "duplicate_count": batch.duplicate_count,
        "match_statuses": match_statuses,
        "flow_count": len(flows),
    }

# ═══════════════════════════════════════════════════════════
# End of Engine Section
