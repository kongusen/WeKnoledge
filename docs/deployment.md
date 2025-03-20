# 部署指南

本文档提供了将WeKnoledge系统部署到各种环境的详细说明。

## 目录

- [准备工作](#准备工作)
- [Docker部署](#docker部署)
- [Kubernetes部署](#kubernetes部署)
- [手动部署](#手动部署)
- [云服务部署](#云服务部署)
- [配置选项](#配置选项)
- [监控与日志](#监控与日志)
- [更新与维护](#更新与维护)
- [故障排除](#故障排除)

## 准备工作

在部署WeKnoledge之前，请确保您已准备好以下内容：

1. **OpenAI API密钥**：用于向量化和问答功能
2. **PostgreSQL数据库**：安装pgvector扩展
3. **存储服务**：用于文档存储（本地文件系统或云存储）
4. **域名**（可选）：如果需要公开访问
5. **SSL证书**（推荐）：用于HTTPS加密

## Docker部署

使用Docker Compose是最简单的部署方式，适合小型到中型部署。

### 步骤1：克隆代码库

```bash
git clone https://github.com/yourusername/weknowledge.git
cd weknowledge
```

### 步骤2：配置环境变量

```bash
cp .env.example .env
```

编辑`.env`文件并设置必要的环境变量：

```
# 数据库配置
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=weknowledge
POSTGRES_HOST=db
POSTGRES_PORT=5432

# API配置
API_SECRET_KEY=your_generated_secret_key
OPENAI_API_KEY=your_openai_api_key

# 前端配置
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 步骤3：启动服务

```bash
docker-compose up -d
```

这将启动以下服务：
- PostgreSQL数据库
- 后端API服务
- 前端Web应用
- NGINX反向代理

### 步骤4：初始化数据库

首次运行时，需要执行数据库迁移：

```bash
docker-compose exec backend alembic upgrade head
```

### 步骤5：创建管理员用户

```bash
docker-compose exec backend python -m app.scripts.create_admin
```

### 步骤6：访问应用

- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## Kubernetes部署

对于需要高可用性和自动扩展的生产环境，Kubernetes是理想的部署平台。

### 先决条件

- Kubernetes集群
- Helm 3
- kubectl配置为连接到集群

### 步骤1：添加Helm仓库

```bash
helm repo add weknowledge https://your-helm-repo.com
helm repo update
```

### 步骤2：准备配置文件

创建`values.yaml`文件：

```yaml
global:
  environment: production
  
database:
  host: your-postgres-host
  port: 5432
  user: postgres
  password: your-secure-password
  database: weknowledge
  
backend:
  replicas: 2
  resources:
    limits:
      cpu: 1
      memory: 2Gi
    requests:
      cpu: 500m
      memory: 1Gi
  openaiApiKey: your-openai-api-key
  
frontend:
  replicas: 2
  resources:
    limits:
      cpu: 500m
      memory: 1Gi
    requests:
      cpu: 200m
      memory: 512Mi
  
ingress:
  enabled: true
  host: weknowledge.your-domain.com
  tls:
    enabled: true
```

### 步骤3：安装Helm Chart

```bash
helm install weknowledge weknowledge/weknowledge -f values.yaml
```

### 步骤4：验证部署

```bash
kubectl get pods
kubectl get services
kubectl get ingress
```

### 步骤5：创建管理员用户

```bash
kubectl exec -it $(kubectl get pods -l app=weknowledge-backend -o jsonpath='{.items[0].metadata.name}') -- python -m app.scripts.create_admin
```

## 手动部署

对于需要更多控制或无法使用容器的环境，可以选择手动部署。

### 后端部署

#### 步骤1：准备服务器

- 安装Python 3.10+
- 安装PostgreSQL 14+及pgvector扩展
- 安装所需依赖：
  ```bash
  apt-get update
  apt-get install -y python3-pip python3-venv build-essential libpq-dev
  ```

#### 步骤2：设置Python环境

```bash
git clone https://github.com/yourusername/weknowledge.git
cd weknowledge/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 步骤3：配置环境变量

创建`.env`文件并设置必要的环境变量。

#### 步骤4：数据库迁移

```bash
alembic upgrade head
```

#### 步骤5：配置Gunicorn与Supervisor

创建Supervisor配置文件 `/etc/supervisor/conf.d/weknowledge-backend.conf`:

```ini
[program:weknowledge-backend]
directory=/path/to/weknowledge/backend
command=/path/to/weknowledge/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app -b 0.0.0.0:8000
autostart=true
autorestart=true
stderr_logfile=/var/log/weknowledge-backend.err.log
stdout_logfile=/var/log/weknowledge-backend.out.log
user=your_user
environment=
    POSTGRES_USER=postgres,
    POSTGRES_PASSWORD=your_secure_password,
    POSTGRES_DB=weknowledge,
    POSTGRES_HOST=localhost,
    POSTGRES_PORT=5432,
    API_SECRET_KEY=your_generated_secret_key,
    OPENAI_API_KEY=your_openai_api_key
```

启动服务：

```bash
supervisorctl reread
supervisorctl update
supervisorctl start weknowledge-backend
```

### 前端部署

#### 步骤1：安装依赖

```bash
cd /path/to/weknowledge/frontend
npm install
```

#### 步骤2：构建前端

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com npm run build
```

#### 步骤3：配置NGINX

创建NGINX配置文件 `/etc/nginx/sites-available/weknowledge`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 将HTTP请求重定向到HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com www.your-domain.com;
    
    # SSL配置
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # 前端静态文件
    location / {
        root /path/to/weknowledge/frontend/out;
        try_files $uri $uri.html $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置并重启NGINX：

```bash
ln -s /etc/nginx/sites-available/weknowledge /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 云服务部署

WeKnoledge可以部署在各种云服务提供商上，以下是一些常见选项：

### AWS部署

#### 服务组合
- Amazon RDS for PostgreSQL (with pgvector)
- Amazon ECS或EKS（容器服务）
- Amazon S3（文档存储）
- Amazon CloudFront（CDN）
- AWS Application Load Balancer

#### 简要步骤
1. 创建RDS PostgreSQL实例并启用pgvector
2. 创建S3存储桶用于文档存储
3. 使用ECS Task Definitions定义容器服务
4. 设置ECS Service或EKS Deployment
5. 配置ALB处理流量
6. 设置CloudFront分发加速静态内容

### Azure部署

#### 服务组合
- Azure Database for PostgreSQL
- Azure Kubernetes Service或App Service
- Azure Blob Storage
- Azure CDN
- Azure Application Gateway

### Google Cloud部署

#### 服务组合
- Cloud SQL for PostgreSQL
- Google Kubernetes Engine或Cloud Run
- Cloud Storage
- Cloud CDN
- Cloud Load Balancing

## 配置选项

WeKnoledge系统提供多种配置选项，可通过环境变量或配置文件设置：

### 核心配置

| 配置项 | 环境变量 | 默认值 | 描述 |
|------|----------|------|------|
| 数据库URL | DATABASE_URL | - | 数据库连接URL |
| JWT密钥 | API_SECRET_KEY | - | 用于JWT令牌加密的密钥 |
| OpenAI API密钥 | OPENAI_API_KEY | - | OpenAI API密钥 |
| OpenAI模型 | OPENAI_MODEL | gpt-4o | 使用的OpenAI模型 |
| 向量嵌入模型 | EMBEDDING_MODEL | text-embedding-3-large | 文本嵌入模型 |

### 前端配置

| 配置项 | 环境变量 | 默认值 | 描述 |
|------|----------|------|------|
| API基础URL | NEXT_PUBLIC_API_URL | http://localhost:8000 | 后端API的URL |
| 文件上传大小限制 | NEXT_PUBLIC_MAX_FILE_SIZE | 100MB | 文件上传大小限制 |
| 默认主题 | NEXT_PUBLIC_DEFAULT_THEME | light | 默认UI主题 |

### 存储配置

| 配置项 | 环境变量 | 默认值 | 描述 |
|------|----------|------|------|
| 存储类型 | STORAGE_TYPE | local | 存储类型(local/s3/azure/gcs) |
| 存储路径 | STORAGE_PATH | ./uploads | 本地存储路径 |
| S3存储桶 | S3_BUCKET | - | AWS S3存储桶名称 |
| S3区域 | S3_REGION | - | AWS S3区域 |

### 安全配置

| 配置项 | 环境变量 | 默认值 | 描述 |
|------|----------|------|------|
| 允许注册 | ALLOW_REGISTRATION | true | 是否允许新用户注册 |
| 密码最小长度 | MIN_PASSWORD_LENGTH | 8 | 密码最小长度 |
| 访问令牌过期时间 | ACCESS_TOKEN_EXPIRE_MINUTES | 30 | 访问令牌过期时间(分钟) |

## 监控与日志

### 日志配置

WeKnoledge使用结构化日志，可配置为输出到标准输出或文件：

```bash
# 环境变量
LOG_LEVEL=info  # debug, info, warning, error, critical
LOG_FORMAT=json  # json, text
LOG_FILE=/var/log/weknowledge.log  # 设置后将输出到文件
```

### 监控指标

系统暴露Prometheus指标端点：`/metrics`，包括：

- HTTP请求计数和延迟
- 数据库查询性能
- 文档处理时间
- 向量搜索性能
- 内存和CPU使用率

### 健康检查

健康检查端点：
- `/health` - 简单的应用健康状态
- `/health/live` - 应用存活检查
- `/health/ready` - 应用就绪检查，包括数据库连接

### 推荐监控工具

- Prometheus + Grafana - 指标收集和可视化
- ELK Stack (Elasticsearch, Logstash, Kibana) - 日志管理
- Sentry - 错误跟踪
- Uptime Robot - 外部可用性监控

## 更新与维护

### 版本更新步骤

1. 备份数据
   ```bash
   pg_dump -U postgres -d weknowledge > weknowledge_backup.sql
   ```

2. 拉取最新代码
   ```bash
   git pull origin main
   ```

3. 更新依赖
   ```bash
   # 后端
   cd backend
   pip install -r requirements.txt
   
   # 前端
   cd frontend
   npm install
   ```

4. 运行数据库迁移
   ```bash
   cd backend
   alembic upgrade head
   ```

5. 重新构建前端
   ```bash
   cd frontend
   npm run build
   ```

6. 重启服务
   ```bash
   # 如果使用Docker
   docker-compose down
   docker-compose up -d
   
   # 如果使用Supervisor
   supervisorctl restart weknowledge-backend
   
   # 如果使用Systemd
   systemctl restart weknowledge-backend
   ```

### 数据库维护

定期执行以下操作：

1. 数据库备份
2. 索引重建
   ```sql
   REINDEX INDEX idx_document_chunks_embedding;
   ```
3. 数据库清理
   ```sql
   VACUUM ANALYZE;
   ```

## 故障排除

### 常见问题

#### 数据库连接错误

**症状**：应用无法启动，日志显示数据库连接错误。

**解决方案**：
1. 检查数据库连接字符串
2. 确认PostgreSQL服务正在运行
3. 验证网络连接和防火墙规则
4. 检查数据库用户权限

#### 向量搜索失败

**症状**：文档上传成功但搜索失败，显示pgvector相关错误。

**解决方案**：
1. 确认pgvector扩展已安装
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. 检查向量维度是否匹配（应为1536）
3. 验证文档是否成功生成了向量嵌入

#### 前端无法连接API

**症状**：前端加载但无法获取数据或登录。

**解决方案**：
1. 检查NEXT_PUBLIC_API_URL配置
2. 验证API服务是否运行
3. 检查CORS设置
4. 查看浏览器控制台错误信息

### 查看服务日志

```bash
# Docker环境
docker-compose logs -f backend
docker-compose logs -f frontend

# Kubernetes环境
kubectl logs -f deployment/weknowledge-backend
kubectl logs -f deployment/weknowledge-frontend

# 手动部署环境
tail -f /var/log/weknowledge-backend.out.log
tail -f /var/log/nginx/error.log
```

### 联系支持

如果您遇到无法解决的问题，可以通过以下方式获取支持：

1. GitHub Issues: https://github.com/yourusername/weknowledge/issues
2. 文档网站: https://docs.weknowledge.com
3. 邮件支持: support@weknowledge.com 