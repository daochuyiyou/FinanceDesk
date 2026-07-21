"""add supplier_contract and supplier_unit_price tables

Revision ID: b463b3bd0f81
Revises: c5af0081ba7a
Create Date: 2026-07-01 19:57:05.601933

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b463b3bd0f81'
down_revision: Union[str, Sequence[str], None] = 'c5af0081ba7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('supplier_contract',
    sa.Column('supplier_id', sa.Integer(), nullable=False, comment='供应商ID'),
    sa.Column('contract_no', sa.String(length=100), nullable=False, comment='合同编号'),
    sa.Column('sign_date', sa.Date(), nullable=True, comment='签订日期'),
    sa.Column('start_date', sa.Date(), nullable=True, comment='合同开始日期'),
    sa.Column('end_date', sa.Date(), nullable=True, comment='合同结束日期'),
    sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=True, comment='合同金额'),
    sa.Column('status', sa.String(length=50), nullable=True, comment='合同状态'),
    sa.Column('remark', sa.Text(), nullable=True, comment='备注'),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=True, comment='逻辑删除标记'),
    sa.Column('created_at', sa.DateTime(), nullable=True, comment='创建时间'),
    sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新时间'),
    sa.ForeignKeyConstraint(['supplier_id'], ['supplier.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('contract_no')
    )
    op.create_index(op.f('ix_supplier_contract_id'), 'supplier_contract', ['id'], unique=False)
    op.create_index(op.f('ix_supplier_contract_supplier_id'), 'supplier_contract', ['supplier_id'], unique=False)
    op.create_table('supplier_unit_price',
    sa.Column('supplier_id', sa.Integer(), nullable=False, comment='供应商ID'),
    sa.Column('year', sa.Integer(), nullable=False, comment='年度'),
    sa.Column('laborer_price', sa.Numeric(precision=10, scale=2), nullable=True, comment='普工单价'),
    sa.Column('technician_price', sa.Numeric(precision=10, scale=2), nullable=True, comment='技工单价'),
    sa.Column('senior_technician_price', sa.Numeric(precision=10, scale=2), nullable=True, comment='高级技工单价'),
    sa.Column('special_work_price', sa.Numeric(precision=10, scale=2), nullable=True, comment='特种作业单价'),
    sa.Column('comprehensive_price', sa.Numeric(precision=10, scale=2), nullable=True, comment='综合单价'),
    sa.Column('remark', sa.Text(), nullable=True, comment='备注'),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=True, comment='逻辑删除标记'),
    sa.Column('created_at', sa.DateTime(), nullable=True, comment='创建时间'),
    sa.Column('updated_at', sa.DateTime(), nullable=True, comment='更新时间'),
    sa.ForeignKeyConstraint(['supplier_id'], ['supplier.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('supplier_id', 'year', name='uq_supplier_unit_year')
    )
    op.create_index(op.f('ix_supplier_unit_price_id'), 'supplier_unit_price', ['id'], unique=False)
    op.create_index(op.f('ix_supplier_unit_price_supplier_id'), 'supplier_unit_price', ['supplier_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_supplier_unit_price_supplier_id'), table_name='supplier_unit_price')
    op.drop_index(op.f('ix_supplier_unit_price_id'), table_name='supplier_unit_price')
    op.drop_table('supplier_unit_price')
    op.drop_index(op.f('ix_supplier_contract_supplier_id'), table_name='supplier_contract')
    op.drop_index(op.f('ix_supplier_contract_id'), table_name='supplier_contract')
    op.drop_table('supplier_contract')
