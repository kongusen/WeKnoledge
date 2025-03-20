from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.document import KnowledgeBase, Document
from app.schemas.document import KnowledgeBaseCreate, KnowledgeBaseResponse, KnowledgeBaseUpdate
from app.services.document_service import create_knowledge_base, update_knowledge_base, get_knowledge_base

router = APIRouter()

@router.post("/", response_model=KnowledgeBaseResponse)
def create_new_knowledge_base(
    *,
    db: Session = Depends(deps.get_db),
    kb_in: KnowledgeBaseCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    创建新的知识库
    """
    # 创建知识库
    knowledge_base = create_knowledge_base(
        db=db,
        obj_in=kb_in,
        owner_id=current_user.id
    )
    
    return knowledge_base

@router.get("/", response_model=List[KnowledgeBaseResponse])
def read_knowledge_bases(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取当前用户可访问的知识库列表
    """
    # 基础查询
    query = db.query(KnowledgeBase)
    
    # 非管理员只能看到自己拥有的或有权限的知识库
    if not current_user.is_superuser:
        query = query.filter(
            (KnowledgeBase.owner_id == current_user.id) |
            (KnowledgeBase.is_public == True)
        )
    
    # 分页
    knowledge_bases = query.offset(skip).limit(limit).all()
    
    # 附加文档数量
    for kb in knowledge_bases:
        kb.document_count = db.query(Document).filter(Document.knowledge_base_id == kb.id).count()
    
    return knowledge_bases

@router.get("/{kb_id}", response_model=KnowledgeBaseResponse)
def read_knowledge_base(
    *,
    db: Session = Depends(deps.get_db),
    kb_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取单个知识库详情
    """
    knowledge_base = get_knowledge_base(db, kb_id=kb_id)
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="知识库不存在"
        )
    
    # 检查权限
    if (
        knowledge_base.owner_id != current_user.id
        and not current_user.is_superuser
        and not knowledge_base.is_public
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    # 添加文档数量
    knowledge_base.document_count = db.query(Document).filter(Document.knowledge_base_id == knowledge_base.id).count()
    
    return knowledge_base

@router.put("/{kb_id}", response_model=KnowledgeBaseResponse)
def update_kb(
    *,
    db: Session = Depends(deps.get_db),
    kb_id: UUID,
    kb_in: KnowledgeBaseUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    更新知识库
    """
    knowledge_base = get_knowledge_base(db, kb_id=kb_id)
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="知识库不存在"
        )
    
    # 检查权限（仅所有者和管理员可以编辑）
    if knowledge_base.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    knowledge_base = update_knowledge_base(
        db=db,
        db_obj=knowledge_base,
        obj_in=kb_in
    )
    
    # 添加文档数量
    knowledge_base.document_count = db.query(Document).filter(Document.knowledge_base_id == knowledge_base.id).count()
    
    return knowledge_base

@router.delete("/{kb_id}", response_model=dict)
def delete_kb(
    *,
    db: Session = Depends(deps.get_db),
    kb_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    删除知识库
    """
    knowledge_base = get_knowledge_base(db, kb_id=kb_id)
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="知识库不存在"
        )
    
    # 检查权限（仅所有者和管理员可以删除）
    if knowledge_base.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    # 删除知识库
    db.delete(knowledge_base)
    db.commit()
    
    return {"message": "知识库已删除"} 