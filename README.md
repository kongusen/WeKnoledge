# WeKnoledge - 企业级智能知识管理平台

<div align="center">
  <img src="docs/images/logo.png" alt="WeKnoledge Logo" width="200"/>
  <p>强大的企业知识管理与智能问答平台</p>
</div>

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](https://www.postgresql.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-black.svg)](https://nextjs.org/)

## 📖 项目介绍

WeKnoledge 是一个开源的企业级智能知识管理平台，结合了知识库管理、文档处理与智能问答功能，帮助企业高效管理和利用知识资产。平台支持多种文档格式的导入、向量化存储和检索，同时利用大型语言模型提供智能问答和知识挖掘功能。

## ✨ 核心功能

- **文档管理**：上传、组织和管理多种格式的文档
- **智能问答**：基于企业知识库的精准问答服务
- **文档检索**：高效向量检索，支持语义搜索
- **智能写作**：AI辅助内容创作和文本优化
- **多用户管理**：完善的权限系统和团队协作功能
- **可视化仪表盘**：直观展示知识库使用情况和热点分析

## 🔧 技术架构

- **前端**：Next.js + Ant Design + TailwindCSS
- **后端**：FastAPI + SQLAlchemy
- **数据库**：PostgreSQL + pgvector
- **AI模型**：支持接入OpenAI、Anthropic和本地模型

## 🚀 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (with pgvector extension)
- Docker (推荐)

### 使用Docker Compose部署

1. 克隆仓库
```bash
git clone https://github.com/yourusername/weknowledge.git
cd weknowledge
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件配置数据库和OpenAI API密钥
```

3. 启动服务
```bash
docker-compose up -d
```

4. 访问平台
```
http://localhost:3000
```

默认管理员账户: 
- 用户名: admin
- 密码: admin123

### 手动部署

#### 后端部署

1. 切换到后端目录
```bash
cd backend
```

2. 创建Python虚拟环境
```bash
python -m venv venv
source venv/bin/activate  # 在Windows上使用 venv\Scripts\activate
```

3. 安装依赖
```bash
pip install -r requirements.txt
```

4. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件
```

5. 初始化数据库
```bash
alembic upgrade head
python -c "from app.db.init_db import init_db; from app.db.session import SessionLocal; db = SessionLocal(); init_db(db)"
```

6. 启动后端服务
```bash
uvicorn app.main:app --reload
```

#### 前端部署

1. 切换到前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env.local
# 编辑.env.local文件
```

4. 启动开发服务器
```bash
npm run dev
```

5. 构建生产版本
```bash
npm run build
npm start
```

## 📚 文档

详细文档请参阅 [docs](docs/) 目录。

## 🤝 贡献指南

欢迎贡献代码、报告问题或提供改进建议。请查阅我们的 [贡献指南](CONTRIBUTING.md) 了解更多信息。

## 📄 许可证

本项目基于 Apache License 2.0 开源，并附有额外条件。详情请参阅 [LICENSE](LICENSE) 文件。

# 企业级智能知识库平台 - 前端

本项目是企业级智能知识管理平台的前端部分，旨在构建企业内部知识中心，提升知识资产价值，赋能员工高效工作。

## 技术栈

* React 19
* Next.js 15
* TypeScript
* Ant Design 5
* Tailwind CSS

## 主要功能

* 知识沉淀：支持各种形式的知识管理，包括文档、图片等
* 智能检索：强大的搜索能力，快速找到所需知识
* AI赋能：智能问答、写作辅助、文档解读
* 权限管理：精细的权限控制，保障企业知识安全
* 组织协作：支持团队协作，共享知识资产
* 数据分析：提供知识库使用情况分析

## 目录结构

```
/frontend
├── public/                      # 静态资源
│   └── images/                  # 图片资源
├── src/                         # 源代码
│   ├── components/              # React组件
│   │   ├── common/              # 通用组件
│   │   ├── layout/              # 布局相关组件
│   │   └── features/            # 按功能模块组织的组件
│   │       ├── search/          # 搜索相关组件
│   │       ├── knowledge/       # 知识库相关组件
│   │       ├── document/        # 文档解读相关组件
│   │       ├── writing/         # 智能写作相关组件
│   │       ├── history/         # 历史记录相关组件
│   │       └── admin/           # 管理后台相关组件
│   ├── pages/                   # Next.js页面
│   ├── services/                # API服务
│   ├── utils/                   # 工具函数
│   ├── styles/                  # 样式文件
│   └── types/                   # TypeScript类型定义
├── next.config.js               # Next.js配置
├── postcss.config.js            # PostCSS配置
├── tailwind.config.js           # Tailwind CSS配置
├── tsconfig.json                # TypeScript配置
└── package.json                 # 项目依赖和脚本
```

## 启动项目

```bash
# 安装依赖
npm install

# 开发环境启动
npm run dev

# 生产环境构建
npm run build

# 生产环境启动
npm run start
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

