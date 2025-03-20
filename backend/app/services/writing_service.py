from typing import List, Dict, Any, Optional
import logging
import asyncio
import json
from datetime import datetime
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.config import settings
from app.schemas.writing import WritingStyle, WritingType, ContentResponse, TextImprovementResponse, WritingDocumentCreate, WritingDocumentUpdate, AIAssistRequest, AIAssistResponse
from app.services.vector_service import VectorService
from app.utils.openai_client import get_openai_client
from app.models.writing import WritingDocument
from app.models.user import User

logger = logging.getLogger(__name__)

# 预定义写作风格
DEFAULT_WRITING_STYLES = [
    WritingStyle(id="formal", name="正式", description="正式、专业的写作风格"),
    WritingStyle(id="casual", name="轻松", description="轻松、友好的写作风格"),
    WritingStyle(id="technical", name="技术", description="技术文档风格"),
    WritingStyle(id="creative", name="创意", description="富有创意的写作风格"),
    WritingStyle(id="academic", name="学术", description="学术论文风格"),
    WritingStyle(id="business", name="商务", description="商务沟通风格"),
    WritingStyle(id="narrative", name="叙事", description="故事叙述风格"),
]

# 预定义写作类型
DEFAULT_WRITING_TYPES = [
    WritingType(id="article", name="文章", description="通用文章写作"),
    WritingType(id="report", name="报告", description="工作报告或分析报告"),
    WritingType(id="email", name="邮件", description="商务邮件或通知"),
    WritingType(id="summary", name="总结", description="内容总结或摘要"),
    WritingType(id="proposal", name="提案", description="项目或商业提案"),
    WritingType(id="format", name="格式仿写", description="按照参考文档格式创作"),
    WritingType(id="document", name="公文", description="规范的公文写作"),
]


class Agent:
    """智能体基类"""
    def __init__(self, role: str, goal: str):
        self.role = role
        self.goal = goal
        self.client = get_openai_client()
        self.messages = []
        
    async def think(self, input_data: Dict[str, Any]) -> str:
        """思考并返回结果"""
        raise NotImplementedError("子类必须实现think方法")
    
    def _build_system_message(self) -> Dict[str, str]:
        """构建系统消息"""
        return {
            "role": "system", 
            "content": f"你是一个{self.role}。你的目标是{self.goal}。"
        }


class PlannerAgent(Agent):
    """规划智能体"""
    def __init__(self):
        super().__init__(
            role="写作规划智能体",
            goal="分析用户需求，制定写作计划和大纲"
        )
    
    async def think(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """思考写作计划"""
        self.messages = [self._build_system_message()]
        
        topic = input_data.get("topic", "")
        writing_type = input_data.get("writing_type", "")
        style = input_data.get("style", "")
        keywords = input_data.get("keywords", [])
        
        instruction = f"""
        请为以下写作任务制定详细计划和大纲：
        
        主题：{topic}
        类型：{writing_type}
        风格：{style}
        关键词：{', '.join(keywords) if keywords else '无'}
        
        返回JSON格式，包含以下字段：
        1. plan: 写作计划步骤数组
        2. outline: 详细大纲数组
        3. focus_points: 需要重点关注的内容数组
        4. expected_sections: 需要包含的章节数组
        """
        
        self.messages.append({"role": "user", "content": instruction})
        
        response = await self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=self.messages,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        result = response.choices[0].message.content
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            logger.error(f"无法解析JSON响应: {result}")
            return {
                "plan": ["分析主题", "收集资料", "撰写内容"],
                "outline": ["引言", "主体", "结论"],
                "focus_points": ["主题相关重点"],
                "expected_sections": ["第一部分", "第二部分", "总结"]
            }


class ReferenceAnalyzerAgent(Agent):
    """参考资料分析智能体"""
    def __init__(self):
        super().__init__(
            role="参考资料分析智能体",
            goal="分析参考文档，提取有用信息和格式特点"
        )
    
    async def think(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """分析参考资料"""
        self.messages = [self._build_system_message()]
        
        reference_text = input_data.get("reference_text", "")
        if not reference_text:
            return {
                "has_reference": False,
                "format_features": [],
                "key_points": [],
                "structure": {}
            }
        
        instruction = f"""
        请分析以下参考文档，提取其格式特点、结构和关键信息：
        
        ```
        {reference_text[:8000]}  # 限制长度避免token过多
        ```
        
        返回JSON格式，包含以下字段：
        1. has_reference: 布尔值，表示是否有参考资料
        2. format_features: 文档格式特点数组
        3. key_points: 文档中的关键点数组
        4. structure: 文档结构对象，包含标题、段落、列表等信息
        """
        
        self.messages.append({"role": "user", "content": instruction})
        
        response = await self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=self.messages,
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        
        result = response.choices[0].message.content
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            logger.error(f"无法解析JSON响应: {result}")
            return {
                "has_reference": True,
                "format_features": ["段落结构", "标题格式"],
                "key_points": ["文档包含的主要内容"],
                "structure": {"sections": [], "style": "未检测到特定结构"}
            }


class KnowledgeAgent(Agent):
    """知识库查询智能体"""
    def __init__(self, vector_service: VectorService):
        super().__init__(
            role="知识库查询智能体",
            goal="从知识库中查找相关信息，丰富写作内容"
        )
        self.vector_service = vector_service
    
    async def think(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """从知识库查询相关信息"""
        topic = input_data.get("topic", "")
        keywords = input_data.get("keywords", [])
        
        search_query = topic
        if keywords:
            search_query += " " + " ".join(keywords)
        
        try:
            # 从知识库搜索相关内容
            search_results = await self.vector_service.search(
                query=search_query,
                limit=5
            )
            
            related_documents = []
            for result in search_results:
                related_documents.append({
                    "content": result.get("content", ""),
                    "metadata": result.get("metadata", {}),
                    "score": result.get("score", 0)
                })
            
            return {
                "has_knowledge": len(related_documents) > 0,
                "related_documents": related_documents,
                "summary": self._generate_summary(related_documents) if related_documents else ""
            }
        except Exception as e:
            logger.error(f"知识库查询错误: {str(e)}")
            return {
                "has_knowledge": False,
                "related_documents": [],
                "summary": ""
            }
    
    def _generate_summary(self, documents: List[Dict[str, Any]]) -> str:
        """生成知识库文档摘要"""
        # 简单摘要实现，实际项目中可以使用更复杂的方法
        if not documents:
            return ""
            
        summary = "相关知识点摘要:\n"
        for i, doc in enumerate(documents[:3], 1):  # 仅使用前3个结果
            content = doc.get("content", "")
            if content:
                summary += f"{i}. {content[:200]}...\n"
                
        return summary


class WriterAgent(Agent):
    """写作智能体"""
    def __init__(self):
        super().__init__(
            role="写作智能体",
            goal="根据计划、参考和知识生成高质量内容"
        )
    
    async def think(self, input_data: Dict[str, Any]) -> str:
        """生成写作内容"""
        self.messages = [self._build_system_message()]
        
        topic = input_data.get("topic", "")
        writing_type = input_data.get("writing_type", "")
        style = input_data.get("style", "")
        keywords = input_data.get("keywords", [])
        output_format = input_data.get("output_format", "markdown")
        
        plan = input_data.get("plan", {})
        reference_analysis = input_data.get("reference_analysis", {})
        knowledge = input_data.get("knowledge", {})
        
        # 风格指南
        style_guides = {
            "formal": "使用正式、专业的语言，避免口语表达，使用完整句子和段落，保持客观和权威",
            "casual": "使用轻松友好的语气，可以使用日常用语，句子可以更短，风格更加亲切和随意",
            "technical": "使用专业术语和准确的描述，结构清晰，重点在于信息的准确性和完整性",
            "creative": "使用富有创意的表达，可以运用修辞手法，语言生动有趣，富有感染力",
            "academic": "使用学术性语言，引用相关研究，结构严谨，论证充分，使用专业术语",
            "business": "使用简洁明了的商务语言，重点突出，信息密度高，目标导向的表达",
            "narrative": "使用叙事手法，有故事情节，可以包含人物、场景描述，注重情感表达"
        }
        
        # 类型指南
        type_guides = {
            "article": "撰写包含引言、主体和结论的完整文章，内容充实，结构清晰",
            "report": "创建结构化报告，包含摘要、发现、分析和建议等部分，数据支持论点",
            "email": "编写专业邮件，包含问候、主题、正文和结束语，内容简洁明了",
            "summary": "提供简洁的内容摘要，突出关键点，去除不必要细节，保持清晰简洁",
            "proposal": "创建具有说服力的提案，包含背景、目标、方法、预期结果和时间表",
            "format": "按照参考文档的格式和结构特点进行创作，保持一致的风格和排版",
            "document": "创建符合公文写作规范的文档，包含标题、正文、落款等标准部分"
        }
        
        # 组装系统提示
        system_prompt = f"""你是一个专业写作智能体，需要根据以下内容创建{style_guides.get(style, "")}风格的{type_guides.get(writing_type, "")}:

主题: {topic}
关键词: {', '.join(keywords) if keywords else '无'}
输出格式: {"Markdown格式（使用标准Markdown语法）" if output_format == "markdown" else "纯文本格式"}

写作计划:
{json.dumps(plan, ensure_ascii=False, indent=2)}

参考资料分析:
{json.dumps(reference_analysis, ensure_ascii=False, indent=2)}

知识库相关信息:
{json.dumps(knowledge, ensure_ascii=False, indent=2)}

请生成高质量、结构清晰、内容丰富的完整内容。"""

        self.messages[0]["content"] = system_prompt
        
        user_prompt = f"请根据以上信息，为主题「{topic}」撰写一篇{style}风格的{writing_type}。"
        self.messages.append({"role": "user", "content": user_prompt})
        
        response = await self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=self.messages,
            temperature=0.7
        )
        
        return response.choices[0].message.content


class WritingService:
    """智能写作服务"""
    def __init__(self, vector_service: VectorService = None):
        self.vector_service = vector_service
        
    async def get_writing_styles(self) -> List[WritingStyle]:
        """获取写作风格列表"""
        return DEFAULT_WRITING_STYLES
        
    async def get_writing_types(self) -> List[WritingType]:
        """获取写作类型列表"""
        return DEFAULT_WRITING_TYPES
    
    async def generate_content(self, params: Dict[str, Any]) -> ContentResponse:
        """生成内容"""
        # 1. 初始化各个智能体
        planner = PlannerAgent()
        reference_analyzer = ReferenceAnalyzerAgent()
        knowledge_agent = KnowledgeAgent(self.vector_service)
        writer = WriterAgent()
        
        # 2. 并行执行计划和参考分析任务
        tasks = [
            planner.think(params),
            reference_analyzer.think(params)
        ]
        
        # 如果提供了向量服务，则添加知识库查询任务
        if self.vector_service:
            tasks.append(knowledge_agent.think(params))
        
        # 3. 等待所有任务完成
        results = await asyncio.gather(*tasks)
        
        # 4. 整合结果
        plan_result = results[0]
        reference_result = results[1]
        knowledge_result = results[2] if self.vector_service else {"has_knowledge": False, "related_documents": []}
        
        # 5. 构建写作输入数据
        writing_input = {
            **params,
            "plan": plan_result,
            "reference_analysis": reference_result,
            "knowledge": knowledge_result
        }
        
        # 6. 生成内容
        content = await writer.think(writing_input)
        
        # 7. 构建响应
        token_count = len(content) // 3  # 粗略估算token数量
        
        return ContentResponse(
            content=content,
            writing_type=params.get("writing_type", ""),
            style=params.get("style", ""),
            token_count=token_count,
            format=params.get("output_format", "markdown")
        )
    
    async def improve_text(self, params: Dict[str, Any]) -> TextImprovementResponse:
        """改进文本"""
        original_text = params.get("original_text", "")
        improvement_type = params.get("improvement_type", "all")
        tone = params.get("tone")
        output_format = params.get("output_format", "markdown")
        
        # 不同改进类型的提示
        improvement_prompts = {
            "all": "全面改进文本，包括语法、表达、结构和内容",
            "grammar": "修正语法错误，确保语句通顺",
            "clarity": "提高表达清晰度，使内容更容易理解",
            "conciseness": "精简内容，去除冗余表达",
            "creativity": "增加创意性，使表达更加生动有趣"
        }
        
        client = get_openai_client()
        
        system_message = f"""你是一个专业文本改进助手，请根据以下要求改进文本：

改进类型：{improvement_prompts.get(improvement_type, improvement_prompts['all'])}
输出格式：{"Markdown格式" if output_format == "markdown" else "纯文本格式"}
"""

        if tone:
            system_message += f"\n语气调整：调整为{tone}的语气"
            
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": f"请改进以下文本：\n\n{original_text}"}
        ]
        
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7
        )
        
        improved_text = response.choices[0].message.content
        token_count = len(improved_text) // 3  # 粗略估算token数量
        
        return TextImprovementResponse(
            improved_text=improved_text,
            improvement_type=improvement_type,
            token_count=token_count,
            format=output_format
        )
    
    async def ai_writing_assist(self, request: AIAssistRequest) -> AIAssistResponse:
        """
        使用AI辅助写作
        
        Args:
            request: AI辅助写作请求参数
            
        Returns:
            AI辅助写作响应
        """
        try:
            messages = [
                {
                    "role": "system",
                    "content": f"你是一个专业的写作助手，你的任务是按照用户的要求帮助改进、继续或处理文本。请使用{request.writing_style}风格，输出{request.writing_length}长度的内容。"
                }
            ]
            
            content_prompt = ""
            
            if request.prompt_type == "improve" and request.selected_text:
                content_prompt = f"请改进以下文本，保持{request.writing_style}风格:\n\n{request.selected_text}"
            elif request.prompt_type == "continue":
                content_prompt = f"请基于以下内容继续写作，保持{request.writing_style}风格:\n\n{request.content}"
            elif request.prompt_type == "summarize":
                content_prompt = f"请总结以下内容，使用{request.writing_style}风格:\n\n{request.content}"
            elif request.prompt_type == "translate":
                content_prompt = f"请将以下内容翻译成英文，保持原意:\n\n{request.content}"
            elif request.prompt_type == "custom" and request.custom_prompt:
                content_prompt = f"{request.custom_prompt}\n\n{request.content}"
            
            messages.append({"role": "user", "content": content_prompt})
            
            # 调用实际AI服务
            client = get_openai_client()
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=0.7
            )
            
            result = response.choices[0].message.content
            
            # 计算token使用量
            token_count = len(result) // 4  # 简单估算
            
            return AIAssistResponse(
                result=result,
                token_count=token_count
            )
        except Exception as e:
            logger.error(f"AI辅助写作失败: {str(e)}")
            
            # 返回模拟响应
            mock_result = ""
            if request.prompt_type == "improve":
                mock_result = f"这是优化后的{request.writing_style}风格文本：\n\n{request.selected_text}（优化后的内容）"
            elif request.prompt_type == "continue":
                mock_result = "这是AI继续写作的内容...\n\n在实际实现中，这里会是AI生成的后续内容。"
            elif request.prompt_type == "summarize":
                mock_result = "这是对所选内容的总结...\n\n在实际实现中，这里会是AI生成的总结。"
            elif request.prompt_type == "translate":
                mock_result = "This is the translated content...\n\nIn actual implementation, this would be the AI-generated translation."
            else:  # custom
                mock_result = "这是自定义提示的回复...\n\n在实际实现中，这里会是基于您自定义提示的AI生成内容。"
            
            return AIAssistResponse(
                result=mock_result,
                token_count=len(mock_result) // 4
            ) 