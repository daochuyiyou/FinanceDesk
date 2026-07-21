"""Tests for IncomeFlow and CostFlow API endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.supplier import Supplier
from app.models.order import Order


def _create_order(db: Session) -> str:
    sup = Supplier(name="流水测试供应商", framework_no="FK-FLW")
    db.add(sup); db.flush()
    p = Project(framework_name="流水测试项目"); db.add(p); db.flush()
    o = Order(project_id=p.id, supplier_id=sup.id, order_no="ORD-FLW-T")
    db.add(o); db.flush()
    return str(o.id)


class TestIncomeFlow:
    def test_list_incomes_empty(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        resp = client.get(f"/api/v1/orders/{oid}/incomes")
        assert resp.status_code == 200 and resp.json()["total"] == 0

    def test_create_income_flow(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        resp = client.post(f"/api/v1/orders/{oid}/incomes", json={
            "taxable_amount": "50000.00", "invoice_no": "INV-001"
        })
        assert resp.status_code == 201
        assert resp.json()["taxable_amount"] == 50000.00

    def test_get_income_flow(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        iid = client.post(f"/api/v1/orders/{oid}/incomes",
                          json={"taxable_amount": "30000.00"}).json()["id"]
        resp = client.get(f"/api/v1/orders/{oid}/incomes/{iid}")
        assert resp.status_code == 200 and resp.json()["taxable_amount"] == 30000.00

    def test_update_income_flow(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        iid = client.post(f"/api/v1/orders/{oid}/incomes",
                          json={"taxable_amount": "10000.00"}).json()["id"]
        resp = client.patch(f"/api/v1/orders/{oid}/incomes/{iid}",
                            json={"taxable_amount": "15000.00"})
        assert resp.status_code == 200 and resp.json()["taxable_amount"] == 15000.00

    def test_delete_income_flow(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        iid = client.post(f"/api/v1/orders/{oid}/incomes",
                          json={"taxable_amount": "5000.00"}).json()["id"]
        resp = client.delete(f"/api/v1/orders/{oid}/incomes/{iid}")
        assert resp.status_code == 204

    def test_delete_then_get_returns_404(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        iid = client.post(f"/api/v1/orders/{oid}/incomes",
                          json={"taxable_amount": "5000.00"}).json()["id"]
        client.delete(f"/api/v1/orders/{oid}/incomes/{iid}")
        resp = client.get(f"/api/v1/orders/{oid}/incomes/{iid}")
        assert resp.status_code == 404

    def test_get_nonexistent_404(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        resp = client.get(f"/api/v1/orders/{oid}/incomes/99999")
        assert resp.status_code == 404

    def test_create_income_with_defaults(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        resp = client.post(f"/api/v1/orders/{oid}/incomes", json={})
        assert resp.status_code == 201


class TestCostFlow:
    def test_list_costs_empty(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        resp = client.get(f"/api/v1/orders/{oid}/costs")
        assert resp.status_code == 200 and resp.json()["total"] == 0

    def test_create_cost_flow(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        resp = client.post(f"/api/v1/orders/{oid}/costs", json={
            "taxable_amount": "30000.00", "cost_type": "施工费"
        })
        assert resp.status_code == 201
        assert resp.json()["taxable_amount"] == 30000.00

    def test_get_cost_flow(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        cid = client.post(f"/api/v1/orders/{oid}/costs",
                          json={"taxable_amount": "20000.00"}).json()["id"]
        resp = client.get(f"/api/v1/orders/{oid}/costs/{cid}")
        assert resp.status_code == 200

    def test_update_cost_flow(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        cid = client.post(f"/api/v1/orders/{oid}/costs",
                          json={"taxable_amount": "10000.00"}).json()["id"]
        resp = client.patch(f"/api/v1/orders/{oid}/costs/{cid}",
                            json={"cost_type": "材料费"})
        assert resp.status_code == 200 and resp.json()["cost_type"] == "材料费"

    def test_delete_cost_flow(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        cid = client.post(f"/api/v1/orders/{oid}/costs",
                          json={"taxable_amount": "5000.00"}).json()["id"]
        resp = client.delete(f"/api/v1/orders/{oid}/costs/{cid}")
        assert resp.status_code == 204

    def test_create_cost_with_defaults(self, client: TestClient, db: Session):
        oid = _create_order(db); db.commit()
        resp = client.post(f"/api/v1/orders/{oid}/costs", json={})
        assert resp.status_code == 201
