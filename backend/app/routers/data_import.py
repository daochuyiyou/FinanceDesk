"""导入导出字段映射修复：添加中→英列头映射层。"""

from io import BytesIO
from datetime import datetime
from typing import Optional, Callable

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.audit import log_action
from app.models import Collection, CostFlow, IncomeFlow, Order, Payment, Project, Supplier, SupplierContract, SupplierUnitPrice

router = APIRouter(prefix="/api/v1/import", tags=["数据导入"])

# ── 中→英 列头映射（匹配模板列头） ──────────────────────────
# key=模板中文列头, value=Pydantic 英文字段名
HEADER_TRANSLATIONS = {
    # 项目
    '框架合同名称': 'framework_name', '签订时间': 'sign_date',
    '合同开始时间': 'start_date', '合同结束时间': 'end_date',
    '集团内外': 'internal_or_external', '项目类型': 'project_type',
    # 订单
    '项目ID': 'project_id', '订单编号': 'order_no', '订单名称': 'order_name',
    '甲方单位': 'customer_name', '含税金额': 'amount', '不含税金额': 'non_tax_amount',
    '签订日期': 'order_date', '订单类型': 'order_type', '状态': 'status',
    # 供应商
    '供应商名称': 'name', '所属框架': 'framework', '框架编号': 'framework_no',
    '框架开始时间': 'framework_start_date', '框架结束时间': 'framework_end_date',
    '年度': 'year',
    # 收入流水
    '订单ID': 'order_id', '税率': 'tax_rate',
    '含税金额': 'taxable_amount', '不含税金额': 'non_taxable_amount',
    '开票日期': 'invoice_date', '发票号码': 'invoice_no', '备注': 'remark',
    # 成本流水
    '供应商ID': 'supplier_id', '成本类型': 'cost_type',
    '成本科目': 'cost_subject',
    # 回款
    '流水ID': 'flow_id', '回款日期': 'collection_date',
    '回款金额': 'amount', '收款凭证号': 'receipt_no',
    # 付款
    '成本流水ID': 'cost_id', '支付日期': 'payment_date',
    '支付金额': 'amount', '支付对象': 'payee', '支付凭证号': 'voucher_no',
    # 合同
    '合同编号': 'contract_no', '合同金额': 'amount',
    '开始日期': 'start_date', '结束日期': 'end_date',
    # 单价
    '普工单价': 'laborer_price', '技工单价': 'technician_price',
    '高级技工单价': 'senior_technician_price', '特种作业单价': 'special_work_price',
    '综合单价': 'comprehensive_price',
}



class ImportResponse(BaseModel):
    success: int
    total: int
    errors: list[str]

def translate_headers(row: dict) -> dict:
    """将中文列头映射为英文字段名。"""
    if not row:
        return row
    # 如果已经是英文字段（至少一个 key 不含中文），跳过映射
    has_chinese = any('\u4e00' <= k[0] <= '\u9fff' for k in row if k)
    if not has_chinese:
        return row
    return {HEADER_TRANSLATIONS.get(k, k): v for k, v in row.items()}


# ── 导入校验模型 ────────────────────────────────────────

class ProjectRow(BaseModel):
    framework_name: str = Field(..., max_length=200)
    sign_date: Optional[str] = Field(None)
    start_date: Optional[str] = Field(None)
    end_date: Optional[str] = Field(None)
    internal_or_external: str = Field("集团内", max_length=20)
    project_type: str = Field("其他", max_length=100)


class OrderRow(BaseModel):
    project_id: str = Field(...)
    order_no: str = Field(..., max_length=100)
    order_name: Optional[str] = Field(None, max_length=200)
    customer_name: Optional[str] = Field(None, max_length=200)
    order_date: Optional[str] = Field(None)
    amount: float = Field(0.0)
    non_tax_amount: Optional[float] = Field(0.0)
    status: Optional[str] = Field("待执行", max_length=50)


class SupplierRow(BaseModel):
    name: str = Field(..., max_length=200)
    framework: Optional[str] = Field(None, max_length=200)
    framework_no: str = Field(..., max_length=100)
    year: Optional[int] = Field(None)


class IncomeFlowRow(BaseModel):
    order_id: str = Field(...)
    taxable_amount: float = Field(0.0)
    non_taxable_amount: Optional[float] = Field(0.0)
    tax_rate: Optional[float] = Field(None)
    invoice_date: Optional[str] = Field(None)
    invoice_no: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field("待回款", max_length=50)


class CostFlowRow(BaseModel):
    order_id: str = Field(...)
    cost_type: str = Field(..., max_length=100)
    taxable_amount: float = Field(0.0)
    non_taxable_amount: Optional[float] = Field(0.0)
    tax_rate: Optional[float] = Field(None)
    cost_party: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field("待支付", max_length=50)


class CollectionRow(BaseModel):
    flow_id: str = Field(...)
    collection_date: str = Field(...)
    amount: float = Field(..., gt=0)
    receipt_no: Optional[str] = Field(None, max_length=200)


class PaymentRow(BaseModel):
    cost_id: str = Field(...)
    payment_date: str = Field(...)
    amount: float = Field(..., gt=0)
    payee: Optional[str] = Field(None, max_length=200)
    voucher_no: Optional[str] = Field(None, max_length=200)


class SupplierContractRow(BaseModel):
    supplier_id: int = Field(...)
    contract_no: str = Field(..., max_length=200)
    amount: float = Field(0.0)


class SupplierUnitPriceRow(BaseModel):
    supplier_id: int = Field(...)
    year: int = Field(...)


def validate_collection_row(data: dict) -> list[str]:
    errs = []
    if not data.get("flow_id"): errs.append("缺少flow_id")
    if not data.get("collection_date"): errs.append("缺少collection_date")
    if not data.get("amount"): errs.append("缺少amount")
    else:
        try:
            if float(data["amount"]) <= 0: errs.append("amount必须大于0")
        except: errs.append("amount应为数字")
    try: datetime.strptime(str(data.get("collection_date","")), "%Y-%m-%d")
    except: errs.append("collection_date格式错误")
    return errs


def validate_supplier_contract_row(data: dict) -> list[str]:
    errs = []
    if not data.get('supplier_id'): errs.append('缺少supplier_id')
    if not data.get('contract_no'): errs.append('缺少contract_no')
    return errs


def validate_supplier_unit_price_row(data: dict) -> list[str]:
    errs = []
    if not data.get('supplier_id'): errs.append('缺少supplier_id')
    if not data.get('year'): errs.append('缺少year')
    return errs


def validate_payment_row(data: dict) -> list[str]:
    errs = []
    if not data.get("cost_id"): errs.append("缺少cost_id")
    if not data.get("payment_date"): errs.append("缺少payment_date")
    if not data.get("amount"): errs.append("缺少amount")
    else:
        try:
            if float(data["amount"]) <= 0: errs.append("amount必须大于0")
        except: errs.append("amount应为数字")
    try: datetime.strptime(str(data.get("payment_date","")), "%Y-%m-%d")
    except: errs.append("payment_date格式错误")
    return errs


def validate_project_row(data: dict) -> list[str]:
    errs = []
    required = ["framework_name", "sign_date", "start_date", "end_date", "internal_or_external", "project_type"]
    for f in required:
        if not data.get(f):
            errs.append(f"缺少必填字段: {f}")
    for df_ in ["sign_date", "start_date", "end_date"]:
        v = data.get(df_)
        if v:
            try: datetime.strptime(str(v), "%Y-%m-%d")
            except ValueError: errs.append(f"{df_} 格式错误，应为 YYYY-MM-DD")
    if data.get("internal_or_external") and data["internal_or_external"] not in ("集团内", "集团外"):
        errs.append("internal_or_external 应为 “集团内” 或 “集团外”")
    return errs


def validate_supplier_row(data: dict) -> list[str]:
    errs = []
    if not data.get("name"): errs.append("缺少必填字段: name")
    if not data.get("framework_no"): errs.append("缺少必填字段: framework_no")
    y = data.get("year")
    if y:
        try: int(y)
        except (ValueError, TypeError): errs.append("year 应为数字")
    return errs


def validate_order_row(data: dict) -> list[str]:
    errs = []
    if not data.get("order_no"): errs.append("缺少必填字段: order_no")
    if not data.get("project_id"): errs.append("缺少必填字段: project_id")
    if data.get("amount"):
        try: float(data["amount"])
        except (ValueError, TypeError): errs.append("amount 应为数字")
    return errs


def validate_income_flow_row(data: dict) -> list[str]:
    errs = []
    if not data.get("order_id"): errs.append("缺少必填字段: order_id")
    if not data.get("taxable_amount"): errs.append("缺少必填字段: taxable_amount")
    return errs


def validate_cost_flow_row(data: dict) -> list[str]:
    errs = []
    if not data.get("order_id"): errs.append("缺少必填字段: order_id")
    if not data.get("cost_type"): errs.append("缺少必填字段: cost_type")
    if not data.get("taxable_amount"): errs.append("缺少必填字段: taxable_amount")
    return errs


VALIDATORS = {
    Project: validate_project_row,
    Supplier: validate_supplier_row,
    Order: validate_order_row,
    IncomeFlow: validate_income_flow_row,
    CostFlow: validate_cost_flow_row,
    Collection: validate_collection_row,
    Payment: validate_payment_row,
    SupplierContract: validate_supplier_contract_row,
    SupplierUnitPrice: validate_supplier_unit_price_row,
}


@router.post("/supplier-contracts", response_model=ImportResponse)
async def import_supplier_contracts(file: UploadFile = File(...), db: Session = Depends(get_db)):
    body = await file.read()
    return process_excel(body, file.filename, SupplierContract, SupplierContractRow, db)


@router.post("/supplier-unit-prices", response_model=ImportResponse)
async def import_supplier_unit_prices(file: UploadFile = File(...), db: Session = Depends(get_db)):
    body = await file.read()
    return process_excel(body, file.filename, SupplierUnitPrice, SupplierUnitPriceRow, db)


@router.post("/collections", response_model=ImportResponse)
async def import_collections(file: UploadFile = File(...), db: Session = Depends(get_db)):
    body = await file.read()
    return process_excel(body, file.filename, Collection, CollectionRow, db)


@router.post("/payments", response_model=ImportResponse)
async def import_payments(file: UploadFile = File(...), db: Session = Depends(get_db)):
    body = await file.read()
    return process_excel(body, file.filename, Payment, PaymentRow, db)


def process_excel(file_bytes: bytes, filename: str, model_class, row_model,
                  db: Session,
                  unique_fields: list[str] | None = None,
                  transform: Callable = None) -> dict:
    if not filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "仅支持 .xlsx 或 .xls 文件")

    df = pd.read_excel(BytesIO(file_bytes), dtype=str)
    df = df.fillna("")

    records = df.to_dict("records")
    success_count = 0
    errors = []
    validator = VALIDATORS.get(model_class)

    # Detect Date columns from model for automatic conversion
    date_cols = set()
    try:
        from sqlalchemy import Date
        from sqlalchemy.inspection import inspect as sa_inspect
        mapper = sa_inspect(model_class)
        for col in mapper.columns:
            if isinstance(col.type, Date):
                date_cols.add(col.key)
    except Exception:
        pass

    for i, raw_row in enumerate(records, start=2):
        try:
            # 步骤 1: 映射中文列头 → 英文字段名
            row = translate_headers(raw_row)

            # 步骤 2: 校验
            if validator:
                validation_errors = validator(row)
                if validation_errors:
                    errors.append(f"第{i}行: {'; '.join(validation_errors)}")
                    continue

            # 步骤 3: Pydantic 验证
            validated = row_model.model_validate(row)
            data = validated.model_dump()

            # 步骤 4: 去重检查
            if unique_fields:
                filters = {f: data.get(f) for f in unique_fields}
                existing = db.query(model_class).filter_by(**filters).first()
                if existing:
                    errors.append(f"第{i}行: 数据重复 ({', '.join(f'{k}={v}' for k, v in filters.items())})")
                    continue

            # 步骤 5: 自定义转换
            if transform:
                data = transform(data)

            # 步骤 6: 日期字符串→date 对象
            for col in date_cols:
                val = data.get(col)
                if val and isinstance(val, str):
                    try:
                        data[col] = datetime.strptime(val, "%Y-%m-%d").date()
                    except ValueError:
                        pass

            # 步骤 7: 持久化
            obj = model_class(**data)
            db.add(obj)
            db.flush()
            log_action(db, "IMPORT", model_class.__tablename__ if hasattr(model_class, '__tablename__') else str(model_class),
                       target_id=obj.id, target_name=str(obj))
            db.commit()
            success_count += 1
        except Exception as e:
            errors.append(f"第{i}行: {str(e)}")
            db.rollback()

    return {"success": success_count, "total": len(records), "errors": errors}


@router.post("/projects", response_model=ImportResponse)
async def import_projects(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    return process_excel(content, file.filename, Project, ProjectRow, db,
                         unique_fields=["framework_name"])


@router.post("/orders", response_model=ImportResponse)
async def import_orders(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    return process_excel(content, file.filename, Order, OrderRow, db,
                         unique_fields=["order_no"])


@router.post("/suppliers", response_model=ImportResponse)
async def import_suppliers(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    return process_excel(content, file.filename, Supplier, SupplierRow, db,
                         unique_fields=["framework_no"])


@router.post("/income-flows", response_model=ImportResponse)
async def import_income_flows(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    return process_excel(content, file.filename, IncomeFlow, IncomeFlowRow, db)


@router.post("/cost-flows", response_model=ImportResponse)
async def import_cost_flows(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    return process_excel(content, file.filename, CostFlow, CostFlowRow, db)
