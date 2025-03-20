from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import os
import uuid
import tempfile
import datetime
import re
import logging
from pathlib import Path

from app.models.document import Document, DocumentChunk, KnowledgeBase
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.vector_service import get_embedding, chunk_text, get_sqlalchemy_vector

logger = logging.getLogger(__name__)

def create_document(
    db: Session, 
    obj_in: DocumentCreate, 
    creator_id: UUID
) -> Document:
    """
    创建文档记录
    
    Args:
        db: 数据库会话
        obj_in: 文档创建数据
        creator_id: 创建者ID
    
    Returns:
        创建的文档实例
    """
    # 创建文档
    db_obj = Document(
        id=uuid.uuid4(),
        filename=obj_in.title,  # 使用标题作为文件名
        file_type=obj_in.doc_type or "text",  # 文档类型
        content=obj_in.content,  # 文档内容
        file_size=len(obj_in.content) if obj_in.content else 0,  # 内容长度作为文件大小
        status="pending",  # 初始状态为待处理
        tags=obj_in.tags or [],
        document_metadata=obj_in.metadata or {},
        knowledge_base_id=obj_in.knowledge_base_id,
        user_id=creator_id
    )
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_document(
    db: Session, 
    db_obj: Document,
    obj_in: DocumentUpdate
) -> Document:
    """
    更新文档
    
    Args:
        db: 数据库会话
        db_obj: 要更新的文档对象
        obj_in: 更新数据
    
    Returns:
        更新后的文档
    """
    # 将obj_in转换为字典
    update_data = obj_in.model_dump(exclude_unset=True)
    
    # 更新文档元数据
    if "metadata" in update_data:
        if not db_obj.document_metadata:
            db_obj.document_metadata = {}
        db_obj.document_metadata.update(update_data["metadata"])
        del update_data["metadata"]
    
    # 更新其他字段
    for field in update_data:
        if field in ["content", "tags", "status", "error_message"]:
            setattr(db_obj, field, update_data[field])
    
    # 更新状态
    if "status" in update_data:
        db_obj.status = update_data["status"]
    
    # 如果内容被更新，更新文件大小
    if "content" in update_data:
        db_obj.file_size = len(update_data["content"]) if update_data["content"] else 0
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_document(
    db: Session, 
    document_id: UUID
) -> Optional[Document]:
    """
    根据ID获取文档
    
    Args:
        db: 数据库会话
        document_id: 文档ID
    
    Returns:
        文档对象或None
    """
    return db.query(Document).filter(Document.id == document_id).first()

def get_document_chunks(
    db: Session, 
    document_id: UUID
) -> List[DocumentChunk]:
    """
    获取文档的所有块
    
    Args:
        db: 数据库会话
        document_id: 文档ID
    
    Returns:
        文档块列表
    """
    return db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(DocumentChunk.order).all()

def extract_text_from_file(file_path: str) -> Tuple[str, Dict[str, Any]]:
    """
    从文件中提取文本内容
    
    Args:
        file_path: 文件路径
    
    Returns:
        提取的文本内容和元数据
    """
    # 获取文件扩展名
    suffix = Path(file_path).suffix.lower()
    
    # 初始化元数据
    metadata = {
        "filename": os.path.basename(file_path),
        "file_type": suffix[1:] if suffix else "unknown",
        "extraction_time": datetime.datetime.now().isoformat()
    }
    
    # 基于文件类型选择处理方法
    if suffix in [".txt", ".md"]:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        metadata["doc_type"] = "text"
    
    elif suffix == ".pdf":
        # 模拟PDF处理，实际应该使用PyPDF2或pdfplumber等库
        content = f"这是从PDF文件 {os.path.basename(file_path)} 中提取的模拟内容"
        metadata["doc_type"] = "pdf"
    
    elif suffix in [".docx", ".doc"]:
        # 模拟Word处理，实际应该使用python-docx库
        content = f"这是从Word文件 {os.path.basename(file_path)} 中提取的模拟内容"
        metadata["doc_type"] = "word"
    
    else:
        # 如果是不支持的格式，返回错误消息
        content = ""
        metadata["error"] = f"不支持的文件格式: {suffix}"
        metadata["doc_type"] = "unknown"
    
    return content, metadata

def process_document_file(
    db: Session,
    document_id: UUID,
    chunk_size: int = 1000,
    overlap: int = 200
):
    """
    处理文档文件，分割为块并生成嵌入向量
    
    Args:
        db: 数据库会话
        document_id: 文档ID
        chunk_size: 块大小
        overlap: 块重叠大小
    """
    try:
        # 获取文档
        document = get_document(db, document_id)
        if not document:
            logger.error(f"找不到文档 ID: {document_id}")
            return
        
        # 更新状态为处理中
        update_document(
            db=db,
            db_obj=document,
            obj_in=DocumentUpdate(status="processing")
        )
        
        # 检查是否有内容
        if not document.content:
            logger.error(f"文档 ID: {document_id} 没有内容")
            update_document(
                db=db,
                db_obj=document,
                obj_in=DocumentUpdate(
                    status="failed",
                    error_message="文档内容为空"
                )
            )
            return
        
        # 分割文本
        chunks = chunk_text(document.content, chunk_size, overlap)
        
        # 删除已有的块
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
        
        # 为每个块生成嵌入向量并保存
        for i, chunk_text in enumerate(chunks):
            # 生成嵌入向量
            embedding = get_embedding(chunk_text)
            
            # 创建文档块
            chunk = DocumentChunk(
                id=uuid.uuid4(),
                document_id=document_id,
                text=chunk_text,
                embedding=get_sqlalchemy_vector(embedding),
                page_number=None,  # 简单实现不考虑页码
                order=i,
                chunk_metadata={
                    "index": i,
                    "length": len(chunk_text)
                }
            )
            
            db.add(chunk)
        
        # 更新状态为已完成
        update_document(
            db=db,
            db_obj=document,
            obj_in=DocumentUpdate(status="completed")
        )
        
        db.commit()
        logger.info(f"文档 ID: {document_id} 处理完成，生成了 {len(chunks)} 个块")
        
    except Exception as e:
        logger.exception(f"处理文档时出错 ID: {document_id} - {str(e)}")
        # 更新状态为失败
        try:
            update_document(
                db=db,
                db_obj=document,
                obj_in=DocumentUpdate(
                    status="failed",
                    error_message=str(e)
                )
            )
            db.commit()
        except Exception as update_error:
            logger.exception(f"更新文档状态时出错: {str(update_error)}")

def create_knowledge_base(
    db: Session, 
    obj_in: "KnowledgeBaseCreate", 
    owner_id: UUID
) -> KnowledgeBase:
    """
    创建知识库
    
    Args:
        db: 数据库会话
        obj_in: 知识库创建数据
        owner_id: 所有者ID
    
    Returns:
        创建的知识库实例
    """
    # 创建知识库
    db_obj = KnowledgeBase(
        id=uuid.uuid4(),
        name=obj_in.name,
        description=obj_in.description,
        type=obj_in.type or "personal",
        embedding_model=obj_in.embedding_model or "text-embedding-3-small",
        tags=obj_in.tags or [],
        knowledge_base_metadata=obj_in.metadata or {},
        user_id=owner_id,
        is_public=obj_in.is_public or False
    )
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_knowledge_base(
    db: Session, 
    db_obj: KnowledgeBase,
    obj_in: "KnowledgeBaseUpdate"
) -> KnowledgeBase:
    """
    更新知识库
    
    Args:
        db: 数据库会话
        db_obj: 要更新的知识库对象
        obj_in: 更新数据
    
    Returns:
        更新后的知识库
    """
    # 将obj_in转换为字典
    update_data = obj_in.model_dump(exclude_unset=True)
    
    # 更新元数据
    if "metadata" in update_data:
        if not db_obj.knowledge_base_metadata:
            db_obj.knowledge_base_metadata = {}
        db_obj.knowledge_base_metadata.update(update_data["metadata"])
        del update_data["metadata"]
    
    # 更新其他字段
    for field in update_data:
        if field in ["name", "description", "type", "embedding_model", "tags", "is_public"]:
            setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_knowledge_base(
    db: Session, 
    knowledge_base_id: UUID
) -> Optional[KnowledgeBase]:
    """
    根据ID获取知识库
    
    Args:
        db: 数据库会话
        knowledge_base_id: 知识库ID
    
    Returns:
        知识库对象或None
    """
    return db.query(KnowledgeBase).filter(KnowledgeBase.id == knowledge_base_id).first()

def get_user_knowledge_bases(
    db: Session, 
    user_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[KnowledgeBase]:
    """
    获取用户的所有知识库
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        skip: 跳过的记录数
        limit: 返回的最大记录数
    
    Returns:
        知识库列表
    """
    return db.query(KnowledgeBase).filter(
        KnowledgeBase.user_id == user_id
    ).offset(skip).limit(limit).all()

def delete_knowledge_base(
    db: Session, 
    knowledge_base_id: UUID
) -> bool:
    """
    删除知识库及其所有文档
    
    Args:
        db: 数据库会话
        knowledge_base_id: 知识库ID
    
    Returns:
        是否成功删除
    """
    # 先删除所有相关的文档块
    document_ids = [doc.id for doc in db.query(Document).filter(Document.knowledge_base_id == knowledge_base_id).all()]
    for doc_id in document_ids:
        db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
    
    # 删除所有相关的文档
    db.query(Document).filter(Document.knowledge_base_id == knowledge_base_id).delete()
    
    # 删除知识库
    result = db.query(KnowledgeBase).filter(KnowledgeBase.id == knowledge_base_id).delete()
    db.commit()
    
    return result > 0 