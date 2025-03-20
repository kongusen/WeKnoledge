from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.writing import WritingDocument
from app.schemas.writing import (
    WritingDocumentCreate, 
    WritingDocumentUpdate, 
    WritingDocumentResponse,
    AIAssistRequest,
    AIAssistResponse,
    WritingStyle,
    WritingType
)
from app.services.writing_service import WritingService
from app.services.vector_service import VectorService

router = APIRouter()

# 写作风格和类型API
@router.get("/styles", response_model=List[WritingStyle])
async def get_writing_styles(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取所有可用的写作风格
    """
    writing_service = WritingService()
    return await writing_service.get_writing_styles()

@router.get("/types", response_model=List[WritingType])
async def get_writing_types(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取所有可用的写作类型
    """
    writing_service = WritingService()
    return await writing_service.get_writing_types()

# 写作文档CRUD
@router.post("/documents", response_model=WritingDocumentResponse)
def create_writing_document(
    *,
    db: Session = Depends(deps.get_db),
    document_in: WritingDocumentCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    创建新的写作文档
    """
    writing_service = WritingService()
    return writing_service.create_writing_document(db=db, obj_in=document_in, user_id=current_user.id)

@router.get("/documents", response_model=List[WritingDocumentResponse])
def read_writing_documents(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取当前用户的所有写作文档
    """
    writing_service = WritingService()
    documents = writing_service.get_user_writing_documents(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    return documents

@router.get("/documents/{document_id}", response_model=WritingDocumentResponse)
def read_writing_document(
    *,
    db: Session = Depends(deps.get_db),
    document_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    通过ID获取写作文档
    """
    writing_service = WritingService()
    document = writing_service.get_writing_document(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    
    # 检查权限
    if document.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    return document

@router.put("/documents/{document_id}", response_model=WritingDocumentResponse)
def update_writing_document(
    *,
    db: Session = Depends(deps.get_db),
    document_id: UUID,
    document_in: WritingDocumentUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    更新写作文档
    """
    writing_service = WritingService()
    document = writing_service.get_writing_document(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    
    # 检查权限
    if document.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    document = writing_service.update_writing_document(
        db=db, db_obj=document, obj_in=document_in
    )
    return document

@router.delete("/documents/{document_id}", response_model=dict)
def delete_writing_document(
    *,
    db: Session = Depends(deps.get_db),
    document_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    删除写作文档
    """
    writing_service = WritingService()
    document = writing_service.get_writing_document(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    
    # 检查权限
    if document.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    writing_service.delete_writing_document(db=db, document_id=document_id)
    return {"status": "success"}

# AI辅助写作
@router.post("/ai-assist", response_model=AIAssistResponse)
async def ai_writing_assist(
    *,
    request: AIAssistRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    使用AI辅助写作
    """
    writing_service = WritingService()
    return await writing_service.ai_writing_assist(request=request) 