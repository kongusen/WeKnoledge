"""initial schema

Revision ID: 00000000000
Revises: 
Create Date: 2025-03-20 00:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from pgvector.sqlalchemy import Vector
import uuid


# revision identifiers, used by Alembic.
revision: str = '00000000000'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建pgvector扩展
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # 创建users表
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('username', sa.String(), nullable=False, index=True),
        sa.Column('email', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # 创建知识库表
    op.create_table(
        'knowledge_items',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('title', sa.String(), nullable=False, index=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('tags', ARRAY(sa.String()), default=[]),
        sa.Column('type', sa.String(), default="personal"),
        sa.Column('embedding', Vector(1536), nullable=True),
        sa.Column('item_metadata', sa.JSON(), default={}),
        sa.Column('views', sa.Integer(), default=0),
        sa.Column('likes', sa.Integer(), default=0),
        sa.Column('is_public', sa.Boolean(), default=False),
        sa.Column('author_id', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # 创建历史记录表
    op.create_table(
        'history',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('result', sa.Text()),
        sa.Column('history_metadata', sa.JSON(), default={}),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('history')
    op.drop_table('knowledge_items')
    op.drop_table('users') 