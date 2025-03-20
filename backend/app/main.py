from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router

# 创建应用
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
)

# 设置CORS中间件
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_origin_regex="https?://.*",  # 允许所有域名在开发环境下
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,  # 预检请求缓存时间（秒）
    )

# 包含路由
app.include_router(api_router, prefix=f"{settings.API_PREFIX}{settings.API_V1_STR}")

@app.get("/")
def root():
    return {"message": "欢迎使用WeKnowledge API"}

@app.get("/health")
def health_check():
    return {"status": "ok"} 