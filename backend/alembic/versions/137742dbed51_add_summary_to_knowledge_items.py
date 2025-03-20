"""add summary to knowledge items

Revision ID: 137742dbed51
Revises: 00000000000
Create Date: 2025-03-19 13:59:58.654522+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector


# revision identifiers, used by Alembic.
revision: str = '137742dbed51'
down_revision: Union[str, None] = '00000000000'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 由于我们在初始迁移中已经添加了summary字段，所以这个迁移不需要做任何事情
    pass


def downgrade() -> None:
    # 不需要任何操作
    pass 