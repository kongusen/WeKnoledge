from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.models.user import User
from app.models.document import Document, DocumentChunk, KnowledgeBase
from app.schemas.vector_search import VectorSearchRequest, VectorSearchResponse, VectorSearchResult
from app.services.vector_service import get_embedding, cosine_similarity

router = APIRouter()

@router.post("/search", response_model=VectorSearchResponse)
def search_by_vector(
    *,
    db: Session = Depends(deps.get_db),
    request: VectorSearchRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    基于向量相似度搜索文档
    """
    # 生成查询向量
    query_embedding = get_embedding(request.query)
    
    # 基础查询 - 获取所有文档块
    query = db.query(
        DocumentChunk,
        Document.title.label("document_title")
    ).join(
        Document, DocumentChunk.document_id == Document.id
    ).join(
        KnowledgeBase, Document.knowledge_base_id == KnowledgeBase.id
    ).filter(
        DocumentChunk.has_embedding == True
    )
    
    # 如果指定了知识库ID，进行过滤
    if request.knowledge_base_id:
        query = query.filter(Document.knowledge_base_id == request.knowledge_base_id)
    
    # 基于权限进行过滤
    # 如果不是超级用户，只能看到自己拥有的或有权限的知识库
    if not current_user.is_superuser:
        query = query.filter(
            (KnowledgeBase.owner_id == current_user.id) |
            (KnowledgeBase.is_public == True)
        )
    
    # 如果指定了文档类型，进行过滤
    if request.doc_type:
        query = query.filter(Document.doc_type == request.doc_type)
    
    # 如果指定了标签，进行过滤
    if request.tags and len(request.tags) > 0:
        for tag in request.tags:
            query = query.filter(Document.tags.contains([tag]))
    
    # 获取所有文档块
    chunks = query.all()
    
    # 计算相似度并排序
    results = []
    for chunk, document_title in chunks:
        # 如果块没有嵌入向量，跳过
        if not chunk.embedding:
            continue
        
        # 计算相似度
        similarity = cosine_similarity(query_embedding, chunk.embedding)
        
        # 如果相似度低于阈值，跳过
        if similarity < request.similarity_threshold:
            continue
        
        results.append((chunk, document_title, similarity))
    
    # 按相似度排序并限制结果数量
    results.sort(key=lambda x: x[2], reverse=True)
    results = results[:request.limit]
    
    # 构建响应
    search_results = []
    for chunk, document_title, similarity in results:
        search_results.append(
            VectorSearchResult(
                chunk_id=str(chunk.id),
                document_id=str(chunk.document_id),
                document_title=document_title,
                content=chunk.content,
                chunk_index=chunk.chunk_index,
                metadata=chunk.metadata or {},
                similarity=similarity,
                score=similarity
            )
        )
    
    return VectorSearchResponse(
        results=search_results,
        query=request.query,
        total=len(search_results)
    ) 