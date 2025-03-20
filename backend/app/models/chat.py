from sqlalchemy import Boolean, Column, String, Text, DateTime, ForeignKey, Table, func, JSON
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID, ARRAY
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.session import Base
from app.schemas.qa import ChatMessage

class ChatHistory(Base):
    """聊天历史模型"""
    __tablename__ = "chat_histories"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    messages = Column(JSON, nullable=False, default=[])
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    user = relationship("User", backref="chat_histories")

    def __repr__(self):
        return f"<ChatHistory {self.id}>" 