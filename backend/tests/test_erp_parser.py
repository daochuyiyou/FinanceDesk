"""ERP Excel 解析引擎测试 —— 双列分流 + 单列符号 + 边界条件。"""
from __future__ import annotations

import io
from typing import Any

import openpyxl
import pytest

from app.services.erp_excel_parser import parse_erp_excel


def _make_workbook(header: list[str], rows: list[list[Any]]) -> bytes:
    """Helper: create an in-memory .xlsx with given header + data rows."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sheet1"
    ws.append(header)
    for r in rows:
        ws.append(r)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()


class TestDualColumnMode:
    """双列模式：同时有 贷方金额 和 借方金额 两列。"""

    HEADER = ["发生时间", "凭证号", "客户名称", "摘要", "贷方金额", "借方金额"]

    def test_income_and_cost_split(self):
        """贷方 50000 → income, 借方 12000 → cost。"""
        data = self.HEADER, [
            ["2026-01-15", "PZ001", "项目A", "工程款", "50000.00", ""],
            ["2026-02-20", "PZ002", "项目B", "设备采购", "", "12000.00"],
        ]
        xlsx = _make_workbook(*data)
        result = parse_erp_excel(xlsx, "test.xlsx")
        assert result["total"] == 2, f"expected 2 rows, got {result['total']}"
        rows = result["rows"]
        assert rows[0]["amount_in"] == 50000.0
        assert rows[0]["amount_out"] == 0.0
        assert rows[0]["record_type"] == "income_expense"
        assert rows[0]["raw_project_name"] == "项目A"
        assert rows[1]["amount_out"] == 12000.0
        assert rows[1]["amount_in"] == 0.0

    def test_empty_cells_no_crash(self):
        """空单元格不崩溃。"""
        data = self.HEADER, [
            ["", "", "", "", "", ""],
        ]
        xlsx = _make_workbook(*data)
        result = parse_erp_excel(xlsx, "empty.xlsx")
        assert result["total"] == 0

    def test_zero_amounts_filtered(self):
        """金额全零的行应被过滤。"""
        data = self.HEADER, [
            ["2026-03-01", "PZ003", "项目C", "测试", "0.00", "0.00"],
        ]
        xlsx = _make_workbook(*data)
        result = parse_erp_excel(xlsx, "zero.xlsx")
        assert result["total"] == 0


class TestSingleColumnMode:
    """单列模式：只有一列『金额』，正→收入，负→成本(abs)。"""

    HEADER = ["发生时间", "凭证号", "客户名称", "摘要", "金额"]

    def test_positive_is_income_negative_is_cost(self):
        """正数 50000 → collection/income, 负数 12000 → income_expense/cost。"""
        data = self.HEADER, [
            ["2026-01-15", "PZ001", "项目X", "收入款", "50000.00"],
            ["2026-02-20", "PZ002", "项目Y", "材料采购", "-12000.00"],
        ]
        xlsx = _make_workbook(*data)
        result = parse_erp_excel(xlsx, "single.xlsx")
        assert result["total"] == 2
        rows = result["rows"]
        assert rows[0]["amount_in"] == 50000.0
        assert rows[0]["amount_out"] == 0.0
        assert rows[0]["record_type"] == "collection"
        assert rows[1]["amount_out"] == 12000.0
        assert rows[1]["record_type"] == "income_expense"

    def test_all_positive(self):
        """全部正数 → 全是收入。"""
        data = self.HEADER, [
            ["2026-01-15", "PZ001", "项目A", "一批", "100.00"],
            ["2026-01-16", "PZ002", "项目B", "二批", "200.00"],
        ]
        xlsx = _make_workbook(*data)
        result = parse_erp_excel(xlsx, "all_positive.xlsx")
        assert result["total"] == 2
        for r in result["rows"]:
            assert r["amount_in"] > 0
            assert r["amount_out"] == 0.0

    def test_all_negative(self):
        """全部负数 → 全是成本。"""
        data = self.HEADER, [
            ["2026-01-15", "PZ003", "项目C", "支出", "-500.00"],
        ]
        xlsx = _make_workbook(*data)
        result = parse_erp_excel(xlsx, "all_negative.xlsx")
        assert result["total"] == 1
        assert result["rows"][0]["amount_out"] == 500.0


class TestEdgeCases:
    """边界情况。"""

    def test_no_amount_column(self):
        """无金额列 → 报告错误。"""
        header = ["日期", "摘要"]
        rows = [["2026-01-01", "测试"]]
        xlsx = _make_workbook(header, rows)
        result = parse_erp_excel(xlsx, "no_amount.xlsx")
        assert result["total"] == 0
        assert len(result["errors"]) > 0
        assert "未检测到金额列" in result["errors"][0]

    def test_mixed_column_names(self):
        """中文别名映射（如『收入金额』映射到 amount_in）。"""
        header = ["日期", "凭证号", "对方单位", "摘要", "收入金额"]
        rows = [["2026-01-01", "PZ001", "某公司", "收入", "3000.00"]]
        xlsx = _make_workbook(header, rows)
        result = parse_erp_excel(xlsx, "alias.xlsx")
        assert result["total"] == 1
        assert result["rows"][0]["amount_in"] == 3000.0

    def test_map_columns_alias(self):
        """别名列名映射（对方单位 → raw_project_name）。"""
        import pandas as pd
        from app.services.erp_excel_parser import map_columns

        df = pd.DataFrame({
            "日期": ["2026-01-01"],
            "对方单位": ["测试公司"],
            "金额": ["5000"],
        })
        mapping = map_columns(df)
        assert "raw_project_name" in mapping
        assert "amount_in" in mapping
        assert "occur_date" in mapping

    def test_return_structure(self):
        """确保返回结构包含 rows / errors / total。"""
        header = ["发生时间", "凭证号", "客户名称", "摘要", "金额"]
        rows = [["2026-01-01", "PZ001", "项目X", "测试", "1234.56"]]
        xlsx = _make_workbook(header, rows)
        result = parse_erp_excel(xlsx, "test.xlsx")
        assert "rows" in result
        assert "errors" in result
        assert "total" in result
        assert result["total"] == 1
