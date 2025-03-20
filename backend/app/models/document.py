from sqlalchemy import Boolean, Column, String, Text, DateTime, ForeignKey, Integer, JSON, func, ARRAY, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from pgvector.sqlalchemy import Vector

from app.db.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx, txt等
    content = Column(Text, nullable=True)  # 文档内容，可能很长
    file_path = Column(String, nullable=True)  # 文件存储路径
    file_size = Column(Integer, nullable=False, default=0)  # 文件大小
    status = Column(String, nullable=False, default="pending")  # pending, processing, completed, failed
    error_message = Column(String, nullable=True)  # 处理过程中的错误信息
    tags = Column(ARRAY(String), default=[])
    document_metadata = Column(JSON, default={})
    
    # 关联知识库
    knowledge_base_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_bases.id"), nullable=True)
    knowledge_base = relationship("KnowledgeBase", back_populates="documents")
    
    # 用户关联
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    user = relationship("User", backref="documents")
    
    # 文档块
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)
    page_number = Column(Integer, nullable=True)
    order = Column(Integer, nullable=False)  # 在文档中的顺序
    chunk_metadata = Column(JSON, default={})
    
    # 关联文档
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    document = relationship("Document", back_populates="chunks")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    class Config:
        from_attributes = True

class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String, default="personal")  # personal或organization
    embedding_model = Column(String, default="text-embedding-3-small")
    tags = Column(ARRAY(String), default=[])
    knowledge_base_metadata = Column(JSON, default={})
    
    # 关联文档
    documents = relationship("Document", back_populates="knowledge_base")
    
    # 用户关联
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="knowledge_bases")
    
    # 权限设置
    is_public = Column(Boolean, default=False)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    class Config:
        from_attributes = True 