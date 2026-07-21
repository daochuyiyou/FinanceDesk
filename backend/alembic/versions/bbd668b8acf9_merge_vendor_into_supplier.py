"""merge_vendor_into_supplier

Revision ID: bbd668b8acf9
Revises: 08c7859faa88
Create Date: 2026-06-30 01:13:28.956025

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "bbd668b8acf9"
down_revision: Union[str, Sequence[str], None] = "08c7859faa88"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Data migration - copy vendor.name to supplier.name
    op.execute("""
        UPDATE supplier
        SET name = (SELECT name FROM vendor WHERE vendor.id = supplier.vendor_id)
        WHERE vendor_id IS NOT NULL AND (name IS NULL OR name = "")
    """)

    # Step 2: Drop FK constraints on supplier and supplier_year_price
    op.drop_constraint(None, "supplier", type_="foreignkey")
    op.drop_constraint(None, "supplier_year_price", type_="foreignkey")

    # Step 3: Alter supplier.name to NOT NULL now that data is migrated
    op.alter_column("supplier", "name",
               existing_type=sa.VARCHAR(length=200),
               nullable=False)

    # Step 4: Drop vendor_id from supplier
    op.drop_column("supplier", "vendor_id")

    # Step 5: Add supplier_id to supplier_year_price
    op.add_column("supplier_year_price", sa.Column("supplier_id", sa.String(length=36), nullable=True))

    # Step 6: Migrate data: copy vendor_id -> supplier_id
    op.execute("""
        UPDATE supplier_year_price
        SET supplier_id = (SELECT s.id FROM supplier s WHERE s.vendor_id = supplier_year_price.vendor_id LIMIT 1)
        WHERE vendor_id IS NOT NULL
    """)

    # Step 7: Make supplier_id NOT NULL after data populated
    op.alter_column("supplier_year_price", "supplier_id",
               existing_type=sa.VARCHAR(length=36),
               nullable=False)

    # Step 8: Drop old constraints and columns
    op.drop_constraint(op.f("uq_vendor_year"), "supplier_year_price", type_="unique")
    op.drop_column("supplier_year_price", "vendor_id")

    # Step 9: Create new unique constraint
    op.create_unique_constraint("uq_supplier_year", "supplier_year_price", ["supplier_id", "year"])

    # Step 10: Drop vendor table
    op.drop_index(op.f("ix_vendor_id"), table_name="vendor")
    op.drop_table("vendor")


def downgrade() -> None:
    """Reverse: recreate vendor table, restore FKs."""
    op.create_table("vendor",
        sa.Column("name", sa.VARCHAR(length=200), nullable=False),
        sa.Column("remark", sa.TEXT(), nullable=True),
        sa.Column("id", sa.INTEGER(), nullable=False),
        sa.Column("is_deleted", sa.BOOLEAN(), server_default=sa.text("0"), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_vendor_id"), "vendor", ["id"], unique=False)

    op.add_column("supplier_year_price", sa.Column("vendor_id", sa.VARCHAR(length=36), nullable=True))
    op.execute("""
        UPDATE supplier_year_price
        SET vendor_id = (SELECT s.vendor_id FROM supplier s WHERE s.id = supplier_year_price.supplier_id LIMIT 1)
        WHERE supplier_id IS NOT NULL
    """)
    op.alter_column("supplier_year_price", "vendor_id", nullable=False)

    op.drop_constraint("uq_supplier_year", "supplier_year_price", type_="unique")
    op.create_unique_constraint(op.f("uq_vendor_year"), "supplier_year_price", ["vendor_id", "year"])
    op.drop_column("supplier_year_price", "supplier_id")

    op.add_column("supplier", sa.Column("vendor_id", sa.VARCHAR(length=36), nullable=True))
    op.execute("""
        UPDATE supplier
        SET vendor_id = (SELECT id FROM vendor WHERE name = supplier.name LIMIT 1)
    """)
    op.alter_column("supplier", "vendor_id", nullable=False)
    op.alter_column("supplier", "name", nullable=True)
    op.create_foreign_key(None, "supplier", "vendor", ["vendor_id"], ["id"])
