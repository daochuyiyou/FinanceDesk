"""fix supplier_unit_price unique constraint to allow logical delete

Revision ID: c7d3e4f5a6b7
Revises: b463b3bd0f81
Create Date: 2026-07-01 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision = "c7d3e4f5a6b7"
down_revision = "b463b3bd0f81"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_supplier_unit_year")
    op.execute(
        "CREATE UNIQUE INDEX uq_supplier_unit_year_active "
        "ON supplier_unit_price(supplier_id, year) WHERE is_deleted = 0"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_supplier_unit_year_active")
    op.execute(
        "CREATE UNIQUE INDEX uq_supplier_unit_year "
        "ON supplier_unit_price(supplier_id, year)"
    )
