"""add_source_fields_to_budget_adjustment

Revision ID: a2b2d43a9019
Revises: e26be4dd30a2
Create Date: 2026-07-02 23:50:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a2b2d43a9019"
down_revision: Union[str, None] = "e26be4dd30a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("budget_adjustment", sa.Column("source_type", sa.String(50), nullable=True, comment="触发来源类型"))
    op.add_column("budget_adjustment", sa.Column("source_id", sa.Integer(), nullable=True, comment="触发来源记录 ID"))
    op.add_column("budget_adjustment", sa.Column("source_description", sa.String(500), nullable=True, comment="可读触发来源描述"))


def downgrade() -> None:
    op.drop_column("budget_adjustment", "source_description")
    op.drop_column("budget_adjustment", "source_id")
    op.drop_column("budget_adjustment", "source_type")
