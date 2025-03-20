from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, knowledge, history, writing, vector_search, document, knowledge_base, qa, chat

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["知识库"])
api_router.include_router(history.router, prefix="/history", tags=["历史记录"])
api_router.include_router(writing.router, prefix="/writing", tags=["智能写作"])
api_router.include_router(vector_search.router, prefix="/vector", tags=["向量搜索"])
api_router.include_router(document.router, prefix="/document", tags=["文档管理"])
api_router.include_router(knowledge_base.router, prefix="/knowledge-base", tags=["知识库管理"])
api_router.include_router(qa.router, prefix="/qa", tags=["问答系统"])
api_router.include_router(chat.router, prefix="/chat", tags=["聊天系统"]) 