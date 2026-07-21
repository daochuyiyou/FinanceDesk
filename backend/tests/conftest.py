"""Test configuration with file-based test database."""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from collections.abc import Generator

import pytest
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base, get_db
from app.non_ascii_response import NonAsciiJSONResponse
from app.routers import project, supplier, order, dashboard, budget, vendor, flow
from app.routers.collection_payment import collection_router, payment_router
from app.routers.supplier_year_price import router as supplier_year_price_router
from app.routers.supplier_overview import router as supplier_overview_router
from app.routers.data_import import router as import_router
from app.routers import erp
from app.routers.export import router as export_router

# Use a fixed file path in the tests directory
TEST_DB_DIR = os.path.join(os.path.dirname(__file__), "test_data")
os.makedirs(TEST_DB_DIR, exist_ok=True)
TEST_DB_PATH = os.path.join(TEST_DB_DIR, "test.db")
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


test_app = FastAPI(title="FinanceDesk Test")
test_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
test_app.include_router(project.router, prefix="/api/v1")
test_app.include_router(supplier.router, prefix="/api/v1")
test_app.include_router(supplier_year_price_router, prefix="/api/v1")
test_app.include_router(supplier_overview_router, prefix="/api/v1")
test_app.include_router(vendor.router, prefix="/api/v1")
test_app.include_router(order.router, prefix="/api/v1")
test_app.include_router(budget.router, prefix="/api/v1")
test_app.include_router(dashboard.router, prefix="/api/v1")
test_app.include_router(collection_router, prefix="/api/v1")
test_app.include_router(payment_router, prefix="/api/v1")
test_app.include_router(flow.router, prefix="/api/v1")
test_app.include_router(import_router)
test_app.include_router(export_router)
test_app.include_router(erp.router, prefix="/api/v1")
test_app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """每个测试前重建表，测试后删除数据库文件确保隔离。"""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def client() -> Generator:
    with TestClient(test_app) as c:
        yield c


@pytest.fixture()
def db() -> Generator:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
