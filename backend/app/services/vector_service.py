import numpy as np
from typing import List, Optional, Union, Dict, Any
from pgvector.sqlalchemy import Vector
import logging
import requests
import os

logger = logging.getLogger(__name__)

# 暂时使用随机向量，未来可以集成实际的嵌入模型
def generate_random_embedding(
    text: str, 
    embedding_dim: int = 1536, 
    seed: Optional[int] = None
) -> List[float]:
    """
    生成随机向量作为嵌入表示
    这是一个临时实现，实际应用中应该使用适当的嵌入模型
    
    Args:
        text: 需要生成嵌入的文本
        embedding_dim: 嵌入向量的维度
        seed: 随机数种子
    
    Returns:
        float类型列表表示的嵌入向量
    """
    if seed is not None:
        np.random.seed(seed)
    
    # 基于文本长度、内容生成简单的随机向量
    # 这不是真正的嵌入，只是为了演示目的
    random_vector = np.random.randn(embedding_dim).astype(np.float32)
    
    # 归一化向量
    norm = np.linalg.norm(random_vector)
    if norm > 0:
        random_vector = random_vector / norm
    
    return random_vector.tolist()

def get_openai_embedding(text: str, model: str = "text-embedding-3-small") -> List[float]:
    """
    使用OpenAI API获取文本的嵌入向量
    
    Args:
        text: 需要嵌入的文本
        model: 使用的嵌入模型名称
        
    Returns:
        嵌入向量
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OpenAI API密钥未设置，使用随机向量代替")
            return generate_random_embedding(text)
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # 准备请求数据
        payload = {
            "model": model,
            "input": text,
            "encoding_format": "float"
        }
        
        # 调用OpenAI API
        response = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            result = response.json()
            # 返回嵌入向量
            return result["data"][0]["embedding"]
        else:
            logger.error(f"OpenAI API调用失败: {response.status_code} - {response.text}")
            # 调用失败时返回随机向量
            return generate_random_embedding(text)
            
    except Exception as e:
        logger.exception(f"获取OpenAI嵌入时出错: {str(e)}")
        # 出错时返回随机向量
        return generate_random_embedding(text)

def get_embedding(text: str, model: str = "text-embedding-3-small") -> List[float]:
    """
    获取文本的嵌入表示
    
    Args:
        text: 需要嵌入的文本
        model: 使用的嵌入模型名称
        
    Returns:
        嵌入向量
    """
    try:
        # 如果文本太长，截断处理
        if len(text) > 8000:
            text = text[:8000]
            
        # 优先使用OpenAI嵌入
        use_openai = os.getenv("USE_OPENAI_EMBEDDINGS", "true").lower() == "true"
        if use_openai:
            return get_openai_embedding(text, model)
        else:
            # 使用随机向量作为后备或测试
            return generate_random_embedding(text)
    except Exception as e:
        logger.error(f"生成嵌入向量失败: {str(e)}")
        # 返回零向量作为后备
        return [0.0] * 1536

def get_sqlalchemy_vector(embedding: Union[List[float], np.ndarray]) -> Vector:
    """
    将嵌入向量转换为SQLAlchemy的Vector类型
    
    Args:
        embedding: 嵌入向量，可以是列表或NumPy数组
    
    Returns:
        SQLAlchemy Vector对象
    """
    if isinstance(embedding, np.ndarray):
        embedding = embedding.tolist()
    return Vector(embedding)

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    计算两个向量之间的余弦相似度
    
    Args:
        vec1: 第一个向量
        vec2: 第二个向量
    
    Returns:
        余弦相似度，范围在[-1, 1]之间
    """
    np1 = np.array(vec1)
    np2 = np.array(vec2)
    
    dot_product = np.dot(np1, np2)
    norm1 = np.linalg.norm(np1)
    norm2 = np.linalg.norm(np2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return dot_product / (norm1 * norm2)

def generate_summary(text: str, max_length: int = 300) -> str:
    """
    为文本内容生成摘要
    
    Args:
        text: 要生成摘要的原始文本
        max_length: 摘要的最大长度
    
    Returns:
        生成的摘要文本
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return text[:max_length] + "..."
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # 如果文本太长，截断处理
        if len(text) > 8000:
            text = text[:8000]
            
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "你是一个专业的文档摘要工具，请为用户提供的文本生成简洁、全面的摘要。"
                },
                {
                    "role": "user",
                    "content": f"请为以下文本生成不超过{max_length}字的摘要：\n\n{text}"
                }
            ],
            "max_tokens": 500
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"].strip()
        else:
            # 如果API调用失败，返回截断的原文
            return text[:max_length] + "..."
            
    except Exception as e:
        print(f"生成摘要时出错: {e}")
        # 出错时返回截断的原文
        return text[:max_length] + "..." 

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    将长文本分割成更小的块
    
    Args:
        text: 要分割的文本
        chunk_size: 每个块的最大字符数
        overlap: 块之间的重叠字符数
    
    Returns:
        文本块列表
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        # 确定块的结束位置
        end = start + chunk_size
        
        # 如果不是最后一个块，尝试在句子边界处分割
        if end < len(text):
            # 寻找最近的句子结束标记
            sentence_end = -1
            for punct in ['. ', '! ', '? ', '\n\n']:
                last_punct = text[start:end].rfind(punct)
                if last_punct != -1 and (sentence_end == -1 or last_punct > sentence_end):
                    sentence_end = last_punct + len(punct) - 1
            
            if sentence_end != -1:
                end = start + sentence_end + 1
        
        # 确保不超过文本长度
        end = min(end, len(text))
        
        # 添加块到结果中
        chunks.append(text[start:end])
        
        # 下一个起始位置
        start = end - overlap
        if start < 0 or start >= len(text):
            break
    
    return chunks

def create_document_chunks(
    document_content: str, 
    document_id: str,
    chunk_size: int = 1000,
    overlap: int = 200,
    metadata: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    将文档内容分割成块并生成元数据
    
    Args:
        document_content: 文档内容
        document_id: 文档ID
        chunk_size: 每个块的最大字符数
        overlap: 块之间的重叠字符数
        metadata: 文档元数据
    
    Returns:
        包含块内容和元数据的字典列表
    """
    chunks = chunk_text(document_content, chunk_size, overlap)
    result = []
    
    for i, chunk_content in enumerate(chunks):
        # 生成块的元数据
        chunk_metadata = metadata.copy() if metadata else {}
        chunk_metadata.update({
            "chunk_index": i,
            "total_chunks": len(chunks)
        })
        
        # 为每个块生成嵌入
        embedding = get_embedding(chunk_content)
        
        result.append({
            "document_id": document_id,
            "content": chunk_content,
            "chunk_index": i,
            "metadata": chunk_metadata,
            "embedding": embedding,
            "has_embedding": True
        })
    
    return result 

class VectorService:
    """向量服务类，提供向量搜索和嵌入的功能接口"""
    
    def __init__(self):
        """初始化向量服务"""
        self.embedding_dim = 1536
        self.embedding_model = "text-embedding-3-small"
        
    async def get_embedding(self, text: str, model: Optional[str] = None) -> List[float]:
        """
        获取文本的嵌入向量
        
        Args:
            text: 需要嵌入的文本
            model: 使用的嵌入模型名称
            
        Returns:
            嵌入向量
        """
        if model is None:
            model = self.embedding_model
        return get_embedding(text, model)
    
    async def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        使用向量搜索相关内容
        
        Args:
            query: 搜索查询文本
            limit: 返回结果数量限制
            
        Returns:
            搜索结果列表
        """
        # 这里实现简单的模拟搜索结果
        # 实际应用中应该连接到向量数据库执行搜索
        query_embedding = get_embedding(query)
        
        # 模拟结果，实际实现中应该查询真实的数据库
        results = []
        for i in range(min(3, limit)):
            results.append({
                "content": f"与查询'{query}'相关的知识点 {i+1}",
                "metadata": {"source": f"模拟来源 {i+1}"},
                "score": 0.9 - (i * 0.1)  # 模拟相似度分数
            })
        
        return results
    
    async def compute_similarity(self, text1: str, text2: str) -> float:
        """
        计算两段文本的相似度
        
        Args:
            text1: 第一段文本
            text2: 第二段文本
            
        Returns:
            相似度分数 (0-1)
        """
        embedding1 = get_embedding(text1)
        embedding2 = get_embedding(text2)
        return cosine_similarity(embedding1, embedding2) 