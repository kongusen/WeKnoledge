from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, UUID4
from app.schemas.user import User

# 共享属性
class KnowledgeItemBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[List[str]] = []
    type: Optional[str] = "personal"  # personal或organization
    is_public: Optional[bool] = False

# 创建知识条目时的属性
class KnowledgeItemCreate(KnowledgeItemBase):
    title: str
    content: str
    metadata: Optional[Dict[str, Any]] = {}

# 更新知识条目时的属性
class KnowledgeItemUpdate(KnowledgeItemBase):
    metadata: Optional[Dict[str, Any]] = None

# 存储在数据库中的知识条目信息
class KnowledgeItemInDBBase(KnowledgeItemBase):
    id: UUID4
    author_id: UUID4
    views: int
    likes: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    metadata: Dict[str, Any]

    class Config:
        from_attributes = True

# 返回给API的知识条目信息
class KnowledgeItem(KnowledgeItemInDBBase):
    author: Optional[User] = None

# 向量搜索结果
class KnowledgeSearchResult(BaseModel):
    item: KnowledgeItem
    score: float
    similarity: float 