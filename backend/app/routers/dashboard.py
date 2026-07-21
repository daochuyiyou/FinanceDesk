"""Dashboard 只读聚合路由 — Summary KPI + 项目汇总 + 订单经营摘要。

所有 KPI 来自数据库聚合，禁止页面自行计算。
本文件是 FinanceDesk 的 Summary Engine（汇总层），
所有经营看板、订单工作台的数字必须引用此处的数据。

原则:
- PDD-006: 所有经营数字必须具有来源
- PDD-008: 所有 KPI 必须来自真实 Summary，禁止 Mock
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.contract_status import derive_contract_status, TERMINATED
from app.models import Collection, CostFlow, ERPStagingFlow, ImportBatch, IncomeFlow, Order, Payment, Project
from app.models.supplier import Supplier
from app.models.dict import SysDictionary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/objects")
def get_objects(
    db: Session = Depends(get_db),
    dimension: str = Query("contract", description="contract|project|order"),
):
    """获取业务对象列表，用于 BusinessAnalyzer ObjectSelector。"""
    if dimension == "contract":
        rows = db.execute(text("""
            SELECT id AS value, framework_name AS label
            FROM project WHERE is_deleted = 0
            ORDER BY framework_name ASC
        """)).mappings().all()
    elif dimension == "project":
        rows = db.execute(text("""
            SELECT DISTINCT o.project_id AS value, p.framework_name AS label
            FROM "order" o
            JOIN project p ON p.id = o.project_id AND p.is_deleted = 0
            WHERE o.is_deleted = 0
            ORDER BY p.framework_name ASC
        """)).mappings().all()
    elif dimension == "order":
        rows = db.execute(text("""
            SELECT o.id AS value, (o.order_no || ' — ' || o.order_name) AS label
            FROM "order" o WHERE o.is_deleted = 0
            ORDER BY o.order_no ASC
        """)).mappings().all()
    else:
        return []
    return [dict(r) for r in rows]


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    period: str | None = Query(None, description="YYYY-MM"),
    project_id: str | None = Query(None, description="Filter by project/contract ID"),
):
    def _filter_by_period(base_q, date_col):
        if period:
            return base_q.where(text(f"strftime('%Y-%m', {date_col}) = :per")).params(per=period)
        return base_q

    proj_q = db.query(func.count()).select_from(Project).where(Project.is_deleted == False)
    if project_id:
        proj_q = proj_q.where(Project.id == project_id)

    order_q = db.query(func.count()).select_from(Order).where(Order.is_deleted == False)
    if project_id:
        order_q = order_q.where(Order.project_id == project_id)

    contract_q = db.query(func.sum(Order.amount)).where(Order.is_deleted == False)
    if project_id:
        contract_q = contract_q.where(Order.project_id == project_id)

    inv_q = db.query(func.sum(IncomeFlow.taxable_amount)).where(IncomeFlow.is_deleted == False)
    if period:
        inv_q = _filter_by_period(inv_q, "invoice_date")
    if project_id:
        inv_q = inv_q.where(IncomeFlow.order_id.in_(
            db.query(Order.id).where(Order.project_id == project_id).subquery()
        ))

    cost_q = db.query(func.sum(CostFlow.taxable_amount)).where(CostFlow.is_deleted == False)
    if period:
        cost_q = _filter_by_period(cost_q, "business_date")
    if project_id:
        cost_q = cost_q.where(CostFlow.order_id.in_(
            db.query(Order.id).where(Order.project_id == project_id).subquery()
        ))

    col_q = db.query(func.sum(Collection.amount)).where(Collection.is_deleted == False)
    if period:
        col_q = _filter_by_period(col_q, "collection_date")
    if project_id:
        col_q = col_q.where(Collection.flow_id.in_(
            db.query(IncomeFlow.id).where(IncomeFlow.order_id.in_(
                db.query(Order.id).where(Order.project_id == project_id).subquery()
            )).subquery()
        ))

    pay_q = db.query(func.sum(Payment.amount)).where(Payment.is_deleted == False)
    if period:
        pay_q = _filter_by_period(pay_q, "payment_date")
    if project_id:
        pay_q = pay_q.where(Payment.cost_id.in_(
            db.query(CostFlow.id).where(CostFlow.order_id.in_(
                db.query(Order.id).where(Order.project_id == project_id).subquery()
            )).subquery()
        ))

    project_count = proj_q.scalar() or 0
    total_order_count = order_q.scalar() or 0
    total_contract = contract_q.scalar() or 0
    total_invoiced = inv_q.scalar() or 0
    total_income = inv_q.scalar() or 0
    total_cost = cost_q.scalar() or 0
    total_collected = col_q.scalar() or 0
    total_paid = pay_q.scalar() or 0

    income_f = float(total_income)
    cost_f = float(total_cost)

    return {
        "project_count": project_count,
        "total_order_count": total_order_count,
        "total_contract_amount": float(total_contract),
        "total_invoiced_amount": float(total_invoiced),
        "total_income": income_f,
        "total_cost": cost_f,
        "total_profit": income_f - cost_f,
        "total_collected": float(total_collected),
        "total_paid": float(total_paid),
        "total_receivable_amount": float(total_invoiced) - float(total_collected),
        "completion_rate": round(
            (float(total_collected) / income_f * 100) if income_f > 0 else 0, 1
        ),
        "profit_rate": round(
            ((income_f - cost_f) / income_f * 100) if income_f > 0 else 0, 1
        ),
        "collection_rate": round(
            (float(total_collected) / income_f * 100) if income_f > 0 else 0, 1
        ),
        "cost_rate": round(
            (cost_f / income_f * 100) if income_f > 0 else 0, 1
        ),
        "supplier_count": db.query(func.count()).select_from(Supplier).where(Supplier.is_deleted == False).scalar() or 0,
        "dict_count": db.query(func.count()).select_from(SysDictionary).scalar() or 0,
    }


@router.get("/project-summary")
def project_summary(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            p.id AS project_id,
            p.framework_name AS project_name,
            COALESCE(ord.order_count, 0) AS order_count,
            COALESCE(ord.total_amount, 0) AS total_amount,
            COALESCE(inc.total_invoiced, 0) AS total_invoiced,
            COALESCE(inc.total_income, 0) AS total_income,
            COALESCE(cst.total_cost, 0) AS total_cost,
            COALESCE(inc.total_income, 0) - COALESCE(cst.total_cost, 0) AS gross_profit,
            COALESCE(col.total_collected, 0) AS total_collected,
            COALESCE(pmt.total_paid, 0) AS total_paid,
            COALESCE(inc.total_invoiced, 0) - COALESCE(col.total_collected, 0) AS receivable_balance
        FROM project p
        LEFT JOIN (
            SELECT project_id, COUNT(*) AS order_count, SUM(amount) AS total_amount
            FROM "order" WHERE is_deleted = 0 GROUP BY project_id
        ) ord ON ord.project_id = p.id
        LEFT JOIN (
            SELECT o.project_id,
                   SUM(i.taxable_amount) AS total_invoiced,
                   SUM(i.taxable_amount) AS total_income
            FROM income_flow i JOIN "order" o ON o.id = i.order_id AND o.is_deleted = 0
            WHERE i.is_deleted = 0 GROUP BY o.project_id
        ) inc ON inc.project_id = p.id
        LEFT JOIN (
            SELECT o.project_id, SUM(co.taxable_amount) AS total_cost
            FROM cost_flow co JOIN "order" o ON o.id = co.order_id AND o.is_deleted = 0
            WHERE co.is_deleted = 0 GROUP BY o.project_id
        ) cst ON cst.project_id = p.id
        LEFT JOIN (
            SELECT o.project_id, SUM(c.amount) AS total_collected
            FROM collection c
            JOIN income_flow i ON i.id = c.flow_id AND i.is_deleted = 0
            JOIN "order" o ON o.id = i.order_id AND o.is_deleted = 0
            WHERE c.is_deleted = 0 GROUP BY o.project_id
        ) col ON col.project_id = p.id
        LEFT JOIN (
            SELECT o.project_id, SUM(p.amount) AS total_paid
            FROM payment p
            JOIN cost_flow co ON co.id = p.cost_id AND co.is_deleted = 0
            JOIN "order" o ON o.id = co.order_id AND o.is_deleted = 0
            WHERE p.is_deleted = 0 GROUP BY o.project_id
        ) pmt ON pmt.project_id = p.id
        WHERE p.is_deleted = 0
        
        ORDER BY total_amount DESC
    """)).mappings().all()
    return [dict(r) for r in rows]


@router.get("/order-detail/{project_id}")
def order_detail(project_id: str, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            o.id AS order_id,
            o.order_no AS order_name,
            COALESCE(inc.total_invoiced, 0) AS total_invoiced,
            COALESCE(col.total_collected, 0) AS total_collected,
            COALESCE(cst.total_cost, 0) AS total_cost,
            COALESCE(pmt.total_paid, 0) AS total_paid
        FROM "order" o
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS total_invoiced
            FROM income_flow WHERE is_deleted = 0 GROUP BY order_id
        ) inc ON inc.order_id = o.id
        LEFT JOIN (
            SELECT i.order_id, SUM(c.amount) AS total_collected
            FROM collection c JOIN income_flow i ON i.id = c.flow_id AND i.is_deleted = 0
            WHERE c.is_deleted = 0 GROUP BY i.order_id
        ) col ON col.order_id = o.id
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS total_cost
            FROM cost_flow WHERE is_deleted = 0 GROUP BY order_id
        ) cst ON cst.order_id = o.id
        LEFT JOIN (
            SELECT co.order_id, SUM(p.amount) AS total_paid
            FROM payment p JOIN cost_flow co ON co.id = p.cost_id AND co.is_deleted = 0
            WHERE p.is_deleted = 0
         GROUP BY co.order_id
        ) pmt ON pmt.order_id = o.id
        WHERE o.project_id = :pid AND o.is_deleted = 0
        ORDER BY o.created_at DESC
    """), {"pid": project_id}).mappings().all()
    return [dict(r) for r in rows]


@router.get("/ar-aging")
def ar_aging(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            p.id AS project_id,
            p.framework_name AS project_name,
            COALESCE(age.within_30, 0) AS within_30,
            COALESCE(age.days_31_60, 0) AS days_31_60,
            COALESCE(age.days_61_90, 0) AS days_61_90,
            COALESCE(age.over_90, 0) AS over_90,
            COALESCE(age.total_invoiced, 0) AS total_ar
        FROM project p
        LEFT JOIN (
            SELECT o.project_id,
                   SUM(CASE WHEN julianday('now') - julianday(i.invoice_date) <= 30 THEN i.taxable_amount ELSE 0 END) AS within_30,
                   SUM(CASE WHEN julianday('now') - julianday(i.invoice_date) BETWEEN 31 AND 60 THEN i.taxable_amount ELSE 0 END) AS days_31_60,
                   SUM(CASE WHEN julianday('now') - julianday(i.invoice_date) BETWEEN 61 AND 90 THEN i.taxable_amount ELSE 0 END) AS days_61_90,
                   SUM(CASE WHEN julianday('now') - julianday(i.invoice_date) > 90 THEN i.taxable_amount ELSE 0 END) AS over_90,
                   SUM(i.taxable_amount) AS total_invoiced
            FROM income_flow i
            JOIN "order" o ON o.id = i.order_id AND o.is_deleted = 0
            WHERE i.is_deleted = 0 GROUP BY o.project_id
        ) age ON age.project_id = p.id
        WHERE p.is_deleted = 0
        
        ORDER BY total_ar DESC
    """)).mappings().all()
    return [dict(r) for r in rows]


@router.get("/project-profit")
def project_profit(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            p.id AS project_id,
            p.framework_name AS project_name,
            COALESCE(inc.total_income, 0) AS total_income,
            COALESCE(cst.total_cost, 0) AS total_cost,
            COALESCE(inc.total_income, 0) - COALESCE(cst.total_cost, 0) AS gross_profit,
            CASE WHEN COALESCE(inc.total_income, 0) > 0
                THEN ROUND((COALESCE(inc.total_income, 0) - COALESCE(cst.total_cost, 0)) / COALESCE(inc.total_income, 0) * 100, 2)
                ELSE 0
            END AS gross_margin
        FROM project p
        LEFT JOIN (
            SELECT o.project_id, SUM(i.taxable_amount) AS total_income
            FROM income_flow i JOIN "order" o ON o.id = i.order_id AND o.is_deleted = 0
            WHERE i.is_deleted = 0 GROUP BY o.project_id
        ) inc ON inc.project_id = p.id
        LEFT JOIN (
            SELECT o.project_id, SUM(co.taxable_amount) AS total_cost
            FROM cost_flow co JOIN "order" o ON o.id = co.order_id AND o.is_deleted = 0
            WHERE co.is_deleted = 0 GROUP BY o.project_id
        ) cst ON cst.project_id = p.id
        WHERE p.is_deleted = 0
        
        ORDER BY gross_profit DESC
    """)).mappings().all()
    return [dict(r) for r in rows]


@router.get("/batch-order-summary")
def batch_order_summary(
    project_id: str | None = Query(None, description="按项目筛选"),
    order_id: int | None = Query(None, description="按订单筛选"),
    db: Session = Depends(get_db),
):
    where_clause = "WHERE o.is_deleted = 0"
    params = {}
    if project_id:
        where_clause += " AND o.project_id = :pid"
        params["pid"] = project_id
    if order_id:
        where_clause += " AND o.id = :oid"
        params["oid"] = order_id

    rows = db.execute(text(f"""
        SELECT
            o.id AS order_id,
            o.order_no,
            o.order_name,
            o.amount AS order_amount,
            COALESCE(inc.income_total, 0) AS income_total,
            COALESCE(col.collection_total, 0) AS collection_total,
            COALESCE(cst.cost_total, 0) AS cost_total,
            COALESCE(pmt.payment_total, 0) AS payment_total,
            COALESCE(inc.income_total, 0) - COALESCE(cst.cost_total, 0) AS profit,
            o.amount - COALESCE(inc.income_total, 0) AS revenue_gap,
            COALESCE(cst.cost_total, 0) - COALESCE(pmt.payment_total, 0) AS cost_gap,
            o.updated_at
        FROM "order" o
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS income_total
            FROM income_flow WHERE is_deleted = 0 GROUP BY order_id
        ) inc ON inc.order_id = o.id
        LEFT JOIN (
            SELECT i.order_id, SUM(c.amount) AS collection_total
            FROM collection c JOIN income_flow i ON i.id = c.flow_id AND i.is_deleted = 0
            WHERE c.is_deleted = 0 GROUP BY i.order_id
        ) col ON col.order_id = o.id
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS cost_total
            FROM cost_flow WHERE is_deleted = 0 GROUP BY order_id
        ) cst ON cst.order_id = o.id
        LEFT JOIN (
            SELECT co.order_id, SUM(p.amount) AS payment_total
            FROM payment p JOIN cost_flow co ON co.id = p.cost_id AND co.is_deleted = 0
            WHERE p.is_deleted = 0
         GROUP BY co.order_id
        ) pmt ON pmt.order_id = o.id
        {where_clause}
        ORDER BY o.created_at DESC
    """), params).mappings().all()

    result = []
    for r in rows:
        d = dict(r)
        income = float(d.get("income_total", 0) or 0)
        collection = float(d.get("collection_total", 0) or 0)
        cost = float(d.get("cost_total", 0) or 0)
        payment = float(d.get("payment_total", 0) or 0)
        order_amt = float(d.get("order_amount", 0) or 0)

        if income == 0 and cost == 0:
            status = "\u5f85\u5f00\u7968"
        elif income > 0 and collection == 0:
            status = "\u5f85\u56de\u6b3e"
        elif 0 < collection < income:
            status = "\u90e8\u5206\u56de\u6b3e"
        elif cost > 0 and payment == 0:
            status = "\u5f85\u4ed8\u6b3e"
        elif 0 < payment < cost:
            status = "\u90e8\u5206\u4ed8\u6b3e"
        elif cost > order_amt:
            status = "\u6210\u672c\u8d85\u652f"
        elif income > 0 and (income - cost) < 0:
            status = "\u5229\u6da6\u5f02\u5e38"
        else:
            status = "\u6b63\u5e38"

        if income == 0 and cost == 0:
            next_action = "\u7b49\u5f85\u5f55\u6536\u5165 / \u7b49\u5f85\u5f55\u6210\u672c"
        elif income > collection and collection == 0:
            next_action = "\u7b49\u5f85\u6536\u6b3e"
        elif cost > payment and payment == 0:
            next_action = "\u7b49\u5f85\u4ed8\u6b3e"
        elif income > collection:
            next_action = "\u7ee7\u7eed\u6536\u6b3e"
        elif cost > payment:
            next_action = "\u7ee7\u7eed\u5b89\u6392\u4ed8\u6b3e"
        else:
            next_action = "\u5df2\u5b8c\u6210"

        d["status"] = status
        d["next_action"] = next_action
        d["owner"] = ""
        d["updated_at"] = str(d.get("updated_at", "")) if d.get("updated_at") else ""
        result.append(d)

    return result
@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """经营异常列表 — 6 类异常，按严重程度排序，Top 20。

    异常类型:
    - overdue_collection: 超期未回款
    - overdue_payment:   超期未付款
    - revenue_gap:       收入 Gap
    - cost_gap:          成本 Gap
    - erp_unmatched:     ERP 未匹配
    - profit_abnormal:   利润异常
    """
    alerts = []

    # ① 超期未回款: income > 0 AND collection < income
    rows = db.execute(text("""
        SELECT DISTINCT o.id, o.order_no, o.order_name,
               COALESCE(inc.income_total, 0) AS income_total,
               COALESCE(col.collection_total, 0) AS collection_total,
               COALESCE(inc.income_total, 0) - COALESCE(col.collection_total, 0) AS gap,
               latest.inv_date AS invoice_date,
               julianday('now') - julianday(latest.inv_date) AS overdue_days
        FROM "order" o
        LEFT JOIN (
            SELECT order_id, MAX(invoice_date) AS inv_date
            FROM income_flow WHERE is_deleted = 0 GROUP BY order_id
        ) latest ON latest.order_id = o.id
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS income_total
            FROM income_flow WHERE is_deleted = 0 GROUP BY order_id
        ) inc ON inc.order_id = o.id
        LEFT JOIN (
            SELECT i2.order_id, SUM(c.amount) AS collection_total
            FROM collection c JOIN income_flow i2 ON i2.id = c.flow_id AND i2.is_deleted = 0
            WHERE c.is_deleted = 0 GROUP BY i2.order_id
        ) col ON col.order_id = o.id
        WHERE o.is_deleted = 0
          AND COALESCE(inc.income_total, 0) > 0
          AND COALESCE(inc.income_total, 0) > COALESCE(col.collection_total, 0)
          AND latest.inv_date IS NOT NULL
          AND julianday('now') - julianday(latest.inv_date) > 30
        ORDER BY gap DESC
        LIMIT 10
    """)).mappings().all()
    for r in rows:
        alerts.append({
            "type": "overdue_collection",
            "severity": "critical",
            "title": f"{r['order_name'] or r['order_no']} — 超期未回款 ¥{float(r['gap'] or 0):,.2f}",
            "order_id": r['id'],
            "order_no": r['order_no'],
            "amount": float(r['gap'] or 0),
            "detail": f"应回款 ¥{float(r['income_total'] or 0):,.2f}，已回款 ¥{float(r['collection_total'] or 0):,.2f}，超期 {int(r['overdue_days'] or 0)} 天",
            "action": "view_order",
        })

    # ② 超期未付款
    rows2 = db.execute(text("""
        SELECT o.id, o.order_no, o.order_name,
               COALESCE(cst.cost_total, 0) AS cost_total,
               COALESCE(pmt.payment_total, 0) AS payment_total,
               COALESCE(cst.cost_total, 0) - COALESCE(pmt.payment_total, 0) AS gap,
               co.created_at AS cost_date,
               julianday('now') - julianday(co.created_at) AS overdue_days
        FROM "order" o
        JOIN cost_flow co ON co.order_id = o.id AND co.is_deleted = 0
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS cost_total
            FROM cost_flow WHERE is_deleted = 0 GROUP BY order_id
        ) cst ON cst.order_id = o.id
        LEFT JOIN (
            SELECT co2.order_id, SUM(p.amount) AS payment_total
            FROM payment p JOIN cost_flow co2 ON co2.id = p.cost_id AND co2.is_deleted = 0
            WHERE p.is_deleted = 0
         GROUP BY co2.order_id
        ) pmt ON pmt.order_id = o.id
        WHERE o.is_deleted = 0
          AND COALESCE(cst.cost_total, 0) > 0
          AND COALESCE(cst.cost_total, 0) > COALESCE(pmt.payment_total, 0)
          AND julianday('now') - julianday(co.created_at) > 30
        ORDER BY gap DESC
        LIMIT 10
    """)).mappings().all()
    for r in rows2:
        alerts.append({
            "type": "overdue_payment",
            "severity": "critical",
            "title": f"{r['order_name'] or r['order_no']} — 超期未付款 ¥{float(r['gap'] or 0):,.2f}",
            "order_id": r['id'],
            "order_no": r['order_no'],
            "amount": float(r['gap'] or 0),
            "detail": f"应付 ¥{float(r['cost_total'] or 0):,.2f}，已付 ¥{float(r['payment_total'] or 0):,.2f}，超期 {int(r['overdue_days'] or 0)} 天",
            "action": "view_order",
        })

    # ③ 收入 Gap
    rows3 = db.execute(text("""
        SELECT o.id, o.order_no, o.order_name, o.amount,
               COALESCE(inc.income_total, 0) AS income_total,
               o.amount - COALESCE(inc.income_total, 0) AS gap
        FROM "order" o
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS income_total
            FROM income_flow WHERE is_deleted = 0 GROUP BY order_id
        ) inc ON inc.order_id = o.id
        WHERE o.is_deleted = 0 AND o.amount - COALESCE(inc.income_total, 0) > 0
        ORDER BY gap DESC
        LIMIT 10
    """)).mappings().all()
    for r in rows3:
        alerts.append({
            "type": "revenue_gap",
            "severity": "warning",
            "title": f"{r['order_name'] or r['order_no']} — 收入 Gap ¥{float(r['gap'] or 0):,.2f}",
            "order_id": r['id'],
            "order_no": r['order_no'],
            "amount": float(r['gap'] or 0),
            "detail": f"合同金额 ¥{float(r['amount'] or 0):,.2f}，已开票 ¥{float(r['income_total'] or 0):,.2f}",
            "action": "view_order",
        })

    # ④ 成本 Gap
    rows4 = db.execute(text("""
        SELECT o.id, o.order_no, o.order_name,
               COALESCE(cst.cost_total, 0) AS cost_total,
               COALESCE(pmt.payment_total, 0) AS payment_total,
               COALESCE(cst.cost_total, 0) - COALESCE(pmt.payment_total, 0) AS gap
        FROM "order" o
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS cost_total
            FROM cost_flow WHERE is_deleted = 0 GROUP BY order_id
        ) cst ON cst.order_id = o.id
        LEFT JOIN (
            SELECT co.order_id, SUM(p.amount) AS payment_total
            FROM payment p JOIN cost_flow co ON co.id = p.cost_id AND co.is_deleted = 0
            WHERE p.is_deleted = 0
         GROUP BY co.order_id
        ) pmt ON pmt.order_id = o.id
        WHERE o.is_deleted = 0
          AND COALESCE(cst.cost_total, 0) > COALESCE(pmt.payment_total, 0)
          AND COALESCE(cst.cost_total, 0) > 0
        ORDER BY gap DESC
        LIMIT 10
    """)).mappings().all()
    for r in rows4:
        alerts.append({
            "type": "cost_gap",
            "severity": "warning",
            "title": f"{r['order_name'] or r['order_no']} — 成本 Gap ¥{float(r['gap'] or 0):,.2f}",
            "order_id": r['id'],
            "order_no": r['order_no'],
            "amount": float(r['gap'] or 0),
            "detail": f"已确认成本 ¥{float(r['cost_total'] or 0):,.2f}，已付款 ¥{float(r['payment_total'] or 0):,.2f}",
            "action": "view_order",
        })

    # ⑤ ERP 未匹配
    erp_count = db.query(func.count()).select_from(ERPStagingFlow).where(
        ERPStagingFlow.match_status == "pending",
        ERPStagingFlow.is_deleted == False,
    ).scalar() or 0
    if erp_count > 0:
        alerts.append({
            "type": "erp_unmatched",
            "severity": "info",
            "title": f"ERP 未匹配流水 — {erp_count} 条",
            "order_id": None,
            "order_no": None,
            "amount": erp_count,
            "detail": f"共 {erp_count} 条 ERP 流水尚未匹配到项目/订单",
            "action": "view_erp",
        })

    # ⑥ 利润异常
    rows6 = db.execute(text("""
        SELECT o.id, o.order_no, o.order_name, o.amount,
               COALESCE(inc.income_total, 0) AS income_total,
               COALESCE(cst.cost_total, 0) AS cost_total,
               COALESCE(inc.income_total, 0) - COALESCE(cst.cost_total, 0) AS profit
        FROM "order" o
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS income_total
            FROM income_flow WHERE is_deleted = 0 GROUP BY order_id
        ) inc ON inc.order_id = o.id
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS cost_total
            FROM cost_flow WHERE is_deleted = 0 GROUP BY order_id
        ) cst ON cst.order_id = o.id
        WHERE o.is_deleted = 0
          AND COALESCE(inc.income_total, 0) > 0
          AND COALESCE(inc.income_total, 0) - COALESCE(cst.cost_total, 0) < 0
        ORDER BY profit ASC
        LIMIT 10
    """)).mappings().all()
    for r in rows6:
        alerts.append({
            "type": "profit_abnormal",
            "severity": "critical",
            "title": f"{r['order_name'] or r['order_no']} — 利润异常 ¥{float(r['profit'] or 0):,.2f}",
            "order_id": r['id'],
            "order_no": r['order_no'],
            "amount": float(r['profit'] or 0),
            "detail": f"收入 ¥{float(r['income_total'] or 0):,.2f}，成本 ¥{float(r['cost_total'] or 0):,.2f}，亏损 ¥{abs(float(r['profit'] or 0)):,.2f}",
            "action": "view_order",
        })

    return alerts



@router.get("/cashflow-trend")
def cashflow_trend(
    db: Session = Depends(get_db),
    project_id: str | None = Query(None, description="Filter by project/contract ID"),
):
    """月度现金流趋势 — 近 12 个月 收入/回款/付款/成本。"""
    order_filter = ""
    params = {}
    if project_id:
        order_filter = " AND o.project_id = :pid"
        params["pid"] = project_id

    rows = db.execute(text(f"""
        WITH months AS (
            SELECT strftime('%Y-%m', 'now', '-' || (n || ' month')) AS month
            FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
                  UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
                  UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11)
        ),
        inc_cte AS (
            SELECT strftime('%Y-%m', i.invoice_date) AS month,
                   SUM(i.taxable_amount) AS total
            FROM income_flow i
            JOIN "order" o ON o.id = i.order_id AND o.is_deleted = 0
            WHERE i.is_deleted = 0 AND i.invoice_date IS NOT NULL{order_filter}
            GROUP BY month
        ),
        cst_cte AS (
            SELECT strftime('%Y-%m', co.business_date) AS month,
                   SUM(co.taxable_amount) AS total
            FROM cost_flow co
            JOIN "order" o ON o.id = co.order_id AND o.is_deleted = 0
            WHERE co.is_deleted = 0 AND co.business_date IS NOT NULL{order_filter}
            GROUP BY month
        ),
        col_cte AS (
            SELECT strftime('%Y-%m', c.collection_date) AS month,
                   SUM(c.amount) AS total
            FROM collection c
            JOIN income_flow i ON i.id = c.flow_id AND i.is_deleted = 0
            JOIN "order" o ON o.id = i.order_id AND o.is_deleted = 0
            WHERE c.is_deleted = 0 AND c.collection_date IS NOT NULL{order_filter}
            GROUP BY month
        ),
        pmt_cte AS (
            SELECT strftime('%Y-%m', p.payment_date) AS month,
                   SUM(p.amount) AS total
            FROM payment p
            JOIN cost_flow co ON co.id = p.cost_id AND co.is_deleted = 0
            JOIN "order" o ON o.id = co.order_id AND o.is_deleted = 0
            WHERE p.is_deleted = 0
         AND p.payment_date IS NOT NULL{order_filter}
            GROUP BY month
        )
        SELECT m.month,
               COALESCE(inc.total, 0) AS income,
               COALESCE(col.total, 0) AS collection,
               COALESCE(cst.total, 0) AS cost,
               COALESCE(pmt.total, 0) AS payment
        FROM months m
        LEFT JOIN inc_cte AS inc ON inc.month = m.month
        LEFT JOIN col_cte AS col ON col.month = m.month
        LEFT JOIN cst_cte AS cst ON cst.month = m.month
        LEFT JOIN pmt_cte AS pmt ON pmt.month = m.month
        ORDER BY m.month ASC
    """), params).mappings().all()
    result = []
    for r in rows:
        d = dict(r)
        d["income"] = float(d.get("income", 0) or 0)
        d["collection"] = float(d.get("collection", 0) or 0)
        d["cost"] = float(d.get("cost", 0) or 0)
        d["payment"] = float(d.get("payment", 0) or 0)
        result.append(d)
    return result


@router.get("/todos")
def get_todos(db: Session = Depends(get_db)):
    """今日待办 — 6 类待完成事项，按优先级排序。"""
    todos = []

    # ① 等待确认收入: orders with income = 0
    income_pending = db.execute(text("""
        SELECT COUNT(*) AS cnt FROM "order" o
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS income_total
            FROM income_flow WHERE is_deleted = 0 GROUP BY order_id
        ) inc ON inc.order_id = o.id
        WHERE o.is_deleted = 0 AND COALESCE(inc.income_total, 0) = 0
    """)).scalar() or 0
    if income_pending > 0:
        todos.append({
            "type": "income_pending",
            "title": "等待确认收入",
            "count": income_pending,
            "severity": income_pending > 5 and "warning" or "info",
            "action": "view_incomes",
        })

    # ② 等待确认成本
    cost_pending = db.execute(text("""
        SELECT COUNT(*) AS cnt FROM "order" o
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS cost_total
            FROM cost_flow WHERE is_deleted = 0 GROUP BY order_id
        ) cst ON cst.order_id = o.id
        WHERE o.is_deleted = 0 AND COALESCE(cst.cost_total, 0) = 0
    """)).scalar() or 0
    if cost_pending > 0:
        todos.append({
            "type": "cost_pending",
            "title": "等待确认成本",
            "count": cost_pending,
            "severity": cost_pending > 5 and "warning" or "info",
            "action": "view_costs",
        })

    # ③ 等待确认付款
    pay_pending = db.execute(text("""
        SELECT COUNT(*) AS cnt FROM "order" o
        LEFT JOIN (
            SELECT order_id, SUM(taxable_amount) AS cost_total
            FROM cost_flow WHERE is_deleted = 0 GROUP BY order_id
        ) cst ON cst.order_id = o.id
        LEFT JOIN (
            SELECT co.order_id, SUM(p.amount) AS payment_total
            FROM payment p JOIN cost_flow co ON co.id = p.cost_id AND co.is_deleted = 0
            WHERE p.is_deleted = 0
         GROUP BY co.order_id
        ) pmt ON pmt.order_id = o.id
        WHERE o.is_deleted = 0
          AND COALESCE(cst.cost_total, 0) > 0
          AND COALESCE(pmt.payment_total, 0) = 0
    """)).scalar() or 0
    if pay_pending > 0:
        todos.append({
            "type": "payment_pending",
            "title": "等待确认付款",
            "count": pay_pending,
            "severity": pay_pending > 3 and "warning" or "info",
            "action": "view_payments",
        })

    # ④ 等待人工匹配
    erp_pending = db.query(func.count()).select_from(ERPStagingFlow).where(
        ERPStagingFlow.match_status == "pending",
        ERPStagingFlow.is_deleted == False,
    ).scalar() or 0
    if erp_pending > 0:
        todos.append({
            "type": "erp_match_pending",
            "title": "等待人工匹配",
            "count": erp_pending,
            "severity": "warning",
            "action": "view_erp",
        })

    # ⑤ 等待导入ERP
    pending_imports = db.query(func.count()).select_from(ImportBatch).count() or 0
    if pending_imports > 0:
        todos.append({
            "type": "import_pending",
            "title": "等待导入ERP",
            "count": pending_imports,
            "severity": "info",
            "action": "view_erp",
        })

    # ⑥ 等待项目关闭: projects with end_date in past and not closed
    # Simplified: count projects
    project_count = db.query(func.count()).select_from(Project).where(
        Project.is_deleted == False,
    ).scalar() or 0

    return todos





# ════════════════════════════════════════════════════════════════
# Contract Summary — 合同经营工作台数据源
# ════════════════════════════════════════════════════════════════


@router.get("/contract-summary")
def contract_summary(
    period: str | None = Query(None, description="经营期间 (YYYY-MM)，按签单月份筛选"),
    db: Session = Depends(get_db),
):
    """合同经营摘要 — Contract Business Workbench 数据源。

    每个合同（Project）一行，包含完整经营 KPI：
    contract_no, contract_name, contract_amount, contract_type, manager, status,
    order_count, project_count, total_income, total_cost, gross_profit, gross_margin,
    total_collected, total_paid, revenue_gap, cost_gap, completion_rate。
    """
    rows = db.execute(text("""
        SELECT
            p.id AS contract_id,
            p.contract_no,
            p.framework_name AS contract_name,
            p.contract_type,
            p.manager,
            p.status,
            p.contract_amount,
            COALESCE(ord.order_count, 0) AS order_count,
            COALESCE(ord.total_amount, 0) AS order_total_amount,
            COALESCE(inc.total_income, 0) AS total_income,
            COALESCE(cst.total_cost, 0) AS total_cost,
            COALESCE(inc.total_income, 0) - COALESCE(cst.total_cost, 0) AS gross_profit,
            CASE WHEN COALESCE(inc.total_income, 0) > 0
                THEN ROUND((COALESCE(inc.total_income, 0) - COALESCE(cst.total_cost, 0)) / COALESCE(inc.total_income, 0) * 100, 1)
                ELSE 0
            END AS gross_margin,
            COALESCE(col.total_collected, 0) AS total_collected,
            COALESCE(pmt.total_paid, 0) AS total_paid,
            COALESCE(inc.total_income, 0) - COALESCE(col.total_collected, 0) AS revenue_gap,
            COALESCE(cst.total_cost, 0) - COALESCE(pmt.total_paid, 0) AS cost_gap,
            CASE WHEN COALESCE(inc.total_income, 0) > 0
                THEN ROUND(COALESCE(col.total_collected, 0) / COALESCE(inc.total_income, 0) * 100, 1)
                ELSE 0
            END AS completion_rate
        FROM project p
        LEFT JOIN (
            SELECT project_id, COUNT(*) AS order_count, SUM(amount) AS total_amount
            FROM "order" WHERE is_deleted = 0 GROUP BY project_id
        ) ord ON ord.project_id = p.id
        LEFT JOIN (
            SELECT o.project_id, SUM(i.taxable_amount) AS total_income
            FROM income_flow i JOIN "order" o ON o.id = i.order_id AND o.is_deleted = 0
            WHERE i.is_deleted = 0 GROUP BY o.project_id
        ) inc ON inc.project_id = p.id
        LEFT JOIN (
            SELECT o.project_id, SUM(co.taxable_amount) AS total_cost
            FROM cost_flow co JOIN "order" o ON o.id = co.order_id AND o.is_deleted = 0
            WHERE co.is_deleted = 0 GROUP BY o.project_id
        ) cst ON cst.project_id = p.id
        LEFT JOIN (
            SELECT o.project_id, SUM(c.amount) AS total_collected
            FROM collection c
            JOIN income_flow i ON i.id = c.flow_id AND i.is_deleted = 0
            JOIN "order" o ON o.id = i.order_id AND o.is_deleted = 0
            WHERE c.is_deleted = 0 GROUP BY o.project_id
        ) col ON col.project_id = p.id
        LEFT JOIN (
            SELECT o.project_id, SUM(p.amount) AS total_paid
            FROM payment p
            JOIN cost_flow co ON co.id = p.cost_id AND co.is_deleted = 0
            JOIN "order" o ON o.id = co.order_id AND o.is_deleted = 0
            WHERE p.is_deleted = 0 GROUP BY o.project_id
        ) pmt ON pmt.project_id = p.id
        WHERE p.is_deleted = 0
        
        ORDER BY p.contract_amount DESC
    """)).mappings().all()

    result = []
    for r in rows:
        d = dict(r)
        income = float(d.get("total_income", 0) or 0)
        cost = float(d.get("total_cost", 0) or 0)
        collection = float(d.get("total_collected", 0) or 0)
        payment = float(d.get("total_paid", 0) or 0)

        # Auto-derive status
        if income == 0 and cost == 0:
            next_action = "等待确认收入/成本"
        elif income > 0 and collection == 0:
            next_action = "等待收款"
        elif cost > 0 and payment == 0:
            next_action = "等待付款"
        elif income > collection:
            next_action = "继续收款"
        elif cost > payment:
            next_action = "继续安排付款"
        else:
            next_action = "已完成"

        d["next_action"] = next_action
        # 状态推导（数据库中的 status 可能过期）
        if d.get("status") != TERMINATED:
            d["status"] = derive_contract_status(d["contract_id"], db)
        result.append(d)

    return result
