from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

class WritingStyle(BaseModel):
    """写作风格数据模型"""
    id: str = Field(..., description="风格ID")
    name: str = Field(..., description="风格名称")
    description: str = Field(..., description="风格描述")

class WritingType(BaseModel):
    """写作类型数据模型"""
    id: str = Field(..., description="类型ID")
    name: str = Field(..., description="类型名称")
    description: str = Field(..., description="类型描述")

class ContentGenerationParams(BaseModel):
    """内容生成参数"""
    topic: str = Field(..., description="写作主题")
    writing_type: str = Field(..., description="写作类型ID")
    style: str = Field(..., description="写作风格ID")
    keywords: List[str] = Field(default=[], description="关键词列表")
    max_length: int = Field(default=800, description="最大长度")
    reference_text: Optional[str] = Field(default="", description="参考文档内容")
    output_format: Optional[str] = Field(default="markdown", description="输出格式：text或markdown")

class ContentResponse(BaseModel):
    """内容生成响应"""
    content: str = Field(..., description="生成的内容")
    writing_type: str = Field(..., description="写作类型ID")
    style: str = Field(..., description="写作风格ID")
    token_count: int = Field(..., description="消耗的token数量")
    format: str = Field(..., description="内容格式：text或markdown")

class TextImprovementParams(BaseModel):
    """文本改进参数"""
    original_text: str = Field(..., description="原始文本")
    improvement_type: str = Field(..., description="改进类型")
    tone: Optional[str] = Field(default=None, description="语气调整")
    output_format: Optional[str] = Field(default="markdown", description="输出格式：text或markdown")

class TextImprovementResponse(BaseModel):
    """文本改进响应"""
    improved_text: str = Field(..., description="改进后的文本")
    improvement_type: str = Field(..., description="改进类型")
    token_count: int = Field(..., description="消耗的token数量")
    format: str = Field(..., description="内容格式：text或markdown")

# 写作文档相关模型
class WritingDocumentBase(BaseModel):
    """写作文档基础模型"""
    title: str
    content: str
    type: str = "article"

class WritingDocumentCreate(WritingDocumentBase):
    """创建写作文档请求模型"""
    pass

class WritingDocumentUpdate(BaseModel):
    """更新写作文档请求模型"""
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None

class WritingDocumentResponse(WritingDocumentBase):
    """写作文档响应模型"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# AI辅助写作请求
class AIAssistRequest(BaseModel):
    """AI辅助写作请求"""
    prompt_type: str = Field(..., description="提示类型: continue, improve, summarize, translate, custom")
    content: str = Field(..., description="文档内容")
    selected_text: Optional[str] = Field(default=None, description="选中的文本")
    custom_prompt: Optional[str] = Field(default=None, description="自定义提示")
    writing_style: str = Field(default="conversational", description="写作风格")
    writing_length: str = Field(default="medium", description="写作长度")

class AIAssistResponse(BaseModel):
    """AI辅助写作响应"""
    result: str = Field(..., description="生成的内容")
    token_count: int = Field(default=0, description="消耗的token数量") 