# WeKnowledge 后端

这个目录包含 WeKnowledge 智能知识管理平台的后端API服务。

## 技术栈

- FastAPI: 现代、高性能的Python Web框架
- SQLAlchemy: Python SQL工具包和ORM
- PostgreSQL: 关系型数据库
- pgvector: 向量扩展，支持向量相似度搜索
- Alembic: 数据库迁移工具
- Pydantic: 数据验证和设置管理
- JWT: JSON Web Token认证

## 功能特性

- 用户认证和授权
- 知识条目的CRUD操作
- 基于文本的搜索
- 基于向量相似度的搜索
- 历史记录跟踪

## 目录结构

```
app/
├── api/             # API路由和端点
├── core/            # 核心配置和工具
├── db/              # 数据库连接和初始化
├── models/          # SQLAlchemy数据库模型
├── schemas/         # Pydantic数据模式
├── services/        # 业务逻辑服务
└── utils/           # 通用工具函数
```

## 本地开发

### 前提条件

- Python 3.10+
- PostgreSQL 15+ (安装pgvector扩展)
- pip

### 设置环境

1. 克隆仓库并进入后端目录

```bash
git clone <repository-url>
cd WeKnowledge/backend
```

2. 创建并激活虚拟环境

```bash
python -m venv venv
source venv/bin/activate  # Windows使用: venv\Scripts\activate
```

3. 安装依赖

```bash
pip install -r requirements.txt
```

4. 创建环境配置

```bash
cp .env.example .env
# 编辑.env文件设置您的数据库连接和其他配置
```

5. 初始化数据库

```bash
# 创建数据库
psql -U postgres -c "CREATE DATABASE weknowledge"

# 创建迁移
alembic revision --autogenerate -m "initial"

# 应用迁移
alembic upgrade head

# 初始化数据
python -m app.db.init_db
```

6. 启动开发服务器

```bash
uvicorn app.main:app --reload
```

服务器将在 http://localhost:8000 上运行，API文档可在 http://localhost:8000/docs 上访问。

## 使用Docker

项目提供了Docker配置，你可以使用Docker Compose启动整个应用：

```bash
cd WeKnowledge
docker-compose up
```

这将启动API服务器、前端和PostgreSQL数据库。

## API文档

API文档使用Swagger UI生成，可在 `/docs` 端点查看。

## 数据库模型

- **User**: 用户信息，包括认证和权限数据
- **KnowledgeItem**: 知识条目，支持向量嵌入
- **History**: 用户操作历史记录 