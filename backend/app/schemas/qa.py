from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

# 问答请求
class QuestionRequest(BaseModel):
    query: str
    knowledge_base_id: Optional[UUID] = None
    history_id: Optional[UUID] = None
    use_history: bool = True
    max_results: int = 5
    similarity_threshold: float = 0.7

# 引用文档
class CitationInfo(BaseModel):
    document_id: str
    document_title: str
    chunk_id: str
    content: str
    similarity: float

# 问答响应
class AnswerResponse(BaseModel):
    query: str
    answer: str
    citations: List[CitationInfo]
    history_id: Optional[str] = None

# 对话历史记录
class ChatMessage(BaseModel):
    role: str  # "user" 或 "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# 对话历史
class ChatHistory(BaseModel):
    id: UUID
    user_id: UUID
    messages: List[ChatMessage]
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# 创建对话历史
class ChatHistoryCreate(BaseModel):
    title: Optional[str] = None

# 更新对话历史
class ChatHistoryUpdate(BaseModel):
    title: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None 