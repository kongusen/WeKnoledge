from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.chat import ChatHistory
from app.schemas.qa import ChatMessage, ChatHistoryCreate, ChatHistoryUpdate, ChatHistory as ChatHistorySchema
from app.services.qa_service import create_chat_history, get_chat_history, get_user_chat_histories, update_chat_history, delete_chat_history

router = APIRouter()

@router.get("/", response_model=List[ChatHistorySchema])
def read_chat_histories(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取当前用户的所有聊天记录
    """
    histories = get_user_chat_histories(db, user_id=current_user.id, skip=skip, limit=limit)
    return histories

@router.post("/", response_model=ChatHistorySchema)
def create_new_chat_history(
    *,
    db: Session = Depends(deps.get_db),
    chat_history_in: ChatHistoryCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    创建新的聊天记录
    """
    chat_history = create_chat_history(db=db, obj_in=chat_history_in, user_id=current_user.id)
    return chat_history

@router.get("/{history_id}", response_model=ChatHistorySchema)
def read_chat_history(
    *,
    db: Session = Depends(deps.get_db),
    history_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取特定的聊天记录
    """
    chat_history = get_chat_history(db=db, history_id=history_id)
    if not chat_history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="聊天记录不存在"
        )
    
    # 检查是否有权限访问此聊天记录
    if chat_history.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    return chat_history

@router.put("/{history_id}", response_model=ChatHistorySchema)
def update_chat_history_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    history_id: UUID,
    chat_history_in: ChatHistoryUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    更新聊天记录
    """
    chat_history = get_chat_history(db=db, history_id=history_id)
    if not chat_history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="聊天记录不存在"
        )
    
    # 检查是否有权限修改此聊天记录
    if chat_history.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    chat_history = update_chat_history(db=db, db_obj=chat_history, obj_in=chat_history_in)
    return chat_history

@router.delete("/{history_id}", response_model=dict)
def delete_chat_history_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    history_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    删除聊天记录
    """
    chat_history = get_chat_history(db=db, history_id=history_id)
    if not chat_history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="聊天记录不存在"
        )
    
    # 检查是否有权限删除此聊天记录
    if chat_history.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    delete_chat_history(db=db, history_id=history_id)
    return {"status": "success"} 