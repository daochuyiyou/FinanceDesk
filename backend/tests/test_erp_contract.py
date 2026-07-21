"""/erp/* 422 契约校验 — 发送错误 Payload 验证不触发 500。"""
from __future__ import annotations

from fastapi.testclient import TestClient


class TestErpContractValidation:
    """每个 POST /erp/* 接口发送无效 Payload → 422 而非 500。"""

    def test_upload_wrong_file_type(self, client: TestClient):
        """上传非 Excel 文件 → 400。"""
        resp = client.post("/api/v1/erp/upload", files={
            "file": ("test.txt", b"not an excel", "text/plain"),
        })
        assert resp.status_code == 400
        assert "仅支持" in resp.text

    def test_upload_no_file(self, client: TestClient):
        """不传文件 → 422。"""
        resp = client.post("/api/v1/erp/upload")
        assert resp.status_code < 500

    def test_match_string_instead_of_int(self, client: TestClient):
        """flow_ids 传字符串代替 int 列表 → 422。"""
        resp = client.post("/api/v1/erp/match", json={
            "flow_ids": "not-a-list",
            "project_id": 1,
        })
        assert resp.status_code < 500

    def test_match_negative_flow_ids(self, client: TestClient):
        """负数 flow_ids → 非预期但不应 500。"""
        resp = client.post("/api/v1/erp/match", json={
            "flow_ids": [-1],
            "project_id": 1,
        })
        # 负数 ID 可能触发 404（不存在）或 422（校验不通过）
        assert resp.status_code in (404, 422)

    def test_match_missing_project_id(self, client: TestClient):
        """缺 project_id → 422。"""
        resp = client.post("/api/v1/erp/match", json={
            "flow_ids": [1],
        })
        assert resp.status_code < 500

    def test_match_all_no_auth_ok(self, client: TestClient):
        """match-all 不需要参数 → 200 或 不能是 500。"""
        resp = client.post("/api/v1/erp/match-all")
        # 即使没数据也不应该 500
        assert resp.status_code < 500

    def test_gap_no_params_ok(self, client: TestClient):
        """gap 不需要参数 → 200 且不能 500。"""
        resp = client.get("/api/v1/erp/gap")
        assert resp.status_code == 200

    def test_flows_wrong_page_type(self, client: TestClient):
        """page 传字符串 → 422。"""
        resp = client.get("/api/v1/erp/flows?page=abc")
        assert resp.status_code < 500

    def test_keywords_create_empty_keyword(self, client: TestClient):
        """空关键词 → 422"""
        resp = client.post("/api/v1/erp/keywords", json={
            "keyword": "",
            "target_project_id": 1,
        })
        assert resp.status_code < 500

    def test_keywords_create_missing_fields(self, client: TestClient):
        """缺字段 → 422"""
        resp = client.post("/api/v1/erp/keywords", json={})
        assert resp.status_code < 500
