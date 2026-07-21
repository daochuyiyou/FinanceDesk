"""ERP Gap 对账测试 —— 系统合同额 vs ERP 实绩 vs 差异。"""
from __future__ import annotations

from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import ERPStagingFlow, Order, Project


def _seed_project(db: Session, name: str, amount: float) -> Project:
    """创建项目 + 订单（amount 构成系统合同额）。"""
    proj = Project(framework_name=name, is_deleted=False)
    db.add(proj)
    db.flush()

    order = Order(
        project_id=proj.id,
        order_no=f"ORD-{proj.id}",
        amount=Decimal(str(amount)),
    )
    db.add(order)
    db.flush()
    return proj


def _seed_erp_flow(db: Session, *, project_id: int,
                   amount_in: float = 0.0,
                   amount_out: float = 0.0) -> ERPStagingFlow:
    flow = ERPStagingFlow(
        record_type="income_expense",
        summary=f"ERP流水-项目{project_id}",
        raw_project_name="测试",
        amount_in=Decimal(str(amount_in)) if amount_in else None,
        amount_out=Decimal(str(amount_out)) if amount_out else None,
        match_status="auto_matched",
        matched_project_id=project_id,
        source_file="test.xlsx",
    )
    db.add(flow)
    db.flush()
    return flow


class TestGapCalculation:
    """GET /erp/gap 差异计算精度验证。"""

    def test_gap_no_erp_data(self, client: TestClient, db: Session):
        """无 ERP 数据时 gap = 全额 (合同额 - 0)。"""
        proj = _seed_project(db, "纯系统项目", 100000.00)
        db.commit()

        resp = client.get("/api/v1/erp/gap")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        entry = next(x for x in data if x["project_id"] == proj.id)
        assert float(entry["system_contract_amount"]) == 100000.00
        assert float(entry["erp_income_amount"]) == 0.0
        assert float(entry["gap_income"]) == 100000.00  # 全额欠款

    def test_gap_income_full_match(self, client: TestClient, db: Session):
        """ERP 收入与合同额一致 → gap_income = 0。"""
        proj = _seed_project(db, "完全匹配项目", 50000.00)
        _seed_erp_flow(db, project_id=proj.id, amount_in=50000.00)
        db.commit()

        resp = client.get("/api/v1/erp/gap")
        data = resp.json()
        entry = next(x for x in data if x["project_id"] == proj.id)
        assert float(entry["gap_income"]) == 0.0

    def test_gap_income_partial(self, client: TestClient, db: Session):
        """部分回款 → gap_income = 合同 - 已收。"""
        proj = _seed_project(db, "部分回款项目", 80000.00)
        _seed_erp_flow(db, project_id=proj.id, amount_in=30000.00)
        db.commit()

        resp = client.get("/api/v1/erp/gap")
        data = resp.json()
        entry = next(x for x in data if x["project_id"] == proj.id)
        assert float(entry["erp_income_amount"]) == 30000.00
        assert float(entry["gap_income"]) == 50000.00  # 80K - 30K

    def test_gap_with_expenses(self, client: TestClient, db: Session):
        """含成本支出：gap_expense = 合同 - 支出。"""
        proj = _seed_project(db, "有成本项目", 100000.00)
        _seed_erp_flow(db, project_id=proj.id, amount_in=60000.00)
        _seed_erp_flow(db, project_id=proj.id, amount_out=40000.00)
        db.commit()

        resp = client.get("/api/v1/erp/gap")
        data = resp.json()
        entry = next(x for x in data if x["project_id"] == proj.id)
        assert float(entry["gap_income"]) == 40000.00   # 100K - 60K
        assert float(entry["gap_expense"]) == 60000.00  # 100K - 40K

    def test_multiple_projects(self, client: TestClient, db: Session):
        """多项目：每个项目独立计算。"""
        p1 = _seed_project(db, "项目1", 100000.00)
        p2 = _seed_project(db, "项目2", 200000.00)
        _seed_erp_flow(db, project_id=p1.id, amount_in=10000.00)
        _seed_erp_flow(db, project_id=p2.id, amount_in=150000.00)
        db.commit()

        resp = client.get("/api/v1/erp/gap")
        data = resp.json()
        assert len(data) >= 2
        e1 = next(x for x in data if x["project_id"] == p1.id)
        e2 = next(x for x in data if x["project_id"] == p2.id)
        assert float(e1["gap_income"]) == 90000.00
        assert float(e2["gap_income"]) == 50000.00

    def test_no_projects_no_crash(self, client: TestClient):
        """无任何项目 → 空列表。"""
        resp = client.get("/api/v1/erp/gap")
        assert resp.status_code == 200
        assert resp.json() == []
