from __future__ import annotations

import os
import tempfile

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Collection, CostFlow, IncomeFlow, Order, Payment, Project, Supplier, SupplierContract, SupplierUnitPrice

router = APIRouter(prefix="/api/v1/export", tags=["数据导出"])

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "../../templates")
ALLOWED_TEMPLATES = {
    "项目导入模板.xlsx",
    "供应商导入模板.xlsx",
    "订单导入模板.xlsx",
    "收入流水导入模板.xlsx",
    "成本流水导入模板.xlsx",
    "回款导入模板.xlsx",
    "付款导入模板.xlsx",
    "合同导入模板.xlsx",
    "单价导入模板.xlsx",
}


def _to_excel(data: list, filename: str):
    """将数据转换为 Excel 文件响应"""
    if not data:
        data = [{"提示": "暂无数据"}]
    df = pd.DataFrame(data)
    tmp = tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False)
    df.to_excel(tmp.name, index=False)
    return FileResponse(
        tmp.name,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ===== 模板下载 =====
@router.get("/templates/{template_name}")
async def download_template(template_name: str):
    """下载导入模板文件"""
    if template_name not in ALLOWED_TEMPLATES:
        raise HTTPException(404, "模板不存在")
    path = os.path.join(TEMPLATES_DIR, template_name)
    if not os.path.exists(path):
        raise HTTPException(404, "模板文件不存在，请先运行 generate_templates.py")
    return FileResponse(path, filename=template_name, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


# ===== 数据导出 =====
@router.get("/projects")
async def export_projects(db: Session = Depends(get_db)):
    items = db.query(Project).filter(Project.is_deleted == False).all()
    data = [{"ID": p.id, "框架合同名称": p.framework_name, "签订时间": str(p.sign_date or ""), "合同开始时间": str(p.start_date or ""), "合同结束时间": str(p.end_date or ""), "集团内外": p.internal_or_external, "项目类型": p.project_type} for p in items]
    return _to_excel(data, "项目数据.xlsx")


@router.get("/suppliers")
async def export_suppliers(db: Session = Depends(get_db)):
    items = db.query(Supplier).filter(Supplier.is_deleted == False).all()
    data = [{"ID": s.id, "供应商名称": s.name, "所属框架": s.framework or "", "框架编号": s.framework_no, "年度": s.year} for s in items]
    return _to_excel(data, "供应商数据.xlsx")


@router.get("/orders")
async def export_orders(db: Session = Depends(get_db)):
    items = db.query(Order).filter(Order.is_deleted == False).all()
    data = [{"ID": o.id, "项目ID": o.project_id, "订单编号": o.order_no, "订单名称": o.order_name or "", "甲方单位": o.customer_name or "", "含税金额": float(o.amount), "不含税金额": float(o.non_tax_amount or 0), "签订日期": str(o.order_date or ""), "订单类型": o.order_type or "", "状态": o.status or ""} for o in items]
    return _to_excel(data, "订单数据.xlsx")


@router.get("/income-flows")
async def export_income_flows(db: Session = Depends(get_db)):
    items = db.query(IncomeFlow).filter(IncomeFlow.is_deleted == False).all()
    data = [{"ID": i.id, "订单ID": i.order_id, "税率": float(i.tax_rate or 0), "含税金额": float(i.taxable_amount or 0), "不含税金额": float(i.non_taxable_amount or 0), "开票日期": str(i.invoice_date or ""), "发票号码": i.invoice_no or "", "备注": i.remark or ""} for i in items]
    return _to_excel(data, "收入流水数据.xlsx")


@router.get("/cost-flows")
async def export_cost_flows(db: Session = Depends(get_db)):
    items = db.query(CostFlow).filter(CostFlow.is_deleted == False).all()
    data = [{"ID": c.id, "订单ID": c.order_id, "成本类型": c.cost_type, "税率": float(c.tax_rate or 0), "含税金额": float(c.taxable_amount or 0), "不含税金额": float(c.non_taxable_amount or 0), "成本科目": c.cost_subject or "", "备注": c.remark or ""} for c in items]
    return _to_excel(data, "成本流水数据.xlsx")


@router.get("/supplier-contracts")
async def export_supplier_contracts(db: Session = Depends(get_db)):
    items = db.query(SupplierContract).filter(SupplierContract.is_deleted == False).all()
    data = [{
        "ID": c.id,
        "供应商ID": c.supplier_id,
        "合同编号": c.contract_no,
        "签订日期": str(c.sign_date or ""),
        "开始日期": str(c.start_date or ""),
        "结束日期": str(c.end_date or ""),
        "合同金额": float(c.amount or 0),
        "状态": c.status or "",
        "备注": c.remark or "",
    } for c in items]
    return _to_excel(data, "合同数据.xlsx")


@router.get("/supplier-unit-prices")
async def export_supplier_unit_prices(db: Session = Depends(get_db)):
    items = db.query(SupplierUnitPrice).filter(SupplierUnitPrice.is_deleted == False).all()
    data = [{
        "ID": p.id,
        "供应商ID": p.supplier_id,
        "年度": p.year,
        "普工单价": float(p.laborer_price or 0),
        "技工单价": float(p.technician_price or 0),
        "高级技工单价": float(p.senior_technician_price or 0),
        "特种作业单价": float(p.special_work_price or 0),
        "综合单价": float(p.comprehensive_price or 0),
        "备注": p.remark or "",
    } for p in items]
    return _to_excel(data, "单价数据.xlsx")


@router.get("/collections")
async def export_collections(db: Session = Depends(get_db)):
    """导出回款数据"""
    items = db.query(Collection).filter(Collection.is_deleted == False).all()
    data = [{
        "ID": c.id,
        "流水ID": c.flow_id,
        "回款日期": str(c.collection_date or ""),
        "回款金额": float(c.amount or 0),
        "收款凭证号": c.receipt_no or "",
    } for c in items]
    return _to_excel(data, "回款数据.xlsx")


@router.get("/payments")
async def export_payments(db: Session = Depends(get_db)):
    """导出付款数据"""
    items = db.query(Payment).filter(Payment.is_deleted == False).all()
    data = [{
        "ID": p.id,
        "成本ID": p.cost_id,
        "支付日期": str(p.payment_date or ""),
        "支付对象": p.payee or "",
        "支付金额": float(p.amount or 0),
        "支付凭证": p.voucher_no or "",
    } for p in items]
    return _to_excel(data, "付款数据.xlsx")


# ===== 报告导出（兼容旧版） =====
@router.get("/project-report")
async def export_project_report(db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.is_deleted == False).all()
    data = []
    for p in projects:
        orders = db.query(Order).filter(Order.project_id == str(p.id), Order.is_deleted == False).all()
        ti = sum(float(i.taxable_amount or 0) for o in orders for i in (db.query(IncomeFlow).filter(IncomeFlow.order_id == str(o.id), IncomeFlow.is_deleted == False).all() or []))
        tc = sum(float(c.taxable_amount or 0) for o in orders for c in (db.query(CostFlow).filter(CostFlow.order_id == str(o.id), CostFlow.is_deleted == False).all() or []))
        data.append({"项目名称": p.framework_name, "订单数": len(orders), "总收入": ti, "总成本": tc, "利润": ti - tc})
    return _to_excel(data, "项目报表.xlsx")
