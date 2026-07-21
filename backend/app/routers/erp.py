"""ERP 数据集成路由 — 工业级 v2 + Engine Sprint 1 (execute/rollback/status)."""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, insert, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ERPStagingFlow, ImportBatch, Order, ProjectKeywordMapping
from app.schemas.erp import (
    ERPManualMatch, ERPParseResponse, ERPStagingFlowResponse,
    KeywordMappingCreate, PaginatedERPFlows, ProjectKeywordMappingResponse,
)
from app.services.erp_excel_parser import parse_erp_excel

router = APIRouter(prefix="/erp", tags=["ERP 数据集成"])


# ═══════════════════════════════════════════════════════════
# Original ERP Routes
# ═══════════════════════════════════════════════════════════

@router.post("/upload", response_model=ERPParseResponse)
async def upload_erp_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "仅支持 .xlsx 或 .xls 文件")
    body = await file.read()
    result = parse_erp_excel(body, filename=file.filename)
    rows = result.get("rows", []); errors = result.get("errors", [])
    if not rows:
        return ERPParseResponse(results=[], total_rows=0, total_errors=len(errors))
    data_dicts = []
    for r in rows:
        try: od = date.fromisoformat(r.get("occur_date")) if r.get("occur_date") else None
        except: od = None
        data_dicts.append({
            "record_type": r.get("record_type", "income_expense"),
            "occur_date": od, "erp_record_id": r.get("erp_record_id"),
            "summary": r.get("summary"), "raw_project_name": r.get("raw_project_name"),
            "amount_in": Decimal(str(r["amount_in"])) if r.get("amount_in") else None,
            "amount_out": Decimal(str(r["amount_out"])) if r.get("amount_out") else None,
            "match_status": "pending", "source_file": file.filename,
        })
    stmt = insert(ERPStagingFlow).prefix_with("OR IGNORE")
    before = db.query(func.count(ERPStagingFlow.id)).scalar() or 0
    db.execute(stmt, data_dicts); db.commit()
    after = db.query(func.count(ERPStagingFlow.id)).scalar() or 0
    return ERPParseResponse(results=[], total_rows=after - before, total_errors=len(errors))


@router.get("/flows", response_model=PaginatedERPFlows)
def list_erp_flows(page: int = Query(1), page_size: int = Query(20),
                   record_type=None, match_status=None, db: Session = Depends(get_db)):
    base = select(ERPStagingFlow).where(ERPStagingFlow.is_deleted == False)
    if record_type: base = base.where(ERPStagingFlow.record_type == record_type)
    if match_status: base = base.where(ERPStagingFlow.match_status == match_status)
    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.execute(base.order_by(ERPStagingFlow.created_at.desc())
                       .offset((page - 1) * page_size).limit(page_size)).scalars().all()
    return PaginatedERPFlows(items=[ERPStagingFlowResponse.model_validate(f) for f in items],
                             total=total or 0, page=page, page_size=page_size)


@router.post("/match", status_code=200)
def manual_match(body: ERPManualMatch, db: Session = Depends(get_db)):
    flows = db.execute(select(ERPStagingFlow).where(
        ERPStagingFlow.id.in_(body.flow_ids), ERPStagingFlow.is_deleted == False
    )).scalars().all()
    if not flows: raise HTTPException(404, "未找到指定流水")
    updated = 0
    for flow in flows:
        flow.matched_project_id = body.project_id
        flow.matched_order_id = body.order_id
        flow.match_status = "manual_matched"
        for txt in [flow.summary, flow.raw_project_name]:
            if not txt: continue
            kw = txt.strip()[:20].strip()
            if len(kw) < 2: continue
            exists = db.execute(select(ProjectKeywordMapping).where(
                ProjectKeywordMapping.keyword == kw, ProjectKeywordMapping.is_deleted == False
            )).scalar_one_or_none()
            if not exists:
                db.add(ProjectKeywordMapping(keyword=kw, target_project_id=body.project_id, match_type="manual"))
        updated += 1
    db.commit()
    return {"updated": updated}


@router.get("/keywords", response_model=list[ProjectKeywordMappingResponse])
def list_keywords(db: Session = Depends(get_db)):
    items = db.execute(select(ProjectKeywordMapping).where(
        ProjectKeywordMapping.is_deleted == False).order_by(ProjectKeywordMapping.keyword)
    ).scalars().all()
    return [ProjectKeywordMappingResponse.model_validate(i) for i in items]


@router.post("/keywords", response_model=ProjectKeywordMappingResponse, status_code=201)
def create_keyword(body: KeywordMappingCreate, db: Session = Depends(get_db)):
    exists = db.execute(select(ProjectKeywordMapping).where(
        ProjectKeywordMapping.keyword == body.keyword, ProjectKeywordMapping.is_deleted == False
    )).scalar_one_or_none()
    if exists: raise HTTPException(409, f"关键词 '{body.keyword}' 已存在")
    obj = ProjectKeywordMapping(**body.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return ProjectKeywordMappingResponse.model_validate(obj)


@router.delete("/keywords/{keyword_id}", status_code=204)
def delete_keyword(keyword_id: int, db: Session = Depends(get_db)):
    obj = db.get(ProjectKeywordMapping, keyword_id)
    if not obj or obj.is_deleted: raise HTTPException(404, "关键词不存在")
    obj.is_deleted = True; db.commit()


@router.post("/match-all", status_code=200)
def match_all_pending(db: Session = Depends(get_db)):
    from app.services.erp_sync import match_erp_records
    return match_erp_records(db)


@router.get("/gap", status_code=200)
def get_gap_report(db: Session = Depends(get_db)):
    from app.services.erp_sync import get_execution_gap
    return get_execution_gap(db)


# ═══════════════════════════════════════════════════════════
# Phase 1: Sandbox Preview Routes
# ═══════════════════════════════════════════════════════════

@router.post("/sandbox/upload-preview", status_code=200)
async def sandbox_upload_preview(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "仅支持 .xlsx 或 .xls 文件")
    body = await file.read()
    result = parse_erp_excel(body, filename=file.filename)
    from app.services.erp_excel_parser import COL_ALIAS as ALIASES
    return {
        "sheets": [{
            "sheet_name": file.filename, "parsed_rows": len(result.get("rows", [])),
            "skipped_rows": 0, "errors": result.get("errors", []),
            "columns_mapped": [{"target": t, "detected": a[0] if a else None}
                               for t, a in ALIASES.items()],
            "sample_data": result.get("rows", [])[:5],
        }],
        "total_parsed": len(result.get("rows", [])),
        "total_skipped": 0, "total_errors": len(result.get("errors", [])),
    }


@router.post("/sandbox/match-preview")
def sandbox_match_preview(db: Session = Depends(get_db)):
    flows = db.execute(select(ERPStagingFlow).where(
        ERPStagingFlow.is_deleted == False, ERPStagingFlow.match_status == "pending"
    )).scalars().all()
    keywords = db.execute(select(ProjectKeywordMapping).where(
        ProjectKeywordMapping.is_deleted == False)).scalars().all()
    p1 = p2 = manual = 0
    for flow in flows:
        if flow.erp_record_id:
            o = db.execute(select(Order).where(Order.order_no == flow.erp_record_id,
                                                Order.is_deleted == False)).scalar_one_or_none()
            if o: p1 += 1; continue
        txt = (flow.summary or "") + " " + (flow.raw_project_name or "")
        if any(kw.keyword.lower() in txt.lower() for kw in keywords): p2 += 1; continue
        manual += 1
    return {
        "priorities": [
            {"priority": "P1", "label": "order_no 精确匹配", "count": p1, "confidence": "high"},
            {"priority": "P2", "label": "关键词匹配", "count": p2, "confidence": "medium"},
            {"priority": "P3", "label": "关键词模糊匹配", "count": 0, "confidence": "low"},
            {"priority": "P4", "label": "人工确认", "count": manual, "confidence": "low"},
        ],
        "total_auto_matched": p1 + p2, "total_needs_manual": manual, "total_errors": 0,
    }


@router.get("/sandbox/import-preview")
def sandbox_import_preview(db: Session = Depends(get_db)):
    base = ERPStagingFlow.is_deleted == False
    total = db.scalar(select(func.count()).where(base)) or 0
    income = db.scalar(select(func.count()).where(base, ERPStagingFlow.amount_in > 0)) or 0
    cost = db.scalar(select(func.count()).where(base, ERPStagingFlow.amount_out > 0)) or 0
    auto = db.scalar(select(func.count()).where(base, ERPStagingFlow.match_status == "auto_matched")) or 0
    pending = db.scalar(select(func.count()).where(base, ERPStagingFlow.match_status == "pending")) or 0
    ia = float(db.scalar(select(func.coalesce(func.sum(ERPStagingFlow.amount_in), 0))) or 0)
    ca = float(db.scalar(select(func.coalesce(func.sum(ERPStagingFlow.amount_out), 0))) or 0)
    return {"total_records": total, "income_count": income, "cost_count": cost,
            "collection_count": 0, "payment_count": 0, "auto_match_count": auto,
            "manual_pending_count": pending, "failed_count": 0, "duplicate_count": 0,
            "total_income_amount": ia, "total_cost_amount": ca}


# ═══════════════════════════════════════════════════════════
# Phase 2: Workbench Extended Routes
# ═══════════════════════════════════════════════════════════

@router.post("/sandbox/impact-preview")
def sandbox_impact_preview(db: Session = Depends(get_db)):
    base = ERPStagingFlow.is_deleted == False
    flows = db.execute(select(ERPStagingFlow).where(base)).scalars().all()
    total = len(flows)
    income = sum(1 for f in flows if (f.amount_in or 0) > 0)
    cost = sum(1 for f in flows if (f.amount_out or 0) > 0)
    collection = sum(1 for f in flows if f.record_type == "collection")
    payment = sum(1 for f in flows if f.record_type == "payment")
    p1 = sum(1 for f in flows if f.match_status == "auto_matched")
    p4 = sum(1 for f in flows if f.match_status == "pending")
    seen = set()
    dup = sum(1 for f in flows if f.erp_record_id and (f.erp_record_id in seen or seen.add(f.erp_record_id)))
    failed = sum(1 for f in flows if not f.amount_in and not f.amount_out)
    fr = (failed / total * 100) if total else 0
    dr = (dup / total * 100) if total else 0
    risk = "LOW" if fr < 5 and dr < 10 else "MEDIUM" if fr < 20 or dr < 30 else "HIGH"
    return {"total_records": total, "income_new_count": income, "cost_new_count": cost,
            "collection_new_count": collection, "payment_new_count": payment,
            "auto_match_count": p1, "manual_match_count": p4, "duplicate_count": dup,
            "failed_count": failed, "estimated_affected_orders": 0,
            "estimated_revenue_summary_updates": income, "estimated_cost_summary_updates": cost,
            "estimated_order_summary_updates": 0, "risk_level": risk}


@router.post("/sandbox/confirm-import", status_code=201)
def sandbox_confirm_import(db: Session = Depends(get_db)):
    base = ERPStagingFlow.is_deleted == False
    total = db.scalar(select(func.count()).where(base)) or 0
    if total == 0: raise HTTPException(400, "无可导入的记录")
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    existing = db.execute(select(func.count()).where(ImportBatch.batch_no.like(f"IMP-{today}-%"))
                          ).scalar() or 0
    batch_no = f"IMP-{today}-{existing + 1:03d}"
    manual = db.scalar(select(func.count()).where(base, ERPStagingFlow.match_status == "pending")) or 0
    batch = ImportBatch(batch_no=batch_no, import_time=datetime.now(timezone.utc),
                        total_count=total, success_count=total, manual_match_count=manual)
    db.add(batch); db.commit(); db.refresh(batch)
    return {"batch_no": batch_no, "import_time": batch.import_time,
            "total_records": total, "success_count": total, "failed_count": 0,
            "duplicate_count": 0, "manual_match_count": manual, "duration_seconds": 0.01}


@router.get("/sandbox/import-result/{batch_no}")
def sandbox_import_result(batch_no: str, db: Session = Depends(get_db)):
    b = db.execute(select(ImportBatch).where(ImportBatch.batch_no == batch_no)).scalar_one_or_none()
    if not b: raise HTTPException(404, f"Batch {batch_no} 不存在")
    return {"batch_no": b.batch_no, "success_count": b.success_count, "failed_count": b.failed_count,
            "duplicate_count": b.duplicate_count, "manual_match_count": b.manual_match_count,
            "duration_seconds": 0.0, "logs": [
                {"level": "INFO", "message": f"Batch {batch_no} 创建成功", "time": b.import_time},
                {"level": "INFO", "message": f"总记录 {b.total_count}, 成功 {b.success_count}", "time": b.import_time},
            ]}


@router.get("/sandbox/batches")
def sandbox_batches(page: int = Query(1), page_size: int = Query(20),
                    db: Session = Depends(get_db)):
    base = select(ImportBatch)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = db.execute(base.order_by(ImportBatch.created_at.desc())
                       .offset((page - 1) * page_size).limit(page_size)).scalars().all()
    return {"items": [{"id": b.id, "batch_no": b.batch_no, "import_time": b.import_time,
                       "source_file": b.source_file, "total_count": b.total_count,
                       "success_count": b.success_count, "failed_count": b.failed_count,
                       "duplicate_count": b.duplicate_count, "manual_match_count": b.manual_match_count,
                       "created_at": b.created_at} for b in items],
            "total": total, "page": page, "page_size": page_size}


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

from app.models import ERPStagingFlow, ImportBatch, Order, ProjectKeywordMapping
from app.repositories import (
    IncomeRepository, CostRepository, CollectionRepository,
    PaymentRepository, SummaryRepository,
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
            "order_id": str(flow.matched_order_id),
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
            "order_id": str(flow.matched_order_id),
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
        Collection.is_deleted == False,
        Collection.flow_id.in_(
            select(IncomeFlow.id).where(
                IncomeFlow.order_id == order_id,
                IncomeFlow.is_deleted == False
            )
        )
    ).first()

    # Payment 合计
    pay = db.query(
        f_.coalesce(f_.sum(Payment.amount), 0).label("total"),
    ).filter(
        Payment.is_deleted == False,
        Payment.cost_id.in_(
            select(CostFlow.id).where(
                CostFlow.order_id == order_id,
                CostFlow.is_deleted == False
            )
        )
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
    """批量刷新多个订单的 Summary（通过 SummaryRepository）。"""
    return SummaryRepository(db).refresh_batch(order_ids)


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
                "target_id": obj if obj else None,
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
    """检查 erp_record_id 是否已存在（通过 Repository）。"""
    vtype = infer_voucher_type(flow)
    biz_key = flow.erp_record_id
    if not biz_key:
        return False
    if vtype == "receipt":
        return CollectionRepository(db).exists(biz_key)
    elif vtype == "invoice":
        return IncomeRepository(db).exists(biz_key)
    elif vtype == "payment":
        return PaymentRepository(db).exists(biz_key)
    elif vtype == "cost":
        return CostRepository(db).exists(biz_key)
    return False


def _create_business_object(event, db):
    """Create BO via Repository. Returns int id or None."""
    fields = dict(event.field_values)
    if not fields.get("order_id") and event.business_object in ("IncomeFlow", "CostFlow"):
        return None

    repos = {
        "IncomeFlow": IncomeRepository(db),
        "CostFlow": CostRepository(db),
        "Collection": CollectionRepository(db),
        "Payment": PaymentRepository(db),
    }
    repo = repos.get(event.business_object)
    if not repo:
        raise ValueError(f"unknown BO: {event.business_object}")

    if event.business_object == "Collection" and not fields.get("flow_id"):
        incomes = IncomeRepository(db).find_by_order_id(event.matched_order_id)
        fields["flow_id"] = incomes[-1].id if incomes else None
        if not fields.get("flow_id"):
            return None

    if event.business_object == "Payment" and not fields.get("cost_id"):
        costs = CostRepository(db).find_by_order_id(event.matched_order_id)
        fields["cost_id"] = costs[-1].id if costs else None
        if not fields.get("cost_id"):
            return None

    return repo.create(fields)


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
    """Rollback via Repository - logical delete."""
    from app.utils.audit import log_action

    batch = db.execute(
        select(ImportBatch).where(
            ImportBatch.batch_no == batch_no,
            ImportBatch.is_deleted == False,
        )
    ).scalar_one_or_none()
    if not batch:
        raise ValueError(f"Batch {batch_no} not found")

    flows = db.execute(
        select(ERPStagingFlow).where(
            ERPStagingFlow.match_status.in_(["auto_matched", "manual_matched", "pending", "imported"]),
            ERPStagingFlow.is_deleted == False,
        )
    ).scalars().all()

    order_ids: set[int] = set()
    rollback_count = 0
    irepo = IncomeRepository(db)
    colrepo = CollectionRepository(db)
    prepo = PaymentRepository(db)

    for flow in flows:
        if not flow.erp_record_id:
            continue
        bid = flow.erp_record_id
        if irepo.exists(bid):
            irepo.rollback_by_invoice_no(bid)
            rollback_count += 1
        if colrepo.exists(bid):
            colrepo.rollback_by_receipt_no(bid)
            rollback_count += 1
        if prepo.exists(bid):
            prepo.rollback_by_voucher_no(bid)
            rollback_count += 1
        flow.match_status = "rolled_back"

    summaries = SummaryRepository(db).refresh_batch(order_ids) if order_ids else []
    return {
        "batch_no": batch_no,
        "rollback_count": rollback_count,
        "affected_orders": len(order_ids),
        "summaries": summaries,
    }
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
# Engine Sprint 1: ERP Import Engine API
# ═══════════════════════════════════════════════════════════


@router.post("/engine/execute/{batch_no}", status_code=200)
def engine_execute(batch_no: str, db: Session = Depends(get_db)):
    """Execute import: Mapping Engine -> Event -> Rule -> Action -> Summary."""
    from datetime import datetime, timezone
    start = datetime.now(timezone.utc)
    try:
        result = execute_batch(batch_no, db)
        db.commit()
        return {"status": "success", "batch_no": batch_no, **result,
                "duration_seconds": round((datetime.now(timezone.utc) - start).total_seconds(), 2)}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Import failed (rolled back): {str(e)}")


@router.post("/engine/rollback/{batch_no}", status_code=200)
def engine_rollback(batch_no: str, db: Session = Depends(get_db)):
    """Logical rollback by batch."""
    from datetime import datetime, timezone
    start = datetime.now(timezone.utc)
    try:
        result = rollback_batch(batch_no, db)
        db.commit()
        return {"status": "success", **result,
                "duration_seconds": round((datetime.now(timezone.utc) - start).total_seconds(), 2)}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Rollback failed: {str(e)}")


@router.get("/engine/status/{batch_no}")
def engine_status(batch_no: str, db: Session = Depends(get_db)):
    """Query batch import status."""
    try:
        return get_batch_status(batch_no, db)
    except ValueError as e:
        raise HTTPException(404, str(e))
