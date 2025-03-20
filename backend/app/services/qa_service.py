from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
import os
import logging
import json
import requests
from datetime import datetime

from app.models.document import Document, DocumentChunk, KnowledgeBase
from app.models.chat import ChatHistory
from app.schemas.qa import QuestionRequest, AnswerResponse, ChatMessage, ChatHistoryCreate, ChatHistoryUpdate, CitationInfo
from app.services.vector_service import get_embedding, cosine_similarity

logger = logging.getLogger(__name__)

async def answer_question(
    db: Session,
    question: QuestionRequest,
    user_id: UUID,
    history: Optional[ChatHistory] = None
) -> AnswerResponse:
    """
    基于知识库回答问题
    
    Args:
        db: 数据库会话
        question: 问题请求
        user_id: 用户ID
        history: 对话历史
    
    Returns:
        包含答案的响应
    """
    # 获取相关文档
    relevant_chunks = retrieve_relevant_chunks(
        db=db,
        query=question.query,
        knowledge_base_id=question.knowledge_base_id,
        max_results=question.max_results,
        similarity_threshold=question.similarity_threshold
    )
    
    # 构建上下文
    context = build_context(relevant_chunks)
    
    # 构建对话历史上下文
    history_context = []
    if history and question.use_history and history.messages:
        for msg in history.messages[-10:]:  # 只使用最近的10条消息
            history_context.append({
                "role": msg.role,
                "content": msg.content
            })
    
    # 调用LLM生成答案
    answer = generate_answer(
        query=question.query,
        context=context,
        history=history_context
    )
    
    # 构建引用信息
    citations = []
    for chunk, similarity in relevant_chunks:
        document = db.query(Document).filter(Document.id == chunk.document_id).first()
        if document:
            citations.append(
                CitationInfo(
                    document_id=str(chunk.document_id),
                    document_title=document.title,
                    chunk_id=str(chunk.id),
                    content=chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
                    similarity=similarity
                )
            )
    
    return AnswerResponse(
        query=question.query,
        answer=answer,
        citations=citations,
        history_id=str(history.id) if history else None
    )

def retrieve_relevant_chunks(
    db: Session,
    query: str,
    knowledge_base_id: Optional[UUID] = None,
    max_results: int = 5,
    similarity_threshold: float = 0.7
) -> List[Tuple[DocumentChunk, float]]:
    """
    检索与查询相关的文档块
    
    Args:
        db: 数据库会话
        query: 查询文本
        knowledge_base_id: 知识库ID
        max_results: 最大返回结果数
        similarity_threshold: 相似度阈值
    
    Returns:
        文档块和相似度分数的元组列表
    """
    # 生成查询向量
    query_embedding = get_embedding(query)
    
    # 获取所有文档块
    chunks_query = db.query(DocumentChunk).filter(DocumentChunk.has_embedding == True)
    
    # 如果指定了知识库ID，进行过滤
    if knowledge_base_id:
        chunks_query = chunks_query.join(
            Document, DocumentChunk.document_id == Document.id
        ).filter(Document.knowledge_base_id == knowledge_base_id)
    
    chunks = chunks_query.all()
    
    # 计算相似度
    results = []
    for chunk in chunks:
        # 如果块没有嵌入向量，跳过
        if not chunk.embedding:
            continue
        
        # 计算相似度
        similarity = cosine_similarity(query_embedding, chunk.embedding)
        
        # 如果相似度低于阈值，跳过
        if similarity < similarity_threshold:
            continue
        
        results.append((chunk, similarity))
    
    # 按相似度排序并限制结果数量
    results.sort(key=lambda x: x[1], reverse=True)
    return results[:max_results]

def build_context(chunks: List[Tuple[DocumentChunk, float]]) -> str:
    """
    构建查询上下文
    
    Args:
        chunks: 文档块和相似度分数的元组列表
    
    Returns:
        构建的上下文字符串
    """
    context = "以下是从知识库中检索到的相关内容：\n\n"
    
    for i, (chunk, similarity) in enumerate(chunks, 1):
        context += f"[文档块 {i}]：\n{chunk.content}\n\n"
    
    return context

def generate_answer(
    query: str,
    context: str,
    history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    使用LLM生成答案
    
    Args:
        query: 查询文本
        context: 知识库上下文
        history: 对话历史列表
    
    Returns:
        生成的答案
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "无法访问LLM服务：未设置API密钥"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # 构建系统消息
        system_message = """
        你是一个智能问答助手，任务是基于给定的知识库内容回答用户的问题。
        请遵循以下规则：
        1. 只回答与知识库内容相关的问题，如果问题超出知识库范围，请明确说明
        2. 回答要基于知识库内容，不要生成与知识库无关的信息
        3. 如果知识库内容不足以完整回答问题，请明确告知用户
        4. 保持回答的客观性和准确性
        5. 格式化你的回答，使其易于阅读和理解
        """
        
        # 构建消息列表
        messages = [
            {"role": "system", "content": system_message},
        ]
        
        # 添加历史对话
        if history:
            messages.extend(history)
        
        # 添加当前问题和上下文
        messages.append({
            "role": "user", 
            "content": f"请基于以下知识库内容回答问题：\n\n{context}\n\n问题：{query}"
        })
        
        # 调用OpenAI API
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        else:
            logger.error(f"OpenAI API调用失败: {response.status_code} - {response.text}")
            return f"生成回答时出错: API返回代码 {response.status_code}"
            
    except Exception as e:
        logger.exception(f"生成回答时出错: {str(e)}")
        return f"生成回答时出错: {str(e)}"

def create_chat_history(
    db: Session,
    history_in: ChatHistoryCreate,
    user_id: UUID,
    messages: List[ChatMessage]
) -> ChatHistory:
    """
    创建对话历史
    
    Args:
        db: 数据库会话
        history_in: 对话历史创建数据
        user_id: 用户ID
        messages: 消息列表
    
    Returns:
        创建的对话历史
    """
    # 创建对话历史
    db_history = ChatHistory(
        id=uuid4(),
        user_id=user_id,
        title=history_in.title,
        messages=messages,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def update_chat_history(
    db: Session,
    history: ChatHistory,
    update_data: ChatHistoryUpdate
) -> ChatHistory:
    """
    更新对话历史
    
    Args:
        db: 数据库会话
        history: 对话历史对象
        update_data: 更新数据
    
    Returns:
        更新后的对话历史
    """
    # 更新字段
    if update_data.title is not None:
        history.title = update_data.title
    
    if update_data.messages is not None:
        history.messages = update_data.messages
    
    history.updated_at = datetime.utcnow()
    
    db.add(history)
    db.commit()
    db.refresh(history)
    return history

def get_chat_history(
    db: Session,
    history_id: UUID
) -> Optional[ChatHistory]:
    """
    获取对话历史
    
    Args:
        db: 数据库会话
        history_id: 对话历史ID
    
    Returns:
        对话历史对象或None
    """
    return db.query(ChatHistory).filter(ChatHistory.id == history_id).first()

def get_user_chat_histories(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[ChatHistory]:
    """
    获取用户的所有对话历史
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        skip: 跳过的记录数
        limit: 返回的最大记录数
    
    Returns:
        对话历史列表
    """
    return db.query(ChatHistory).filter(
        ChatHistory.user_id == user_id
    ).order_by(
        ChatHistory.updated_at.desc()
    ).offset(skip).limit(limit).all()

def delete_chat_history(
    db: Session,
    history_id: UUID
) -> bool:
    """
    删除对话历史
    
    Args:
        db: 数据库会话
        history_id: 对话历史ID
    
    Returns:
        是否成功删除
    """
    history = db.query(ChatHistory).filter(ChatHistory.id == history_id).first()
    if not history:
        return False
    
    db.delete(history)
    db.commit()
    return True 