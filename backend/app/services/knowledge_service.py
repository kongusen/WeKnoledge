from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from pgvector.sqlalchemy import Vector
from sqlalchemy import Computed

from app.models.knowledge import KnowledgeItem
from app.models.user import User
from app.schemas.knowledge import KnowledgeItemCreate, KnowledgeItemUpdate, KnowledgeSearchResult
from app.services.vector_service import get_embedding, get_sqlalchemy_vector, generate_summary

def create_knowledge_item(
    db: Session, 
    item_in: KnowledgeItemCreate, 
    author_id: UUID
) -> KnowledgeItem:
    """
    创建新的知识条目
    
    Args:
        db: 数据库会话
        item_in: 知识条目创建数据
        author_id: 作者ID
    
    Returns:
        创建的知识条目
    """
    # 生成内容的嵌入向量
    text_for_embedding = f"{item_in.title} {item_in.content}"
    embedding = get_embedding(text_for_embedding)
    
    # 生成摘要
    summary = ""
    if len(item_in.content) > 100:  # 只有内容较长时才生成摘要
        summary = generate_summary(item_in.content)
    
    # 创建知识条目
    db_item = KnowledgeItem(
        **item_in.model_dump(exclude={"metadata"}),
        author_id=author_id,
        views=0,
        likes=0,
        item_metadata=item_in.metadata or {},
        embedding=get_sqlalchemy_vector(embedding),
        summary=summary
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_knowledge_item(
    db: Session, 
    db_item: KnowledgeItem, 
    item_in: KnowledgeItemUpdate
) -> KnowledgeItem:
    """
    更新知识条目
    
    Args:
        db: 数据库会话
        db_item: 要更新的知识条目
        item_in: 更新数据
    
    Returns:
        更新后的知识条目
    """
    # 更新基本属性
    update_data = item_in.model_dump(exclude_unset=True, exclude={"metadata"})
    
    # 处理元数据合并
    if item_in.metadata is not None:
        if db_item.item_metadata is None:
            db_item.item_metadata = {}
        # 更新元数据字典
        db_item.item_metadata.update(item_in.metadata)
    
    # 更新其他字段
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    # 如果内容或标题有更新，重新生成嵌入向量和摘要
    content_updated = "content" in update_data
    if "title" in update_data or content_updated:
        text_for_embedding = f"{db_item.title} {db_item.content}"
        embedding = get_embedding(text_for_embedding)
        db_item.embedding = get_sqlalchemy_vector(embedding)
        
        # 更新摘要
        if content_updated and len(db_item.content) > 100:
            db_item.summary = generate_summary(db_item.content)
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def search_by_vector(
    db: Session,
    query_text: str,
    user: User,
    limit: int = 10,
    type: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> List[Tuple[KnowledgeItem, float]]:
    """
    使用向量搜索知识条目
    
    Args:
        db: 数据库会话
        query_text: 查询文本
        user: 当前用户
        limit: 结果数量限制
        type: 知识条目类型过滤
        tags: 标签过滤
    
    Returns:
        知识条目和相似度分数的元组列表
    """
    # 生成查询文本的向量嵌入
    query_embedding = get_embedding(query_text)
    query_vector = get_sqlalchemy_vector(query_embedding)
    
    # 构建基础查询 - 使用 <-> 运算符计算余弦距离
    query = db.query(
        KnowledgeItem, 
        (KnowledgeItem.embedding.cosine_distance(query_vector)).label('distance')
    )
    
    # 非管理员只能看到自己的个人知识条目或公开的组织知识条目
    if not user.is_superuser:
        query = query.filter(
            or_(
                KnowledgeItem.author_id == user.id,
                (KnowledgeItem.type == "organization") & (KnowledgeItem.is_public == True)
            )
        )
    
    # 根据类型过滤
    if type:
        query = query.filter(KnowledgeItem.type == type)
    
    # 根据标签过滤
    if tags and len(tags) > 0:
        for tag in tags:
            query = query.filter(KnowledgeItem.tags.any(tag))
    
    # 按相似度排序并限制结果数量
    results = query.order_by('distance').limit(limit).all()
    
    # 转换为知识条目和相似度分数的元组列表
    return [(item, 1.0 - float(distance)) for item, distance in results]  # 距离转为相似度 