from sqlalchemy import Boolean, Column, String, Text, DateTime, ForeignKey, Integer, JSON, func, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from pgvector.sqlalchemy import Vector

from app.db.session import Base

class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)  # 新增摘要字段
    tags = Column(ARRAY(String), default=[])
    type = Column(String, default="personal")  # personal或organization
    embedding = Column(Vector(1536))  # 存储文本的向量表示，维度为1536（适用于OpenAI embeddings）
    item_metadata = Column(JSON, default={})  # 重命名metadata为item_metadata
    
    # 统计和状态
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    is_public = Column(Boolean, default=False)
    
    # 外键关系
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    author = relationship("User", backref="knowledge_items")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    class Config:
        orm_mode = True 