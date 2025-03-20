from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

# 文档创建
class DocumentCreate(BaseModel):
    title: str
    content: str
    doc_type: Optional[str] = "text"
    tags: Optional[List[str]] = []
    knowledge_base_id: UUID
    metadata: Optional[Dict[str, Any]] = None

# 文档更新
class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    doc_type: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

# 文档响应
class DocumentResponse(BaseModel):
    id: UUID
    title: str
    doc_type: Optional[str]
    tags: Optional[List[str]]
    knowledge_base_id: UUID
    created_at: datetime
    updated_at: datetime
    creator_id: UUID
    has_embedding: bool
    metadata: Optional[Dict[str, Any]]

    class Config:
        orm_mode = True

# 文档块响应
class DocumentChunkResponse(BaseModel):
    id: UUID
    document_id: UUID
    content: str
    chunk_index: int
    has_embedding: bool
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# 知识库创建
class KnowledgeBaseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    embedding_model: Optional[str] = "text-embedding-3-small"
    search_config: Optional[Dict[str, Any]] = None

# 知识库更新
class KnowledgeBaseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    embedding_model: Optional[str] = None
    search_config: Optional[Dict[str, Any]] = None

# 知识库响应
class KnowledgeBaseResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    is_public: bool
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    document_count: int = 0

    class Config:
        orm_mode = True 