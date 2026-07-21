"""make_order_supplier_id_optional_add_customer_name

Revision ID: c5af0081ba7a
Revises: 8b2ba5df4cfe
Create Date: 2026-07-01 11:53:15.447412

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c5af0081ba7a'
down_revision: Union[str, Sequence[str], None] = '8b2ba5df4cfe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add customer_name column (supported by SQLite)
    op.add_column('order', sa.Column('customer_name', sa.String(length=200), nullable=True, comment='甲方单位名称'))
    # Make supplier_id nullable (SQLite workaround: recreate table)
    with op.batch_alter_table('order') as batch_op:
        batch_op.alter_column('supplier_id', existing_type=sa.VARCHAR(length=36), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table('order') as batch_op:
        batch_op.alter_column('supplier_id', existing_type=sa.VARCHAR(length=36), nullable=False)
    op.drop_column('order', 'customer_name')
