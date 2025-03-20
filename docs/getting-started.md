# 快速开始

本指南将帮助您快速设置和运行WeKnoledge系统。

## 环境要求

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (with pgvector extension)
- Docker (推荐)

## 使用Docker Compose（推荐）

使用Docker Compose是最简单的开始方式，它会自动设置所有必要的服务。

### 步骤 1: 克隆仓库

```bash
git clone https://github.com/yourusername/weknowledge.git
cd weknowledge
```

### 步骤 2: 配置环境变量

```bash
cp .env.example .env
```

使用您喜欢的文本编辑器打开`.env`文件，根据需要调整配置。最重要的是设置您的OpenAI API密钥：

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 步骤 3: 启动服务

```bash
docker-compose up -d
```

### 步骤 4: 访问应用

前端: http://localhost:3000
后端API: http://localhost:8000
API文档: http://localhost:8000/docs

## 手动安装

如果您想更精细地控制安装过程，可以选择手动安装。

### 后端安装

#### 步骤 1: 设置Python环境

```bash
cd backend
python -m venv venv
source venv/bin/activate  # 在Windows上使用 venv\Scripts\activate
pip install -r requirements.txt
```

#### 步骤 2: 配置数据库

确保您有一个运行中的PostgreSQL数据库，并已安装pgvector扩展：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 步骤 3: 配置环境变量

```bash
cp .env.example .env
```

编辑`.env`文件以匹配您的数据库设置。

#### 步骤 4: 运行数据库迁移

```bash
alembic upgrade head
```

#### 步骤 5: 创建初始数据

```bash
python -c "from app.db.init_db import init_db; from app.db.session import SessionLocal; db = SessionLocal(); init_db(db)"
```

#### 步骤 6: 启动服务器

```bash
uvicorn app.main:app --reload
```

### 前端安装

#### 步骤 1: 安装依赖

```bash
cd frontend
npm install
```

#### 步骤 2: 配置环境变量

```bash
cp .env.example .env.local
```

编辑`.env.local`文件，确保`NEXT_PUBLIC_API_URL`指向正确的后端URL。

#### 步骤 3: 启动开发服务器

```bash
npm run dev
```

## 登录系统

安装完成后，您可以使用以下默认管理员账户登录：

- 用户名: admin
- 密码: admin123

**安全提示**: 请在生产环境中尽快更改默认密码。

## 下一步

- 浏览[用户手册](./user-manual.md)了解如何使用系统
- 查看[系统架构](./architecture.md)了解更多技术细节
- 参考[API文档](./api-reference.md)了解API集成选项 