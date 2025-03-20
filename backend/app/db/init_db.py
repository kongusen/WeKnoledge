import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.security import get_password_hash
from app.models import User, KnowledgeItem
from app.db.session import Base, engine

# 初始化日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化数据库
def init_db(db: Session) -> None:
    # 创建pgvector扩展
    db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    
    # 创建超级用户
    user = db.query(User).filter(User.email == "admin@weknowledge.com").first()
    if not user:
        logger.info("创建超级用户")
        user = User(
            email="admin@weknowledge.com",
            username="admin",
            full_name="系统管理员",
            hashed_password=get_password_hash("admin123"),
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # 添加示例知识条目
    knowledge_count = db.query(KnowledgeItem).count()
    if knowledge_count == 0:
        logger.info("创建示例知识条目")
        sample_knowledge = KnowledgeItem(
            title="欢迎使用WeKnowledge",
            content="这是一个企业知识库系统，您可以在这里存储和管理您的知识。",
            tags=["欢迎", "介绍"],
            type="organization",
            author_id=user.id,
            is_public=True
        )
        db.add(sample_knowledge)
        db.commit()
    
    logger.info("数据库初始化完成")

# 创建表
def create_tables():
    logger.info("创建数据库表")
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    logger.info("创建初始数据")
    from app.db.session import SessionLocal
    db = SessionLocal()
    create_tables()
    init_db(db) 