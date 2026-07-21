"""add audit_log table

Revision ID: e26be4dd30a2
Revises: c7d3e4f5a6b7
Create Date: 2026-07-01 21:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision = "e26be4dd30a2"
down_revision = "c7d3e4f5a6b7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "audit_log",
        sa.Column("user_id", sa.Integer(), nullable=True, comment="用户ID"),
        sa.Column("username", sa.String(100), nullable=True, comment="用户名"),
        sa.Column("action", sa.String(50), nullable=False, comment="操作类型"),
        sa.Column("module", sa.String(50), nullable=False, comment="模块"),
        sa.Column("target_id", sa.Integer(), nullable=True, comment="目标ID"),
        sa.Column("target_name", sa.String(200), nullable=True, comment="目标名称"),
        sa.Column("changes", sa.Text(), nullable=True, comment="变更JSON"),
        sa.Column("ip_address", sa.String(50), nullable=True, comment="操作IP"),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=True, comment="逻辑删除"),
        sa.Column("created_at", sa.DateTime(), nullable=True, comment="创建时间"),
        sa.Column("updated_at", sa.DateTime(), nullable=True, comment="更新时间"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_log_id"), "audit_log", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_log_id"), table_name="audit_log")
    op.drop_table("audit_log")
