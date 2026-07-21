"""Tests for Order API endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.supplier import Supplier


def _create_prereqs(db: Session) -> tuple[str, str, str]:
    sup = Supplier(name="订单测试供应商", framework_no="FK-ORD-001")
    db.add(sup)
    db.flush()
    p = Project(framework_name="订单测试项目")
    db.add(p)
    db.flush()
    return str(p.id), str(sup.id), str(sup.id)


class TestOrderList:
    def test_list_orders_returns_200(self, client: TestClient):
        resp = client.get("/api/v1/orders")
        assert resp.status_code == 200
        assert "items" in resp.json()

    def test_list_orders_filter_by_project(self, client: TestClient, db: Session):
        pid, sid, _ = _create_prereqs(db)
        db.commit()
        client.post("/api/v1/orders", json={
            "project_id": pid, "supplier_id": sid, "order_no": "FLT-001"
        })
        # 正确项目筛选应返回订单
        resp = client.get(f"/api/v1/orders?project_id={pid}")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1
        # 错误项目筛选应返回空
        resp2 = client.get("/api/v1/orders?project_id=99999")
        assert resp2.json()["total"] == 0


class TestOrderCreate:
    def test_create_order_success(self, client: TestClient, db: Session):
        pid, sid, _ = _create_prereqs(db)
        db.commit()
        payload = {"project_id": pid, "supplier_id": sid, "order_no": "ORD-CRT-001",
                   "order_name": "测试订单", "amount": "100000.00"}
        resp = client.post("/api/v1/orders", json=payload)
        assert resp.status_code == 201
        assert resp.json()["order_no"] == "ORD-CRT-001"

    def test_create_order_requires_project_and_supplier(self, client: TestClient):
        resp = client.post("/api/v1/orders", json={
            "project_id": "99999", "supplier_id": "99999", "order_no": "ORD-FAIL"
        })
        assert resp.status_code == 404

    def test_update_order_name(self, client: TestClient, db: Session):
        pid, sid, _ = _create_prereqs(db)
        db.commit()
        oid = client.post("/api/v1/orders", json={
            "project_id": pid, "supplier_id": sid, "order_no": "ORD-UPD"
        }).json()["id"]
        resp = client.patch(f"/api/v1/orders/{oid}", json={"order_name": "新名称"})
        assert resp.status_code == 200
        assert resp.json()["order_name"] == "新名称"

    def test_update_order_amount(self, client: TestClient, db: Session):
        pid, sid, _ = _create_prereqs(db)
        db.commit()
        oid = client.post("/api/v1/orders", json={
            "project_id": pid, "supplier_id": sid, "order_no": "ORD-AMT"
        }).json()["id"]
        resp = client.patch(f"/api/v1/orders/{oid}", json={"amount": "200000.00"})
        assert resp.status_code == 200
        assert resp.json()["amount"] == 200000.00


class TestOrderDelete:
    def test_delete_order(self, client: TestClient, db: Session):
        pid, sid, _ = _create_prereqs(db)
        db.commit()
        oid = client.post("/api/v1/orders", json={
            "project_id": pid, "supplier_id": sid, "order_no": "ORD-DEL"
        }).json()["id"]
        resp = client.delete(f"/api/v1/orders/{oid}")
        assert resp.status_code == 204

    def test_delete_then_get_returns_404(self, client: TestClient, db: Session):
        pid, sid, _ = _create_prereqs(db)
        db.commit()
        oid = client.post("/api/v1/orders", json={
            "project_id": pid, "supplier_id": sid, "order_no": "ORD-DEL2"
        }).json()["id"]
        client.delete(f"/api/v1/orders/{oid}")
        resp = client.get(f"/api/v1/orders/{oid}")
        assert resp.status_code == 404


class TestOrderGet:
    def test_get_nonexistent_returns_404(self, client: TestClient):
        resp = client.get("/api/v1/orders/99999")
        assert resp.status_code == 404
