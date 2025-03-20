import os
from typing import Optional
from openai import AsyncOpenAI
import logging

logger = logging.getLogger(__name__)

_client_instance = None

def get_openai_client() -> AsyncOpenAI:
    """
    获取OpenAI客户端实例（单例模式）
    
    Returns:
        AsyncOpenAI客户端实例
    """
    global _client_instance
    
    if _client_instance is None:
        api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key:
            logger.warning("OPENAI_API_KEY环境变量未设置，某些功能可能无法正常工作")
            api_key = "dummy_key"  # 为了避免创建客户端时报错
        
        _client_instance = AsyncOpenAI(
            api_key=api_key,
            timeout=60.0  # 设置较长的超时时间
        )
    
    return _client_instance

def reset_openai_client() -> None:
    """
    重置OpenAI客户端实例
    用于在API密钥更改后刷新客户端
    """
    global _client_instance
    _client_instance = None 