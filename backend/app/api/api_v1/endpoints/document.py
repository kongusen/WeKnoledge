from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID
import os
import tempfile
from pathlib import Path

from app.api import deps
from app.models.user import User
from app.models.document import Document, DocumentChunk, KnowledgeBase
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate, DocumentChunkResponse
from app.services.document_service import (
    create_document, update_document, get_document, get_document_chunks,
    process_document_file, extract_text_from_file
)

router = APIRouter()

@router.post("/", response_model=DocumentResponse)
def create_new_document(
    *,
    db: Session = Depends(deps.get_db),
    document_in: DocumentCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    创建新文档
    """
    # 检查知识库是否存在以及权限
    knowledge_base = db.query(KnowledgeBase).filter(KnowledgeBase.id == document_in.knowledge_base_id).first()
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="知识库不存在"
        )
    
    # 检查权限（仅所有者和管理员可以添加文档）
    if knowledge_base.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    # 创建文档
    document = create_document(
        db=db,
        obj_in=document_in,
        creator_id=current_user.id
    )
    
    return document

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    title: str = Form(...),
    knowledge_base_id: UUID = Form(...),
    tags: str = Form(""),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    上传文档文件并处理
    """
    # 检查知识库是否存在以及权限
    knowledge_base = db.query(KnowledgeBase).filter(KnowledgeBase.id == knowledge_base_id).first()
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="知识库不存在"
        )
    
    # 检查权限（仅所有者和管理员可以添加文档）
    if knowledge_base.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    # 创建临时文件
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        content = await file.read()
        temp.write(content)
        temp_path = temp.name
    
    try:
        # 提取文件内容
        content, metadata = extract_text_from_file(temp_path)
        
        # 处理标签
        tag_list = [tag.strip() for tag in tags.split(",")] if tags else []
        
        # 创建文档
        document_in = DocumentCreate(
            title=title,
            content=content,
            knowledge_base_id=knowledge_base_id,
            tags=tag_list,
            doc_type=metadata.get("doc_type", "text"),
            metadata=metadata
        )
        
        document = create_document(
            db=db,
            obj_in=document_in,
            creator_id=current_user.id
        )
        
        # 在后台处理文档（分块和生成向量）
        background_tasks.add_task(
            process_document_file,
            db=db,
            document_id=document.id
        )
        
        return document
    
    finally:
        # 清理临时文件
        os.unlink(temp_path)

@router.get("/", response_model=List[DocumentResponse])
def read_documents(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    knowledge_base_id: Optional[UUID] = None,
    doc_type: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取文档列表
    """
    # 基础查询
    query = db.query(Document).join(
        KnowledgeBase, Document.knowledge_base_id == KnowledgeBase.id
    )
    
    # 基于知识库过滤
    if knowledge_base_id:
        query = query.filter(Document.knowledge_base_id == knowledge_base_id)
    
    # 基于文档类型过滤
    if doc_type:
        query = query.filter(Document.doc_type == doc_type)
    
    # 基于标签过滤
    if tag:
        query = query.filter(Document.tags.contains([tag]))
    
    # 非管理员只能看到自己有权限的知识库中的文档
    if not current_user.is_superuser:
        query = query.filter(
            (KnowledgeBase.owner_id == current_user.id) |
            (KnowledgeBase.is_public == True)
        )
    
    # 分页
    documents = query.offset(skip).limit(limit).all()
    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
def read_document(
    *,
    db: Session = Depends(deps.get_db),
    document_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取单个文档详情
    """
    document = get_document(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    
    # 检查文档所属知识库是否存在
    knowledge_base = db.query(KnowledgeBase).filter(KnowledgeBase.id == document.knowledge_base_id).first()
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档所属知识库不存在"
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
    
    return document

@router.get("/{document_id}/chunks", response_model=List[DocumentChunkResponse])
def read_document_chunks_api(
    *,
    db: Session = Depends(deps.get_db),
    document_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取文档的所有切片
    """
    document = get_document(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    
    # 检查文档所属知识库是否存在
    knowledge_base = db.query(KnowledgeBase).filter(KnowledgeBase.id == document.knowledge_base_id).first()
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档所属知识库不存在"
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
    
    chunks = get_document_chunks(db, document_id=document_id)
    return chunks

@router.put("/{document_id}", response_model=DocumentResponse)
def update_document_api(
    *,
    db: Session = Depends(deps.get_db),
    document_id: UUID,
    document_in: DocumentUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    更新文档
    """
    document = get_document(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    
    # 检查文档所属知识库是否存在
    knowledge_base = db.query(KnowledgeBase).filter(KnowledgeBase.id == document.knowledge_base_id).first()
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档所属知识库不存在"
        )
    
    # 检查权限
    if (
        knowledge_base.owner_id != current_user.id
        and document.creator_id != current_user.id
        and not current_user.is_superuser
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    document = update_document(
        db=db,
        db_obj=document,
        obj_in=document_in,
        editor_id=current_user.id
    )
    
    return document

@router.delete("/{document_id}", response_model=dict)
def delete_document(
    *,
    db: Session = Depends(deps.get_db),
    document_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    删除文档
    """
    document = get_document(db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    
    # 检查文档所属知识库是否存在
    knowledge_base = db.query(KnowledgeBase).filter(KnowledgeBase.id == document.knowledge_base_id).first()
    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档所属知识库不存在"
        )
    
    # 检查权限
    if (
        knowledge_base.owner_id != current_user.id
        and document.creator_id != current_user.id
        and not current_user.is_superuser
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    # 删除文档
    db.delete(document)
    db.commit()
    
    return {"message": "文档已删除"} 