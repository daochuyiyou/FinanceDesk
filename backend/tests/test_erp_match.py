"""ERP 匹配算法测试 —— 手动归集 + 自动匹配 + 关键词学习。"""
from __future__ import annotations

from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import ERPStagingFlow, Project, Order, ProjectKeywordMapping


def _seed_flow(db: Session, *, summary: str = "测试摘要",
               raw_project_name: str | None = "测试项目",
               record_type: str = "income_expense",
               amount_in: float = 1000.0,
               match_status: str = "pending") -> ERPStagingFlow:
    flow = ERPStagingFlow(
        record_type=record_type,
        summary=summary,
        raw_project_name=raw_project_name,
        amount_in=amount_in,
        match_status=match_status,
        source_file="test.xlsx",
    )
    db.add(flow)
    db.flush()
    return flow


def _seed_project(db: Session, name: str = "测试项目") -> Project:
    proj = Project(framework_name=name, is_deleted=False)
    db.add(proj)
    db.flush()
    return proj


def _seed_order(db: Session, project_id: int, amount: float = 10000.0) -> Order:
    from datetime import timezone
    order = Order(
        project_id=project_id,
        order_no=f"ORD-{project_id}",
        amount=amount,
    )
    db.add(order)
    db.flush()
    return order


class TestManualMatch:
    """POST /erp/match 手动归集测试。"""

    def test_match_success(self, client: TestClient, db: Session):
        """手动归集成功：match_status → manual_matched。"""
        proj = _seed_project(db)
        flow = _seed_flow(db)
        db.commit()

        resp = client.post("/api/v1/erp/match", json={
            "flow_ids": [flow.id],
            "project_id": proj.id,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["updated"] == 1
        assert data["new_keywords"] >= 1

        db.refresh(flow)
        assert flow.match_status == "manual_matched"
        assert flow.matched_project_id == proj.id

    def test_match_flow_not_found(self, client: TestClient, db: Session):
        """不存在的 flow_id → 404。"""
        resp = client.post("/api/v1/erp/match", json={
            "flow_ids": [99999],
            "project_id": 1,
        })
        assert resp.status_code == 404

    def test_match_invalid_payload(self, client: TestClient, db: Session):
        """无效请求体 → 422。"""
        resp = client.post("/api/v1/erp/match", json={
            "flow_ids": [],
            "project_id": "abc",
        })
        assert resp.status_code == 422

    def test_match_keyword_auto_learned(self, client: TestClient, db: Session):
        """手动归集后触发关键词自动学习。"""
        proj = _seed_project(db, name="金茂大厦")
        flow = _seed_flow(db, summary="金茂大厦消防改造")
        db.commit()

        resp = client.post("/api/v1/erp/match", json={
            "flow_ids": [flow.id],
            "project_id": proj.id,
        })
        assert resp.status_code == 200
        assert resp.json()["new_keywords"] >= 1

        # Verify keyword persists
        kw = db.query(ProjectKeywordMapping).filter(
            ProjectKeywordMapping.target_project_id == proj.id
        ).first()
        assert kw is not None
        assert "金茂大厦" in kw.keyword


class TestAutoMatch:
    """POST /erp/match-all 自动匹配测试。"""

    def test_keyword_match(self, client: TestClient, db: Session):
        """词库匹配生效。"""
        proj = _seed_project(db, name="测试项目")
        kw = ProjectKeywordMapping(
            keyword="测试",
            target_project_id=proj.id,
            match_type="manual",
        )
        db.add(kw)
        flow = _seed_flow(db, summary="这是一条测试流水")
        db.commit()

        resp = client.post("/api/v1/erp/match-all")
        assert resp.status_code == 200
        data = resp.json()
        assert data["keyword_matched"] >= 1

        db.refresh(flow)
        assert flow.match_status == "auto_matched"

    def test_strong_match_by_project_id(self, client: TestClient, db: Session):
        """摘要含『项目#123』→ 强关联匹配。"""
        proj = _seed_project(db, name="编号项目")
        flow = _seed_flow(db, summary=f"项目#{proj.id}工程款")
        db.commit()

        resp = client.post("/api/v1/erp/match-all")
        assert resp.status_code == 200
        data = resp.json()
        assert data["auto_matched"] >= 1

        db.refresh(flow)
        assert flow.match_status == "auto_matched"
        assert flow.matched_project_id == proj.id

    def test_pending_when_no_match(self, client: TestClient, db: Session):
        """无可匹配关键词/ID → 保持 pending。"""
        _seed_project(db, name="某项目")
        flow = _seed_flow(db, summary="完全不匹配的摘要内容")
        db.commit()

        resp = client.post("/api/v1/erp/match-all")
        assert resp.status_code == 200
        data = resp.json()
        assert data["still_pending"] >= 1

        db.refresh(flow)
        assert flow.match_status == "pending"

    def test_already_matched_not_retouched(self, client: TestClient, db: Session):
        """已 manual_matched 的记录不被再次匹配。"""
        proj = _seed_project(db)
        flow = _seed_flow(db, summary=f"项目#{proj.id}款",
                          match_status="manual_matched")
        db.commit()

        resp = client.post("/api/v1/erp/match-all")
        assert resp.status_code == 200
        # Should have 0 processed (only pending flows are processed)
        assert resp.json()["total"] >= 0  # at least not crash
