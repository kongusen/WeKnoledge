from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, UUID4
from app.schemas.user import User

# 基础历史记录属性
class HistoryBase(BaseModel):
    type: str
    content: str
    result: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

# 创建历史记录时的属性
class HistoryCreate(HistoryBase):
    pass

# 数据库中的历史记录
class HistoryInDBBase(HistoryBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

# 返回给API的历史记录
class History(HistoryInDBBase):
    user: Optional[User] = None

# 前端历史记录项目
class HistoryItem(BaseModel):
    """前端历史记录项模型"""
    id: str
    question: str
    time: str
    type: str  # 全局提问|文档解读|智能写作
    status: str  # 已回答|未回答

# 分页历史记录响应
class HistoryResponse(BaseModel):
    """历史记录分页响应"""
    items: List[HistoryItem]
    total: int
    page: int
    page_size: int

# 历史记录导出
class HistoryExport(BaseModel):
    """历史记录导出"""
    data: str  # JSON或CSV格式的数据
    filename: str
    format: str  # json|csv 