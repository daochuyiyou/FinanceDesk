"""ERP 暂存与映射 Schema — Phase 5 规范版。"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.base import FinanceDeskBaseModel


# ── ERPStagingFlow ─────────────────────────────────────────


class ERPStagingFlowResponse(FinanceDeskBaseModel):

    id: int
    record_type: str
    occur_date: Optional[date] = None
    erp_record_id: Optional[str] = None
    summary: Optional[str] = None
    raw_project_name: Optional[str] = None
    amount_in: Optional[Decimal] = None
    amount_out: Optional[Decimal] = None
    matched_project_id: Optional[int] = None
    matched_order_id: Optional[int] = None
    match_status: str
    source_file: Optional[str] = None
    created_at: datetime
    is_deleted: bool


class PaginatedERPFlows(FinanceDeskBaseModel):
    items: list[ERPStagingFlowResponse]
    total: int
    page: int
    page_size: int


# ── 手动归集请求 ──────────────────────────────────────────


class ERPManualMatch(FinanceDeskBaseModel):
    flow_ids: list[int] = Field(...)
    project_id: int = Field(...)
    order_id: Optional[int] = None


# ── ERP 解析结果（前端展示用） ──────────────────────────


class ERPParseSheetResult(FinanceDeskBaseModel):
    sheet_type: str
    sheet_name: str
    rows: list[dict]
    errors: list[str]
    total: int


class ERPParseResponse(FinanceDeskBaseModel):
    total_rows: int
    total_errors: int


# ── ProjectKeywordMapping ──────────────────────────────────


class ProjectKeywordMappingResponse(FinanceDeskBaseModel):

    id: int
    keyword: str
    target_project_id: int
    match_type: str
    created_at: datetime


class KeywordMappingCreate(FinanceDeskBaseModel):
    keyword: str = Field(..., max_length=200)
    target_project_id: int = Field(...)
    match_type: str = Field("manual", max_length=20)


# ── Sandbox 预览 Schema ────────────────────────────────────


class ColumnMappingInfo(BaseModel):
    target: str
    detected: str | None


class UploadPreviewSheet(FinanceDeskBaseModel):
    """单个 Sheet 的上传预览结果。"""
    sheet_name: str
    parsed_rows: int
    skipped_rows: int
    errors: list[str]
    columns_mapped: list[ColumnMappingInfo]
    sample_data: list[dict]


class MultiSheetUploadPreviewResponse(FinanceDeskBaseModel):
    """多 Sheet 上传预览响应（不持久化）。"""
    sheets: list[UploadPreviewSheet]
    total_parsed: int
    total_skipped: int
    total_errors: int


class MatchPreviewItem(BaseModel):
    priority: str
    label: str
    count: int
    confidence: str  # high / medium / low


class MatchPreviewResponse(FinanceDeskBaseModel):
    """匹配预览响应。"""
    priorities: list[MatchPreviewItem]
    total_auto_matched: int
    total_needs_manual: int
    total_errors: int


class ImportPreviewSummary(FinanceDeskBaseModel):
    """导入预览摘要。"""
    total_records: int
    income_count: int
    cost_count: int
    collection_count: int
    payment_count: int
    auto_match_count: int
    manual_pending_count: int
    failed_count: int
    duplicate_count: int
    total_income_amount: float = 0.0
    total_cost_amount: float = 0.0


# ── ImportBatch ────────────────────────────────────────────


class ImportBatchResponse(FinanceDeskBaseModel):
    id: int
    batch_no: str
    import_time: datetime
    source_file: Optional[str] = None
    import_user: Optional[str] = None
    total_count: int
    success_count: int
    failed_count: int
    duplicate_count: int
    manual_match_count: int
    created_at: datetime


class ImportBatchCreate(FinanceDeskBaseModel):
    source_file: str
    total_count: int


# ── Impact Preview / Dry Run ────────────────────────────────


class ImpactPreviewItem(BaseModel):
    label: str
    value: int
    detail: Optional[str] = None


class ImpactPreviewResponse(FinanceDeskBaseModel):
    """Dry Run 影响评估（13 项指标）。"""
    total_records: int = 0
    income_new_count: int = 0
    cost_new_count: int = 0
    collection_new_count: int = 0
    payment_new_count: int = 0
    auto_match_count: int = 0
    manual_match_count: int = 0
    duplicate_count: int = 0
    failed_count: int = 0
    estimated_affected_orders: int = 0
    estimated_revenue_summary_updates: int = 0
    estimated_cost_summary_updates: int = 0
    estimated_order_summary_updates: int = 0
    risk_level: str = "LOW"


class ConfirmImportResponse(FinanceDeskBaseModel):
    batch_no: str
    import_time: datetime
    total_records: int
    success_count: int
    failed_count: int
    duplicate_count: int
    manual_match_count: int
    duration_seconds: float


class ImportResultLog(FinanceDeskBaseModel):
    level: str  # INFO / WARN / ERROR
    message: str
    time: Optional[datetime] = None


class ImportResultResponse(FinanceDeskBaseModel):
    batch_no: str
    success_count: int
    failed_count: int
    duplicate_count: int
    manual_match_count: int
    duration_seconds: float
    logs: list[ImportResultLog] = []


class PaginatedImportBatches(FinanceDeskBaseModel):
    items: list[ImportBatchResponse]
    total: int
    page: int
    page_size: int
