# 企业级智能知识库平台 - 前端

本项目是企业级智能知识管理平台的前端部分，旨在构建企业内部知识中心，提升知识资产价值，赋能员工高效工作。

## 技术栈

* React 18
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