"""Tests for BudgetAdjustment API endpoints."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project import Project


class TestBudgetAdjustment:
    def _create_project(self, db: Session) -> str:
        p = Project(framework_name="预算测试项目")
        db.add(p); db.flush()
        return str(p.id)

    def test_list_adjustments_empty(self, client: TestClient, db: Session):
        pid = self._create_project(db); db.commit()
        resp = client.get(f"/api/v1/projects/{pid}/adjustments")
        assert resp.status_code == 200 and resp.json()["total"] == 0

    def test_create_adjustment(self, client: TestClient, db: Session):
        pid = self._create_project(db); db.commit()
        resp = client.post(f"/api/v1/projects/{pid}/adjustments", json={
            "adjustment_amount": "50000.00", "adjustment_reason": "追加预算"
        })
        assert resp.status_code == 201
        assert resp.json()["adjustment_amount"] == 50000.00
        assert resp.json()["adjustment_reason"] == "追加预算"

    def test_create_adjustment_invalid_amount(self, client: TestClient, db: Session):
        pid = self._create_project(db); db.commit()
        resp = client.post(f"/api/v1/projects/{pid}/adjustments", json={
            "adjustment_amount": "-999999999999"
        })
        assert resp.status_code == 422

    def test_get_adjustment(self, client: TestClient, db: Session):
        pid = self._create_project(db); db.commit()
        aid = client.post(f"/api/v1/projects/{pid}/adjustments",
                          json={"adjustment_amount": "30000.00"}).json()["id"]
        resp = client.get(f"/api/v1/projects/{pid}/adjustments/{aid}")
        assert resp.status_code == 200 and resp.json()["adjustment_amount"] == 30000.00

    def test_update_adjustment(self, client: TestClient, db: Session):
        pid = self._create_project(db); db.commit()
        aid = client.post(f"/api/v1/projects/{pid}/adjustments",
                          json={"adjustment_amount": "10000.00"}).json()["id"]
        resp = client.patch(f"/api/v1/projects/{pid}/adjustments/{aid}",
                            json={"adjustment_amount": "20000.00"})
        assert resp.status_code == 200 and resp.json()["adjustment_amount"] == 20000.00

    def test_delete_adjustment(self, client: TestClient, db: Session):
        pid = self._create_project(db); db.commit()
        aid = client.post(f"/api/v1/projects/{pid}/adjustments",
                          json={"adjustment_amount": "5000.00"}).json()["id"]
        resp = client.delete(f"/api/v1/projects/{pid}/adjustments/{aid}")
        assert resp.status_code == 204

    def test_list_nonexistent_project(self, client: TestClient):
        resp = client.get("/api/v1/projects/99999/adjustments")
        assert resp.status_code == 404
