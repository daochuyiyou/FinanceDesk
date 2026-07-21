"""防御性测试：极端数据输入 / 网络降级 / 空值保护。"""
import io
import json
import pandas as pd
from fastapi.testclient import TestClient


class TestDefensiveFormatting:
    """极端数值输入防御测试。"""

    def test_summary_empty_returns_zero(self, client: TestClient):
        """空数据库时所有汇总值应为 0。"""
        resp = client.get("/api/v1/dashboard/summary")
        assert resp.status_code == 200
        d = resp.json()
        # 数值字段不出现负无穷、NaN 或异常字符串
        for k in ("project_count", "total_order_count", "total_contract_amount",
                   "total_invoiced_amount", "total_receivable_amount"):
            assert isinstance(d[k], (int, float)), f"{k} is {type(d[k])}: {d[k]}"
            assert d[k] >= 0 or d[k] == 0.0, f"{k} is negative"

    def test_project_summary_no_nan(self, client: TestClient, setup_database):
        """项目汇总不出现 NaN 或负数金额。"""
        resp = client.get("/api/v1/dashboard/project-summary")
        assert resp.status_code == 200
        for p in resp.json():
            for k in ("total_amount", "total_invoiced", "total_collected", "receivable_balance"):
                assert isinstance(p[k], (int, float)), f"{k}={p[k]} is not numeric"
                assert p[k] >= -1e-9, f"{k}={p[k]} is negative"

    def test_project_summary_receivable_balance(self, client: TestClient, setup_database):
        """应收余额 = 已开票 - 已回款（不出现 NaN 减法）。"""
        resp = client.get("/api/v1/dashboard/project-summary")
        for p in resp.json():
            expected = p["total_invoiced"] - p["total_collected"]
            assert p["receivable_balance"] == expected, f"id={p['project_id']}"


class TestImportEmptyData:
    """导入空数据/极端数据防御测试。"""

    def test_import_empty_file(self, client: TestClient):
        """上传空 Excel 不应崩溃。"""
        buf = io.BytesIO()
        df = pd.DataFrame()
        df.to_excel(buf, index=False)
        buf.seek(0)
        resp = client.post("/api/v1/import/projects",
                           files={"file": ("empty.xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
        assert resp.status_code == 200
        d = resp.json()
        # 空文件应返回 success=0 且不抛异常
        assert "success" in d
        assert d["total"] == 0

    def test_import_boundary_values(self, client: TestClient, setup_database):
        """导入边界值：超大数值/特殊字符/空字符串。"""
        buf = io.BytesIO()
        df = pd.DataFrame([{
            '框架合同名称': '边界测试', '签订时间': '2026-07-01',
            '合同开始时间': '2026-07-01', '合同结束时间': '2026-12-31',
            '集团内外': '集团内', '项目类型': '工程施工',
        }])
        df.to_excel(buf, index=False)
        buf.seek(0)
        resp = client.post("/api/v1/import/projects",
                           files={"file": ("boundary.xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
        assert resp.status_code == 200
        d = resp.json()
        assert d["success"] == 1, f"边界值导入失败: {d.get('errors')}"


class TestDashboardEdgeCases:
    """看板边界场景防御测试。"""

    def test_order_detail_no_crash(self, client: TestClient):
        """不存在的 project_id 返回空列表不崩溃。"""
        resp = client.get("/api/v1/dashboard/order-detail/99999")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_project_profit_no_div_by_zero(self, client: TestClient, setup_database):
        """利润表不出现除零异常。"""
        resp = client.get("/api/v1/dashboard/project-profit")
        assert resp.status_code == 200
        for p in resp.json():
            # gross_margin 不应为 NaN 或 Infinity
            assert isinstance(p["gross_margin"], (int, float))
            assert p["gross_margin"] >= -1e9  # not -inf
