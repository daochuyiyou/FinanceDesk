"""Tests for Collection and Payment API endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.supplier import Supplier
from app.models.order import Order
from app.models.flow import IncomeFlow, CostFlow


def _create_col_prereqs(db: Session) -> tuple[str, str]:
    sup = Supplier(name="回款测试供应商", framework_no="FK-COL")
    db.add(sup); db.flush()
    p = Project(framework_name="回款测试项目")
    db.add(p); db.flush()
    o = Order(project_id=p.id, supplier_id=sup.id, order_no="ORD-COL-T")
    db.add(o); db.flush()
    inc = IncomeFlow(order_id=o.id, taxable_amount=50000.00)
    db.add(inc); db.flush()
    return str(o.id), str(inc.id)


def _create_pay_prereqs(db: Session) -> tuple[str, str]:
    sup = Supplier(name="支付测试供应商", framework_no="FK-PAY")
    db.add(sup); db.flush()
    p = Project(framework_name="支付测试项目")
    db.add(p); db.flush()
    o = Order(project_id=p.id, supplier_id=sup.id, order_no="ORD-PAY-T")
    db.add(o); db.flush()
    cost = CostFlow(order_id=o.id, taxable_amount=30000.00)
    db.add(cost); db.flush()
    return str(o.id), str(cost.id)


class TestCollection:
    def test_list_collections_nonexistent_order(self, client: TestClient):
        resp = client.get("/api/v1/collection/99999/incomes/99999")
        assert resp.status_code == 404

    def test_list_collections_empty(self, client: TestClient, db: Session):
        oid, iid = _create_col_prereqs(db); db.commit()
        resp = client.get(f"/api/v1/collection/{oid}/incomes/{iid}")
        assert resp.status_code == 200 and resp.json()["total"] == 0

    def test_create_collection(self, client: TestClient, db: Session):
        oid, iid = _create_col_prereqs(db); db.commit()
        resp = client.post(f"/api/v1/collection/{oid}/incomes/{iid}",
                           json={"amount": "30000.00", "receipt_no": "REC-001"})
        assert resp.status_code == 201
        assert resp.json()["amount"] == 30000.00

    def test_list_collections_after_create(self, client: TestClient, db: Session):
        oid, iid = _create_col_prereqs(db); db.commit()
        client.post(f"/api/v1/collection/{oid}/incomes/{iid}", json={"amount": "10000.00"})
        resp = client.get(f"/api/v1/collection/{oid}/incomes/{iid}")
        assert resp.json()["total"] >= 1

    def test_create_collection_missing_amount(self, client: TestClient, db: Session):
        oid, iid = _create_col_prereqs(db); db.commit()
        resp = client.post(f"/api/v1/collection/{oid}/incomes/{iid}", json={})
        assert resp.status_code == 422

    def test_create_collection_negative_amount(self, client: TestClient, db: Session):
        oid, iid = _create_col_prereqs(db); db.commit()
        resp = client.post(f"/api/v1/collection/{oid}/incomes/{iid}",
                           json={"amount": "-100.00"})
        assert resp.status_code == 422

    def test_get_collection(self, client: TestClient, db: Session):
        oid, iid = _create_col_prereqs(db); db.commit()
        cid = client.post(f"/api/v1/collection/{oid}/incomes/{iid}",
                          json={"amount": "5000.00"}).json()["id"]
        resp = client.get(f"/api/v1/collection/{oid}/incomes/{iid}/{cid}")
        assert resp.status_code == 200 and resp.json()["amount"] == 5000.00


class TestPayment:
    def test_list_payments_empty(self, client: TestClient, db: Session):
        oid, cid = _create_pay_prereqs(db); db.commit()
        resp = client.get(f"/api/v1/payment/{oid}/costs/{cid}")
        assert resp.status_code == 200 and resp.json()["total"] == 0

    def test_create_payment(self, client: TestClient, db: Session):
        oid, cid = _create_pay_prereqs(db); db.commit()
        resp = client.post(f"/api/v1/payment/{oid}/costs/{cid}",
                           json={"amount": "20000.00", "payee": "施工队A"})
        assert resp.status_code == 201
        assert resp.json()["amount"] == 20000.00

    def test_create_payment_missing_amount(self, client: TestClient, db: Session):
        oid, cid = _create_pay_prereqs(db); db.commit()
        resp = client.post(f"/api/v1/payment/{oid}/costs/{cid}", json={})
        assert resp.status_code == 422

    def test_update_payment(self, client: TestClient, db: Session):
        oid, cid = _create_pay_prereqs(db); db.commit()
        pid = client.post(f"/api/v1/payment/{oid}/costs/{cid}",
                          json={"amount": "5000.00"}).json()["id"]
        resp = client.patch(f"/api/v1/payment/{oid}/costs/{cid}/{pid}",
                            json={"amount": "8000.00"})
        assert resp.status_code == 200 and resp.json()["amount"] == 8000.00

    def test_delete_payment(self, client: TestClient, db: Session):
        oid, cid = _create_pay_prereqs(db); db.commit()
        pid = client.post(f"/api/v1/payment/{oid}/costs/{cid}",
                          json={"amount": "3000.00"}).json()["id"]
        resp = client.delete(f"/api/v1/payment/{oid}/costs/{cid}/{pid}")
        assert resp.status_code == 204
