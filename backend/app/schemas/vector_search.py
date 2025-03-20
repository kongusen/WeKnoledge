from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

# 向量搜索请求
class VectorSearchRequest(BaseModel):
    query: str
    knowledge_base_id: Optional[UUID] = None
    doc_type: Optional[str] = None
    tags: Optional[List[str]] = None
    limit: Optional[int] = 5
    similarity_threshold: Optional[float] = 0.7

# 向量搜索响应
class VectorSearchResult(BaseModel):
    chunk_id: str
    document_id: str
    document_title: str
    content: str
    chunk_index: int
    metadata: Dict[str, Any]
    similarity: float
    score: float

class VectorSearchResponse(BaseModel):
    results: List[VectorSearchResult]
    query: str
    total: int 