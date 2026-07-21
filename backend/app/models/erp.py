"""
ERP 数据暂存模型 — Phase 5 规范版。

绝对不修改现有的 CostFlow、IncomeFlow 等核心业务表。
"""

from __future__ import annotations

from datetime import date

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.sqlite import TEXT as SQLiteText
from sqlalchemy.orm import relationship

from ..database import HermesBaseModel


class ERPStagingFlow(HermesBaseModel):
    """
    ERP 原始流水暂存表 —— 隔离外部脏数据，不污染业务表。

    支持三类业务场景:
      - income_expense: 收支明细（含 amount_in 贷方 / amount_out 借方）
      - receivable:     应收明细（开票 / 账期，仅 amount_in）
      - collection:     收款明细（实际到账，仅 amount_in）
    """

    __tablename__ = "erp_staging_flow"
    __table_args__ = (
        UniqueConstraint("erp_record_id", name="uq_erp_record_id"),
    )

    record_type = Column(
        String(30), nullable=False, index=True,
        comment="记录类型: income_expense / receivable / collection",
    )
    occur_date = Column(
        Date, nullable=True, comment="发生日期",
    )
    erp_record_id = Column(
        String(100), nullable=True, unique=True,
        comment="业务单号 / 凭证号（唯一约束，防重复导入）",
    )
    summary = Column(
        Text, nullable=True, comment="摘要 / 概念说明（核心模糊匹配字段）",
    )
    raw_project_name = Column(
        String(300), nullable=True, comment="原始客户名称 / 项目名称",
    )
    amount_in = Column(
        Numeric(15, 2), nullable=True, default=0.0,
        comment="贷方 / 实收 / 应收金额",
    )
    amount_out = Column(
        Numeric(15, 2), nullable=True, default=0.0,
        comment="借方 / 支出金额",
    )
    matched_project_id = Column(
        Integer,
        ForeignKey("project.id", ondelete="SET NULL"),
        nullable=True,
        comment="匹配到的 FinanceDesk 项目 ID",
    )
    matched_order_id = Column(
        Integer,
        ForeignKey("order.id", ondelete="SET NULL"),
        nullable=True,
        comment="匹配到的 FinanceDesk 订单 ID",
    )
    match_status = Column(
        String(20), nullable=False, default="pending",
        comment="匹配状态: pending 待匹配 / auto_matched 自动匹配 / manual_matched 人工确认",
    )
    source_file = Column(
        String(500), nullable=True, comment="来源文件名",
    )

    # ORM 关系（仅用于查询，不参与业务逻辑）
    project = relationship("Project", foreign_keys=[matched_project_id])
    order = relationship("Order", foreign_keys=[matched_order_id])

    def __repr__(self) -> str:
        return f"<ERPFlow {self.erp_record_id} type={self.record_type} status={self.match_status}>"


class ProjectKeywordMapping(HermesBaseModel):
    """
    智能学习匹配规则表 —— 前端人工归集后自动写入，实现自学习。

    当 ERP 摘要 / 项目名称包含 keyword 时，关联到 target_project_id。
    """

    __tablename__ = "project_keyword_mapping"

    keyword = Column(
        String(200), nullable=False, unique=True, index=True,
        comment="提取的关键词（如'金茂大厦'）",
    )
    target_project_id = Column(
        Integer,
        ForeignKey("project.id", ondelete="RESTRICT"),
        nullable=False,
        comment="关联的系统项目 ID",
    )
    match_type = Column(
        String(20), nullable=False, default="manual",
        comment="规则来源: auto / manual",
    )

    project = relationship("Project", foreign_keys=[target_project_id])

    def __repr__(self) -> str:
        return f"<Keyword '{self.keyword}' -> project={self.target_project_id}>"



class ImportBatch(HermesBaseModel):
    """导入批次模型 — 每次确认导入生成唯一 Batch。"""

    __tablename__ = "import_batch"

    batch_no = Column(
        String(100), nullable=False, unique=True, index=True,
        comment="批次号: IMP-{YYYYMMDD}-{NNN}",
    )
    import_time = Column(
        DateTime, nullable=False, comment="导入时间",
    )
    source_file = Column(
        String(200), nullable=True, comment="来源文件名",
    )
    import_user = Column(
        String(100), nullable=True, comment="导入人",
    )
    total_count = Column(
        Integer, nullable=False, default=0, comment="总记录数",
    )
    success_count = Column(
        Integer, nullable=False, default=0, comment="成功导入数",
    )
    failed_count = Column(
        Integer, nullable=False, default=0, comment="导入失败数",
    )
    duplicate_count = Column(
        Integer, nullable=False, default=0, comment="重复记录数",
    )
    manual_match_count = Column(
        Integer, nullable=False, default=0, comment="人工匹配数",
    )

    def __repr__(self) -> str:
        return f"<ImportBatch {self.batch_no} total={self.total_count}>"
