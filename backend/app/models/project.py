"""项目信息表（合同级）、项目预算模型及 ORM 关系。"""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from ..database import HermesBaseModel


class Project(HermesBaseModel):
    """合同中心 — 框架合同 / 单项合同"""

    __tablename__ = "project"

    # ── 基础信息 ──
    framework_name = Column(String(200), nullable=False, comment="合同名称（框架合同名称）")
    contract_no = Column(String(100), unique=True, nullable=True, comment="合同编号（新增必填，历史可为空）")
    contract_type = Column(String(20), nullable=False, default="框架合同", comment="合同类型：单项合同 / 框架合同")

    # ── 业主信息 ──
    owner_name = Column(String(200), nullable=False, default="", comment="业主单位")
    owner_contact = Column(String(100), nullable=True, comment="联系人")
    owner_phone = Column(String(50), nullable=True, comment="联系电话")

    # ── 合同金额 ──
    contract_amount = Column(Numeric(15, 2), nullable=True, default=0.0, comment="合同金额（元）")
    budget_amount = Column(Numeric(15, 2), nullable=True, default=0.0, comment="预算金额（元）")

    # ── 时间信息 ──
    sign_date = Column(Date, nullable=True, comment="签订时间")
    start_date = Column(Date, nullable=True, comment="合同开始时间")
    end_date = Column(Date, nullable=True, comment="合同结束时间")
    contract_year = Column(Integer, nullable=True, comment="所属年度（默认取签订日期年份）")

    # ── 组织信息 ──
    department = Column(String(100), nullable=True, default="", comment="所属部门")
    manager = Column(String(100), nullable=True, default="", comment="负责人")

    # ── 分类与状态 ──
    internal_or_external = Column(String(20), nullable=False, default="集团内", comment="集团内外")
    project_type = Column(String(100), nullable=False, default="其他", comment="项目类型")
    status = Column(String(50), nullable=True, default="待执行", comment="合同状态（系统推导为主，人工仅可终止）")

    # ── 备注与 ERP ──
    remark = Column(Text, nullable=True, comment="备注")
    erp_no = Column(String(100), nullable=True, comment="ERP 项目编号（只读）")

    is_deleted = Column(Boolean, default=False, comment="逻辑删除标记")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")

    budgets = relationship(
        "ProjectBudget", back_populates="project",
        cascade="all, delete-orphan", passive_deletes=True,
    )
    budget_adjustments = relationship(
        "BudgetAdjustment", back_populates="project",
        cascade="all, delete-orphan", passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Project {self.framework_name}>"


class ProjectBudget(HermesBaseModel):
    """项目预算明细"""
    __tablename__ = "project_budget"

    project_id = Column(
        String(36), ForeignKey("project.id", ondelete="RESTRICT"),
        nullable=False, index=True, comment="项目 ID",
    )
    budget_type = Column(String(100), nullable=False, default="初始预算", comment="预算类型")
    labor_budget = Column(Numeric(15, 2), nullable=False, default=0.0, comment="人工费预算")
    material_budget = Column(Numeric(15, 2), nullable=False, default=0.0, comment="材料费预算")
    management_budget = Column(Numeric(15, 2), nullable=False, default=0.0, comment="管理费预算")
    gross_margin_rate = Column(Numeric(5, 2), nullable=True, comment="毛利率")
    preparation_date = Column(Date, nullable=True, comment="编制日期")
    preparer = Column(String(100), nullable=True, comment="编制人")

    project = relationship("Project", back_populates="budgets")

    def __repr__(self) -> str:
        return f"<ProjectBudget {self.budget_type} project={self.project_id}>"
