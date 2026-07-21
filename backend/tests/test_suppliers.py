"""Tests for Supplier, Vendor, and price API endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.supplier import Supplier as SupplierModel


class TestVendor:
    def test_list_vendors_empty(self, client: TestClient):
        resp = client.get("/api/v1/vendors")
        assert resp.status_code == 200 and resp.json()["total"] >= 0

    def test_create_vendor(self, client: TestClient):
        resp = client.post("/api/v1/vendors", json={"name": "测试供应商有限公司"})
        assert resp.status_code == 201
        assert resp.json()["name"] == "测试供应商有限公司"

    def test_get_vendor(self, client: TestClient):
        vid = client.post("/api/v1/vendors", json={"name": "可查询供应商"}).json()["id"]
        resp = client.get(f"/api/v1/vendors/{vid}")
        assert resp.status_code == 200 and resp.json()["name"] == "可查询供应商"

    def test_update_vendor(self, client: TestClient):
        vid = client.post("/api/v1/vendors", json={"name": "旧名称"}).json()["id"]
        resp = client.patch(f"/api/v1/vendors/{vid}", json={"name": "新名称"})
        assert resp.status_code == 200 and resp.json()["name"] == "新名称"

    def test_delete_vendor(self, client: TestClient):
        vid = client.post("/api/v1/vendors", json={"name": "待删除供应商"}).json()["id"]
        resp = client.delete(f"/api/v1/vendors/{vid}")
        assert resp.status_code == 204


class TestSupplier:
    def _create_vendor(self, db: Session) -> str:
        v = SupplierModel(name="供应商框架测试主体", framework_no="FK-SUPPLIER")
        db.add(v)
        return str(v.id)

    def test_create_supplier(self, client: TestClient, db: Session):
        vid = self._create_vendor(db); db.commit()
        resp = client.post("/api/v1/suppliers", json={
            "vendor_id": vid, "name": "框架合同A", "framework_no": "FK-2026-001"
        })
        assert resp.status_code == 201
        assert resp.json()["framework_no"] == "FK-2026-001"

    def test_list_suppliers(self, client: TestClient, db: Session):
        vid = self._create_vendor(db); db.commit()
        client.post("/api/v1/suppliers", json={
            "vendor_id": vid, "name": "框架B", "framework_no": "FK-2026-002"
        })
        resp = client.get("/api/v1/suppliers")
        assert resp.status_code == 200 and resp.json()["total"] >= 1

    def test_get_supplier(self, client: TestClient, db: Session):
        vid = self._create_vendor(db); db.commit()
        sid = client.post("/api/v1/suppliers", json={
            "vendor_id": vid, "name": "框架C", "framework_no": "FK-2026-003"
        }).json()["id"]
        resp = client.get(f"/api/v1/suppliers/{sid}")
        assert resp.status_code == 200

    def test_update_supplier(self, client: TestClient, db: Session):
        vid = self._create_vendor(db); db.commit()
        sid = client.post("/api/v1/suppliers", json={
            "vendor_id": vid, "name": "旧框架", "framework_no": "FK-OLD"
        }).json()["id"]
        resp = client.patch(f"/api/v1/suppliers/{sid}", json={"framework_no": "FK-NEW"})
        assert resp.status_code == 200 and resp.json()["framework_no"] == "FK-NEW"

    def test_delete_supplier(self, client: TestClient, db: Session):
        vid = self._create_vendor(db); db.commit()
        sid = client.post("/api/v1/suppliers", json={
            "vendor_id": vid, "name": "待删除框架", "framework_no": "FK-DEL"
        }).json()["id"]
        resp = client.delete(f"/api/v1/suppliers/{sid}")
        assert resp.status_code == 204


class TestSupplierPrice:
    def _create_supplier(self, db: Session) -> str:
        sup = SupplierModel(name="单价测试主体", framework_no="FK-PRICE")
        db.add(sup)
        db.flush()
        return str(sup.id)

    def test_create_price(self, client: TestClient, db: Session):
        sid = self._create_supplier(db); db.commit()
        resp = client.post(f"/api/v1/suppliers/{sid}/prices", json={
            "work_type": "普工", "unit_price": "300元/天"
        })
        assert resp.status_code == 201
        assert resp.json()["work_type"] == "普工"

    def test_list_prices(self, client: TestClient, db: Session):
        sid = self._create_supplier(db); db.commit()
        client.post(f"/api/v1/suppliers/{sid}/prices", json={"work_type": "技工"})
        resp = client.get(f"/api/v1/suppliers/{sid}/prices")
        assert resp.status_code == 200 and resp.json()["total"] >= 1


class TestYearPrice:
    def _create_vendor(self, db: Session) -> str:
        v = SupplierModel(name="年度单价测试主体", framework_no="FK-YEAR")
        db.add(v)
        db.flush()
        return str(v.id)

    def test_create_year_price(self, client: TestClient, db: Session):
        vid = self._create_vendor(db); db.commit()
        resp = client.post(f"/api/v1/vendors/{vid}/year-prices", json={
            "year": 2026, "laborer_unit_price": "200.00", "technician_unit_price": "350.00"
        })
        assert resp.status_code == 201
        assert resp.json()["year"] == 2026

    def test_list_year_prices(self, client: TestClient, db: Session):
        vid = self._create_vendor(db); db.commit()
        client.post(f"/api/v1/vendors/{vid}/year-prices", json={
            "year": 2026, "laborer_unit_price": "250.00"
        })
        resp = client.get(f"/api/v1/vendors/{vid}/year-prices")
        assert resp.status_code == 200 and resp.json()["total"] >= 1
