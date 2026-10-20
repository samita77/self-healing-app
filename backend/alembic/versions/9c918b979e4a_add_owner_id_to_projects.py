"""add owner_id to projects

Revision ID: 9c918b979e4a
Revises: c5655d773fc6
Create Date: 2026-10-20 11:37:21.233759

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c918b979e4a'
down_revision: Union[str, Sequence[str], None] = 'c5655d773fc6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Added as nullable first: the three existing projects have no owner, and
    # a NOT NULL column cannot be added to a non-empty table in one step.
    op.add_column('projects', sa.Column('owner_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_projects_owner_id'), 'projects', ['owner_id'], unique=False)
    op.create_foreign_key(
        'fk_projects_owner_id_users', 'projects', 'users', ['owner_id'], ['id']
    )

    # Existing projects belong to the seeded administrator (id=1).
    op.execute('UPDATE projects SET owner_id = 1 WHERE owner_id IS NULL')

    # Now that every row has an owner, ownership becomes required.
    op.alter_column(
        'projects', 'owner_id', existing_type=sa.Integer(), nullable=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'projects', 'owner_id', existing_type=sa.Integer(), nullable=True
    )
    op.drop_constraint('fk_projects_owner_id_users', 'projects', type_='foreignkey')
    op.drop_index(op.f('ix_projects_owner_id'), table_name='projects')
    op.drop_column('projects', 'owner_id')
