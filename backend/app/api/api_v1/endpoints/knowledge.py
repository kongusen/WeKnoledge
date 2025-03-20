from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api import deps
from app.models.knowledge import KnowledgeItem
from app.models.user import User
from app.schemas.knowledge import KnowledgeItem as KnowledgeItemSchema
from app.schemas.knowledge import KnowledgeItemCreate, KnowledgeItemUpdate, KnowledgeSearchResult
from app.services import knowledge_service

router = APIRouter()

@router.get("/", response_model=List[KnowledgeItemSchema])
def read_knowledge_items(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    type: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取知识条目列表
    """
    # 基础查询
    query = db.query(KnowledgeItem)
    
    # 根据类型过滤
    if type:
        query = query.filter(KnowledgeItem.type == type)
    
    # 根据标签过滤
    if tag:
        query = query.filter(KnowledgeItem.tags.any(tag))
    
    # 非管理员只能查看自己的个人知识条目或公开的组织知识条目
    if not current_user.is_superuser:
        query = query.filter(
            (KnowledgeItem.author_id == current_user.id) | 
            ((KnowledgeItem.type == "organization") & (KnowledgeItem.is_public == True))
        )
    
    # 分页
    items = query.offset(skip).limit(limit).all()
    return items

@router.post("/", response_model=KnowledgeItemSchema)
def create_knowledge_item(
    *,
    db: Session = Depends(deps.get_db),
    item_in: KnowledgeItemCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    创建新的知识条目
    """
    # 如果是组织知识条目，验证权限
    if item_in.type == "organization" and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限创建组织知识条目"
        )
    
    # 使用服务创建知识条目
    item = knowledge_service.create_knowledge_item(
        db=db,
        item_in=item_in,
        author_id=current_user.id
    )
    
    return item

@router.get("/{item_id}", response_model=KnowledgeItemSchema)
def read_knowledge_item(
    *,
    db: Session = Depends(deps.get_db),
    item_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取单个知识条目详情
    """
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="知识条目不存在"
        )
    
    # 检查权限
    if (
        item.author_id != current_user.id
        and not current_user.is_superuser
        and not (item.type == "organization" and item.is_public)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    # 增加浏览次数
    item.views += 1
    db.add(item)
    db.commit()
    
    return item

@router.put("/{item_id}", response_model=KnowledgeItemSchema)
def update_knowledge_item(
    *,
    db: Session = Depends(deps.get_db),
    item_id: str,
    item_in: KnowledgeItemUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    更新知识条目
    """
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="知识条目不存在"
        )
    
    # 检查权限（仅作者和管理员可以编辑）
    if item.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    # 使用服务更新知识条目
    updated_item = knowledge_service.update_knowledge_item(
        db=db,
        db_item=item,
        item_in=item_in
    )
    
    return updated_item

@router.delete("/{item_id}", response_model=dict)
def delete_knowledge_item(
    *,
    db: Session = Depends(deps.get_db),
    item_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    删除知识条目
    """
    item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="知识条目不存在"
        )
    
    # 检查权限（仅作者和管理员可以删除）
    if item.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    db.delete(item)
    db.commit()
    return {"message": "知识条目已删除"}

@router.get("/search/text", response_model=List[KnowledgeItemSchema])
def search_knowledge_items(
    *,
    db: Session = Depends(deps.get_db),
    q: str = Query(..., min_length=1),
    type: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    基于文本搜索知识条目
    """
    # 基础查询
    query = db.query(KnowledgeItem)
    
    # 根据类型过滤
    if type:
        query = query.filter(KnowledgeItem.type == type)
    
    # 非管理员只能查看自己的个人知识条目或公开的组织知识条目
    if not current_user.is_superuser:
        query = query.filter(
            (KnowledgeItem.author_id == current_user.id) | 
            ((KnowledgeItem.type == "organization") & (KnowledgeItem.is_public == True))
        )
    
    # 文本搜索
    query = query.filter(
        (func.lower(KnowledgeItem.title).contains(q.lower())) |
        (func.lower(KnowledgeItem.content).contains(q.lower()))
    )
    
    items = query.limit(20).all()
    return items

@router.get("/search/vector", response_model=List[KnowledgeSearchResult])
def vector_search_knowledge_items(
    *,
    db: Session = Depends(deps.get_db),
    q: str = Query(..., min_length=1),
    type: Optional[str] = None,
    limit: int = 10,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    基于向量相似度搜索知识条目
    """
    # 使用向量搜索服务
    search_results = knowledge_service.search_by_vector(
        db=db,
        query_text=q,
        user=current_user,
        limit=limit,
        type=type
    )
    
    # 构建结果
    return [
        KnowledgeSearchResult(
            item=item,
            score=score,
            similarity=score
        )
        for item, score in search_results
    ] 