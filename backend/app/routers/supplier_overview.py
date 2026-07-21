"""供应商年度概况 + 三合一批量导入。"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import Supplier, SupplierYearPrice

router = APIRouter(prefix="/overview", tags=["supplier-overview"])


class BatchImportRow(BaseModel):
    vendor_name: str
    framework_no: str
    framework_start_date: Optional[str] = None
    framework_end_date: Optional[str] = None
    laborer_unit_price: Optional[float] = None
    technician_unit_price: Optional[float] = None
    senior_technician_unit_price: Optional[float] = None
    comprehensive_unit_price: Optional[float] = None


class SupplierOverviewItem(BaseModel):
    vendor_id: int
    vendor_name: str
    framework_no: str | None = None
    framework_start_date: str | None = None
    framework_end_date: str | None = None
    laborer_unit_price: float | None = None
    technician_unit_price: float | None = None
    senior_technician_unit_price: float | None = None
    comprehensive_unit_price: float | None = None
    status: str

class BatchImportResponse(BaseModel):
    success: int
    fail: int
    errors: list[str]

class BatchImportRequest(BaseModel):
    year: int
    data: list[BatchImportRow]


@router.get("", response_model=list[SupplierOverviewItem])
def supplier_overview(year: int = Query(...), db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT v.id AS vendor_id, v.name AS vendor_name,
               v.framework_no, v.framework_start_date, v.framework_end_date,
               p.laborer_unit_price, p.technician_unit_price,
               p.senior_technician_unit_price, p.comprehensive_unit_price,
               CASE WHEN vp.id IS NULL THEN 'NEW' ELSE 'RENEWED' END AS status
        FROM supplier v
        LEFT JOIN supplier_year_price p ON p.supplier_id = v.id AND p.year = :year AND p.is_deleted = 0
        LEFT JOIN supplier vp ON vp.id = v.id AND vp.id IN (
            SELECT DISTINCT s2.id FROM supplier s2
            JOIN supplier_year_price p2 ON p2.supplier_id = s2.id
            WHERE p2.year = :prev AND p2.is_deleted = 0
        )
        ORDER BY v.name
    """), {"year": year, "prev": year - 1}).mappings().all()
    result = [dict(r) for r in rows]
    current_ids = {r["vendor_id"] for r in rows if r}
    if current_ids:
        ids_list = list(current_ids)
        ph = ','.join(f':id{i}' for i in range(len(ids_list)))
        params = {'prev': year - 1}
        params.update({f'id{i}': v for i, v in enumerate(ids_list)})
        exited = db.execute(text(f"""
            SELECT DISTINCT v.id AS vendor_id, v.name AS vendor_name
            FROM supplier v JOIN supplier_year_price p ON p.supplier_id = v.id
            AND p.year = :prev AND p.is_deleted = 0
            WHERE v.id NOT IN ({ph})
        """), params).mappings().all()
        for e in exited:
            d = dict(e)
            d.update({"framework_no": "", "framework_start_date": None, "framework_end_date": None,
                       "laborer_unit_price": None, "technician_unit_price": None,
                       "senior_technician_unit_price": None, "comprehensive_unit_price": None, "status": "EXITED"})
            result.append(d)
    return result


@router.post("/batch-import", response_model=BatchImportResponse)
def batch_import(body: BatchImportRequest, db: Session = Depends(get_db)):
    success = 0
    fail = 0
    errors = []
    for i, row in enumerate(body.data):
        line = i + 2
        try:
            sup = db.query(Supplier).filter(
                Supplier.name == row.vendor_name, Supplier.year == body.year,
                Supplier.is_deleted.is_(False),
            ).first()
            if sup:
                sup.framework_no = row.framework_no
                sup.framework_start_date = row.framework_start_date
                sup.framework_end_date = row.framework_end_date
            else:
                sup = Supplier(
                    name=row.vendor_name, framework_no=row.framework_no,
                    framework_start_date=row.framework_start_date,
                    framework_end_date=row.framework_end_date,
                    year=body.year,
                )
                db.add(sup)
                db.flush()
            p = db.query(SupplierYearPrice).filter(
                SupplierYearPrice.supplier_id == sup.id,
                SupplierYearPrice.year == body.year,
                SupplierYearPrice.is_deleted.is_(False),
            ).first()
            if p:
                p.laborer_unit_price = row.laborer_unit_price
                p.technician_unit_price = row.technician_unit_price
                p.senior_technician_unit_price = row.senior_technician_unit_price
                p.comprehensive_unit_price = row.comprehensive_unit_price
            else:
                p = SupplierYearPrice(
                    supplier_id=sup.id, year=body.year,
                    laborer_unit_price=row.laborer_unit_price,
                    technician_unit_price=row.technician_unit_price,
                    senior_technician_unit_price=row.senior_technician_unit_price,
                    comprehensive_unit_price=row.comprehensive_unit_price,
                )
                db.add(p)
            db.flush()
            success += 1
        except Exception as e:
            db.rollback()
            fail += 1
            errors.append(f"第{line}行: {str(e)[:100]}")
            db.begin()
    db.commit()
    return {"success": success, "fail": fail, "errors": errors[:20]}
