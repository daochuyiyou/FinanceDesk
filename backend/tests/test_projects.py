"""Tests for Project API endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project import Project


class TestProjectList:
    def test_list_projects_returns_200(self, client: TestClient):
        resp = client.get("/api/v1/projects")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data and "total" in data

    def test_list_projects_pagination(self, client: TestClient):
        resp = client.get("/api/v1/projects?page=1&page_size=5")
        assert resp.status_code == 200
        assert resp.json()["page_size"] == 5

    def test_list_projects_page_out_of_range(self, client: TestClient):
        """边界测试：超大页码应返回空列表而非报错。"""
        resp = client.get("/api/v1/projects?page=9999")
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0


class TestProjectCreate:
    def test_create_project_returns_201(self, client: TestClient):
        payload = {"framework_name": "测试合同", "project_type": "工程施工"}
        resp = client.post("/api/v1/projects", json=payload)
        assert resp.status_code == 201
        assert resp.json()["framework_name"] == "测试合同"

    def test_create_project_missing_required(self, client: TestClient):
        resp = client.post("/api/v1/projects", json={})
        assert resp.status_code == 422

    def test_create_then_list_increments(self, client: TestClient):
        client.post("/api/v1/projects", json={"framework_name": "A"})
        resp = client.get("/api/v1/projects")
        assert resp.json()["total"] >= 1


class TestProjectUpdate:
    def test_update_project_name(self, client: TestClient):
        pid = client.post("/api/v1/projects", json={"framework_name": "旧名称"}).json()["id"]
        resp = client.patch(f"/api/v1/projects/{pid}", json={"framework_name": "新名称"})
        assert resp.status_code == 200
        assert resp.json()["framework_name"] == "新名称"

    def test_update_project_partial(self, client: TestClient):
        pid = client.post("/api/v1/projects", json={
            "framework_name": "初始", "project_type": "其他"
        }).json()["id"]
        resp = client.patch(f"/api/v1/projects/{pid}", json={"project_type": "维护服务"})
        assert resp.status_code == 200
        assert resp.json()["framework_name"] == "初始"
        assert resp.json()["project_type"] == "维护服务"

    def test_update_nonexistent_returns_404(self, client: TestClient):
        resp = client.patch("/api/v1/projects/99999", json={"framework_name": "x"})
        assert resp.status_code == 404


class TestProjectDelete:
    def test_delete_project(self, client: TestClient):
        pid = client.post("/api/v1/projects", json={"framework_name": "待删除"}).json()["id"]
        resp = client.delete(f"/api/v1/projects/{pid}")
        assert resp.status_code == 204

    def test_delete_then_get_returns_404(self, client: TestClient):
        pid = client.post("/api/v1/projects", json={"framework_name": "删除验证"}).json()["id"]
        client.delete(f"/api/v1/projects/{pid}")
        resp = client.get(f"/api/v1/projects/{pid}")
        assert resp.status_code == 404

    def test_delete_nonexistent_returns_404(self, client: TestClient):
        resp = client.delete("/api/v1/projects/99999")
        assert resp.status_code == 404
