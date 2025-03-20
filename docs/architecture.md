# 系统架构

本文档描述了WeKnoledge系统的整体架构设计。

## 架构概览

WeKnoledge采用了现代的微服务架构，主要由以下几个部分组成：

![架构图](./images/architecture.png)

### 主要组件

1. **前端应用** - 基于Next.js的现代React应用
2. **后端API服务** - 基于FastAPI构建的RESTful API
3. **数据库** - PostgreSQL与pgvector扩展
4. **向量存储** - 使用pgvector在PostgreSQL中实现
5. **文件存储** - 用于存储上传的文档

## 技术栈

### 前端
- **Next.js** - React框架，用于服务端渲染和静态网站生成
- **TypeScript** - 类型安全的JavaScript超集
- **Ant Design** - UI组件库
- **TailwindCSS** - 实用工具优先的CSS框架
- **SWR** - 用于数据获取的React Hooks库

### 后端
- **FastAPI** - 高性能的Python API框架
- **SQLAlchemy** - ORM (对象关系映射)工具
- **Alembic** - 数据库迁移工具
- **Pydantic** - 数据验证和设置管理
- **LangChain** - 大语言模型（LLM）应用程序框架
- **Celery** - 分布式任务队列

### 数据库
- **PostgreSQL** - 主要关系型数据库
- **pgvector** - PostgreSQL扩展，用于向量搜索

### 部署
- **Docker** - 容器化
- **Docker Compose** - 本地开发和简单部署
- **NGINX** - Web服务器和反向代理
- **GitHub Actions** - CI/CD管道

## 数据流

WeKnoledge系统中的典型数据流如下：

1. **文档上传与处理**:
   - 用户通过前端上传文档
   - 后端接收并验证文档
   - 文档被分块并通过OpenAI API转换为向量嵌入
   - 文档块和向量存储在数据库中

2. **知识库查询**:
   - 用户提交查询
   - 查询转换为向量嵌入
   - 系统执行向量相似性搜索找到相关文档块
   - 相关文档与原始查询一起发送到LLM进行上下文增强回答生成
   - 回答返回给用户

## 服务间通信

服务间通信主要通过以下方式实现：

- **REST API** - 前端与后端之间的主要通信方式
- **WebSockets** - 用于实时功能，如聊天和通知
- **Message Queue** - 使用Redis和Celery处理异步任务

## 安全性设计

系统的安全性考虑包括：

- JWT基础的身份验证和授权
- HTTPS加密所有通信
- 敏感数据加密存储
- 输入验证和参数化查询防止注入攻击
- CORS策略限制资源访问
- 速率限制防止滥用

## 可扩展性考虑

系统设计考虑了以下可扩展性方面：

- 无状态API设计允许水平扩展
- 数据库读写分离
- 按需扩展的容器化服务
- 缓存策略优化性能
- 异步任务处理长时间运行的操作

## 监控与日志

系统包含以下监控和日志记录功能：

- 结构化日志记录
- 性能指标收集
- 错误跟踪和警报
- 用户活动审计
- 系统健康状态检查 