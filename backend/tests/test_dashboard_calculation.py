"""
测试仪表盘汇总计算逻辑 —— 项目金额、订单金额、流水金额联动。

覆盖：
- /summary 端点返回正确的汇总数据
- /project-summary 端点返回正确的项目级汇总
- /ar-aging 端点返回正确的应收账龄
- /project-profit 端点返回正确的项目利润
"""

import pytest
from fastapi.testclient import TestClient


class TestDashboardSummary:
    """看板顶部汇总卡片测试。"""

    def test_summary_empty_db(self, client: TestClient):
        """空数据库时看板汇总返回 0 值。"""
        resp = client.get("/api/v1/dashboard/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["project_count"] == 0
        assert data["total_order_count"] == 0
        assert data["total_contract_amount"] == 0.0
        assert data["total_invoiced_amount"] == 0.0
        assert data["total_receivable_amount"] == 0.0

    def test_summary_after_seeding_data(self, client: TestClient, setup_database):
        """创建数据后看板汇总金额正确。"""
        # 创建项目-订单链：项目 → 订单 → 收入流水
        p = client.post("/api/v1/projects", json={
            "framework_name": "测试项目", "internal_or_external": "集团内",
            "project_type": "工程施工",
        }).json()
        pid = p["id"]

        o = client.post("/api/v1/orders", json={
            "project_id": pid, "order_no": "TST-001",
            "order_name": "测试订单", "amount": "50000.00",
        }).json()
        oid = o["id"]

        # 添加收入流水
        client.post(f"/api/v1/orders/{oid}/incomes", json={
            "taxable_amount": "30000.00", "invoice_date": "2026-07-01",
        })

        resp = client.get("/api/v1/dashboard/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["project_count"] == 1
        assert data["total_order_count"] == 1
        assert data["total_contract_amount"] == 50000.0
        assert data["total_invoiced_amount"] == 30000.0
        assert data["total_receivable_amount"] == 30000.0  # 无回款

    def test_summary_receivable_consistency(self, client: TestClient, setup_database):
        """总应收 = 总已开票 - 总已回款。"""
        resp = client.get("/api/v1/dashboard/summary")
        data = resp.json()
        assert data["total_receivable_amount"] == pytest.approx(
            data["total_invoiced_amount"] - data.get("total_collected_amount", 0), abs=1.0
        )


class TestProjectSummary:
    """项目维度汇总测试。"""

    def test_project_summary_returns_list(self, client: TestClient, setup_database):
        """project-summary 返回列表。"""
        resp = client.get("/api/v1/dashboard/project-summary")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_project_receivable_balance(self, client: TestClient, setup_database):
        """应收余额 = 已开票 - 已回款。"""
        resp = client.get("/api/v1/dashboard/project-summary")
        data = resp.json()
        for p in data:
            expected = p["total_invoiced"] - p["total_collected"]
            assert p["receivable_balance"] == expected, \
                f"Project {p['project_id']}: receivable_balance {p['receivable_balance']} != {expected}"


class TestARAging:
    """应收账龄测试。"""

    def test_ar_aging_returns_list(self, client: TestClient, setup_database):
        """ar-aging 返回列表。"""
        resp = client.get("/api/v1/dashboard/ar-aging")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_ar_aging_consistency(self, client: TestClient, setup_database):
        """总应收金额 = 各账龄段之和。"""
        resp = client.get("/api/v1/dashboard/ar-aging")
        data = resp.json()
        for p in data:
            age_sum = p["age_0_30"] + p["age_31_60"] + p["age_61_90"] + p["age_90_plus"]
            assert age_sum == p["total_invoiced"], \
                f"Project {p['project_id']}: age sum {age_sum} != total_invoiced {p['total_invoiced']}"

    def test_ar_receivable_column(self, client: TestClient, setup_database):
        """应收 = 总已开票 - 总已回款。"""
        resp = client.get("/api/v1/dashboard/ar-aging")
        data = resp.json()
        for p in data:
            expected = p["total_invoiced"] - p["total_collected"]
            assert p["receivable"] == expected, \
                f"Project {p['project_id']}: receivable {p['receivable']} != {expected}"


class TestProjectProfit:
    """项目利润表测试。"""

    def test_project_profit_returns_list(self, client: TestClient, setup_database):
        """project-profit 返回列表。"""
        resp = client.get("/api/v1/dashboard/project-profit")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_gross_profit_calculation(self, client: TestClient, setup_database):
        """毛利 = 收入 - 成本。"""
        resp = client.get("/api/v1/dashboard/project-profit")
        data = resp.json()
        for p in data:
            expected = p["total_income"] - p["total_cost"]
            assert p["gross_profit"] == pytest.approx(expected, abs=0.01), \
                f"Project {p['project_id']}: gross_profit {p['gross_profit']} != {expected}"
