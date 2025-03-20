from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID, uuid4

from app.api import deps
from app.models.user import User
from app.models.document import Document, DocumentChunk, KnowledgeBase
from app.schemas.qa import QuestionRequest, AnswerResponse, ChatHistory, ChatHistoryCreate, ChatHistoryUpdate, ChatMessage
from app.services.qa_service import answer_question, create_chat_history, get_chat_history, update_chat_history

router = APIRouter()

@router.post("/ask", response_model=AnswerResponse)
async def ask_question(
    *,
    db: Session = Depends(deps.get_db),
    question: QuestionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    向知识库提问
    """
    # 如果指定了知识库ID，检查是否有权限
    if question.knowledge_base_id:
        kb = db.query(KnowledgeBase).filter(KnowledgeBase.id == question.knowledge_base_id).first()
        if not kb:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="知识库不存在"
            )
        
        # 检查权限
        if (
            kb.owner_id != current_user.id
            and not current_user.is_superuser
            and not kb.is_public
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="没有访问此知识库的权限"
            )
    
    # 如果提供了历史ID，验证是否有权限
    history = None
    if question.history_id and question.use_history:
        history = get_chat_history(db, history_id=question.history_id)
        if not history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="对话历史不存在"
            )
        
        # 检查是否是当前用户的历史
        if history.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="没有访问此对话历史的权限"
            )
    
    # 调用问答服务
    response = await answer_question(
        db=db,
        question=question,
        user_id=current_user.id,
        history=history
    )
    
    # 如果需要，在后台更新对话历史
    if question.use_history:
        if history:
            # 更新现有历史
            history.messages.append(
                ChatMessage(role="user", content=question.query)
            )
            history.messages.append(
                ChatMessage(role="assistant", content=response.answer)
            )
            background_tasks.add_task(
                update_chat_history,
                db=db,
                history=history,
                update_data=ChatHistoryUpdate(messages=history.messages)
            )
        else:
            # 创建新的历史
            new_history = ChatHistoryCreate(
                title=question.query[:30] + "..." if len(question.query) > 30 else question.query
            )
            messages = [
                ChatMessage(role="user", content=question.query),
                ChatMessage(role="assistant", content=response.answer)
            ]
            background_tasks.add_task(
                create_chat_history,
                db=db,
                history_in=new_history,
                user_id=current_user.id,
                messages=messages
            )
    
    return response

@router.get("/history", response_model=List[ChatHistory])
def get_chat_histories(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取用户的对话历史列表
    """
    # 基础查询
    query = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id)
    
    # 分页
    histories = query.offset(skip).limit(limit).all()
    return histories

@router.get("/history/{history_id}", response_model=ChatHistory)
def get_chat_history_by_id(
    *,
    db: Session = Depends(deps.get_db),
    history_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取单个对话历史详情
    """
    history = get_chat_history(db, history_id=history_id)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="对话历史不存在"
        )
    
    # 检查是否是当前用户的历史
    if history.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有访问此对话历史的权限"
        )
    
    return history

@router.delete("/history/{history_id}", response_model=dict)
def delete_chat_history(
    *,
    db: Session = Depends(deps.get_db),
    history_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    删除对话历史
    """
    history = get_chat_history(db, history_id=history_id)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="对话历史不存在"
        )
    
    # 检查是否是当前用户的历史
    if history.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有访问此对话历史的权限"
        )
    
    # 删除历史
    db.delete(history)
    db.commit()
    
    return {"message": "对话历史已删除"} 