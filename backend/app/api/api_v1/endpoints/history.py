from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from uuid import UUID
from datetime import datetime, timedelta
import json
from io import StringIO
import csv

from app.api import deps
from app.models.user import User
from app.models.chat import ChatHistory
from app.schemas.history import HistoryItem, HistoryResponse, HistoryExport
from app.services.qa_service import get_user_chat_histories, delete_chat_history

router = APIRouter()

@router.get("/", response_model=HistoryResponse)
def read_history(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    history_type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    获取历史提问记录
    
    Args:
        skip: 跳过的记录数
        limit: 返回的最大记录数
        search: 搜索关键词
        history_type: 历史类型 (全局提问|文档解读|智能写作)
        status: 状态 (已回答|未回答)
        start_date: 开始日期 (YYYY-MM-DD)
        end_date: 结束日期 (YYYY-MM-DD)
    """
    # 基础查询
    query = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id)
    
    # 应用过滤条件
    if search:
        # 在title和消息内容中搜索
        query = query.filter(
            or_(
                ChatHistory.title.ilike(f"%{search}%"),
                # 如果messages是JSON字段，需要根据数据库类型使用不同方法
                # 这里假设是PostgreSQL
                func.json_contains(
                    func.lower(func.json_extract(ChatHistory.messages, "$[*].content")),
                    func.lower(f'"%{search}%"')
                )
            )
        )
    
    # 按类型过滤 (这里需要根据你的数据模型调整)
    if history_type:
        # 假设我们在messages中的第一条消息内容或title中判断类型
        if history_type == "全局提问":
            query = query.filter(ChatHistory.title.like("%全局%"))
        elif history_type == "文档解读":
            query = query.filter(ChatHistory.title.like("%文档%"))
        elif history_type == "智能写作":
            query = query.filter(ChatHistory.title.like("%写作%"))
    
    # 按状态过滤 (这里需要根据你的数据模型调整)
    if status:
        # 假设一个聊天历史中至少有一条assistant消息就认为是已回答
        if status == "已回答":
            # 检查是否包含assistant消息
            query = query.filter(func.json_contains(
                ChatHistory.messages, '"role":"assistant"'
            ))
        elif status == "未回答":
            # 不包含assistant消息
            query = query.filter(~func.json_contains(
                ChatHistory.messages, '"role":"assistant"'
            ))
    
    # 按日期范围过滤
    if start_date:
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(ChatHistory.created_at >= start_datetime)
    
    if end_date:
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        query = query.filter(ChatHistory.created_at < end_datetime)
    
    # 计算总记录数
    total = query.count()
    
    # 排序并分页
    histories = query.order_by(ChatHistory.updated_at.desc()).offset(skip).limit(limit).all()
    
    # 转换为响应格式
    result = []
    for history in histories:
        # 获取第一条用户消息作为问题
        question = "未找到问题"
        if history.messages and len(history.messages) > 0:
            for msg in history.messages:
                if msg.get("role") == "user":
                    question = msg.get("content", "未找到问题")
                    break
        
        # 判断历史类型 (简化逻辑，实际应根据需求调整)
        history_type = "全局提问"  # 默认
        if "文档" in history.title.lower():
            history_type = "文档解读"
        elif "写作" in history.title.lower():
            history_type = "智能写作"
        
        # 判断是否已回答
        has_answer = False
        for msg in history.messages:
            if msg.get("role") == "assistant":
                has_answer = True
                break
        
        result.append(
            HistoryItem(
                id=str(history.id),
                question=question,
                time=history.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                type=history_type,
                status="已回答" if has_answer else "未回答",
            )
        )
    
    return HistoryResponse(
        items=result,
        total=total,
        page=skip // limit + 1,
        page_size=limit
    )

@router.delete("/{history_id}")
def delete_history(
    history_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    删除历史提问记录
    """
    # 获取历史记录
    history = db.query(ChatHistory).filter(ChatHistory.id == history_id).first()
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="历史记录不存在"
        )
    
    # 检查权限
    if history.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="没有足够的权限"
        )
    
    # 删除历史记录
    delete_chat_history(db=db, history_id=history_id)
    
    return {"status": "success"}

@router.delete("/")
def batch_delete_history(
    history_ids: List[UUID],
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    批量删除历史提问记录
    """
    success_count = 0
    for history_id in history_ids:
        history = db.query(ChatHistory).filter(ChatHistory.id == history_id).first()
        if history and (history.user_id == current_user.id or current_user.is_superuser):
            delete_chat_history(db=db, history_id=history_id)
            success_count += 1
    
    return {"status": "success", "deleted_count": success_count}

@router.get("/export", response_model=HistoryExport)
def export_history(
    db: Session = Depends(deps.get_db),
    history_type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
    format: str = Query("json", regex="^(json|csv)$"),  # 只允许json或csv
) -> Any:
    """
    导出历史提问记录
    """
    # 获取用户所有聊天历史
    histories = get_user_chat_histories(db=db, user_id=current_user.id, skip=0, limit=1000)
    
    # 应用过滤条件
    filtered_histories = []
    for history in histories:
        # 按类型过滤
        if history_type:
            if history_type == "全局提问" and "全局" not in history.title.lower():
                continue
            if history_type == "文档解读" and "文档" not in history.title.lower():
                continue
            if history_type == "智能写作" and "写作" not in history.title.lower():
                continue
        
        # 按状态过滤
        has_answer = False
        for msg in history.messages:
            if msg.get("role") == "assistant":
                has_answer = True
                break
        
        if status == "已回答" and not has_answer:
            continue
        if status == "未回答" and has_answer:
            continue
        
        # 按日期范围过滤
        if start_date:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
            if history.created_at < start_datetime:
                continue
        
        if end_date:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            if history.created_at >= end_datetime:
                continue
        
        filtered_histories.append(history)
    
    # 转换为导出格式
    export_data = []
    for history in filtered_histories:
        # 获取第一条用户消息作为问题
        question = "未找到问题"
        for msg in history.messages:
            if msg.get("role") == "user":
                question = msg.get("content", "未找到问题")
                break
        
        # 获取第一条assistant消息作为回答
        answer = "未回答"
        for msg in history.messages:
            if msg.get("role") == "assistant":
                answer = msg.get("content", "未回答")
                break
        
        # 判断历史类型
        history_type = "全局提问"  # 默认
        if "文档" in history.title.lower():
            history_type = "文档解读"
        elif "写作" in history.title.lower():
            history_type = "智能写作"
        
        export_data.append({
            "id": str(history.id),
            "question": question,
            "answer": answer,
            "time": history.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "type": history_type,
            "status": "已回答" if has_answer else "未回答",
        })
    
    # 返回结果
    if format == "json":
        return HistoryExport(
            data=json.dumps(export_data, ensure_ascii=False),
            filename=f"history_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            format="json"
        )
    elif format == "csv":
        # 创建CSV字符串
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=["id", "question", "answer", "time", "type", "status"])
        writer.writeheader()
        writer.writerows(export_data)
        
        return HistoryExport(
            data=output.getvalue(),
            filename=f"history_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            format="csv"
        ) 