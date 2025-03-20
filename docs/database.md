# 数据库设计

本文档描述了WeKnoledge系统的数据库设计和模型关系。

## 数据库概览

WeKnoledge使用PostgreSQL作为主要数据库，同时使用pgvector扩展来支持向量搜索功能。数据库设计遵循了关系型数据库的最佳实践，同时针对向量搜索进行了特定优化。

## 实体关系图

下面是系统主要实体及其关系的ER图：

```
+-------------+       +---------------+       +----------------+
|    Users    |-------|  KnowledgeBase|-------|   Documents    |
+-------------+       +---------------+       +----------------+
       |                      |                       |
       |                      |                       |
       v                      v                       v
+-------------+       +---------------+       +----------------+
|   UserLogs  |       |  SharedAccess |       | DocumentChunks |
+-------------+       +---------------+       +----------------+
                                                      |
                                                      |
                                                      v
                                              +----------------+
                                              | Conversations  |
                                              +----------------+
                                                      |
                                                      |
                                                      v
                                              +----------------+
                                              |   Messages    |
                                              +----------------+
```

## 数据表结构

### users 表

存储用户信息。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 用户ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱地址 |
| hashed_password | VARCHAR(255) | NOT NULL | 加密后的密码 |
| full_name | VARCHAR(100) | | 全名 |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 账户是否激活 |
| is_superuser | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否为超级管理员 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

### knowledge_bases 表

存储知识库信息。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 知识库ID |
| name | VARCHAR(100) | NOT NULL | 知识库名称 |
| description | TEXT | | 知识库描述 |
| is_public | BOOLEAN | NOT NULL, DEFAULT FALSE | 是否公开 |
| owner_id | INTEGER | FOREIGN KEY (users.id) | 所有者ID |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

### documents 表

存储文档信息。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 文档ID |
| filename | VARCHAR(255) | NOT NULL | 文件名 |
| title | VARCHAR(255) | | 文档标题 |
| description | TEXT | | 文档描述 |
| mime_type | VARCHAR(100) | NOT NULL | MIME类型 |
| size | INTEGER | NOT NULL | 文件大小(字节) |
| status | VARCHAR(20) | NOT NULL | 处理状态 |
| storage_path | VARCHAR(255) | | 存储路径 |
| knowledge_base_id | INTEGER | FOREIGN KEY (knowledge_bases.id) | 所属知识库ID |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |
| metadata | JSONB | | 额外元数据 |
| tags | TEXT[] | | 标签数组 |

### document_chunks 表

存储文档分块和向量嵌入。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 分块ID |
| document_id | INTEGER | FOREIGN KEY (documents.id) | 所属文档ID |
| content | TEXT | NOT NULL | 文本内容 |
| metadata | JSONB | | 分块元数据 |
| embedding | VECTOR(1536) | | 向量嵌入 |
| chunk_number | INTEGER | NOT NULL | 分块序号 |
| token_count | INTEGER | | 标记数量 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |

### conversations 表

存储对话信息。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | VARCHAR(50) | PRIMARY KEY | 对话ID |
| title | VARCHAR(255) | | 对话标题 |
| user_id | INTEGER | FOREIGN KEY (users.id) | 用户ID |
| knowledge_base_id | INTEGER | FOREIGN KEY (knowledge_bases.id) | 知识库ID |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |
| metadata | JSONB | | 额外元数据 |

### messages 表

存储对话中的消息。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | VARCHAR(50) | PRIMARY KEY | 消息ID |
| conversation_id | VARCHAR(50) | FOREIGN KEY (conversations.id) | 所属对话ID |
| role | VARCHAR(20) | NOT NULL | 消息角色(user/assistant) |
| content | TEXT | NOT NULL | 消息内容 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| metadata | JSONB | | 额外元数据 |

### citations 表

存储消息中的引用信息。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 引用ID |
| message_id | VARCHAR(50) | FOREIGN KEY (messages.id) | 所属消息ID |
| document_id | INTEGER | FOREIGN KEY (documents.id) | 引用文档ID |
| document_chunk_id | INTEGER | FOREIGN KEY (document_chunks.id) | 引用分块ID |
| relevance_score | FLOAT | | 相关性分数 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |

### shared_access 表

存储知识库访问权限设置。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 访问ID |
| knowledge_base_id | INTEGER | FOREIGN KEY (knowledge_bases.id) | 知识库ID |
| user_id | INTEGER | FOREIGN KEY (users.id) | 用户ID |
| access_level | VARCHAR(20) | NOT NULL | 访问级别(read/write/admin) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

### api_keys 表

存储API密钥信息。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 密钥ID |
| key | VARCHAR(64) | UNIQUE, NOT NULL | API密钥(加密存储) |
| name | VARCHAR(100) | NOT NULL | 密钥名称 |
| user_id | INTEGER | FOREIGN KEY (users.id) | 用户ID |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| expires_at | TIMESTAMP | | 过期时间 |
| last_used_at | TIMESTAMP | | 最后使用时间 |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 是否激活 |

### user_logs 表

存储用户活动日志。

| 列名 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | SERIAL | PRIMARY KEY | 日志ID |
| user_id | INTEGER | FOREIGN KEY (users.id) | 用户ID |
| action | VARCHAR(100) | NOT NULL | 操作类型 |
| resource_type | VARCHAR(50) | | 资源类型 |
| resource_id | VARCHAR(50) | | 资源ID |
| ip_address | VARCHAR(45) | | IP地址 |
| user_agent | TEXT | | 用户代理 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| details | JSONB | | 详细信息 |

## 索引设计

为了提高查询性能，系统创建了以下索引：

### 文本索引

```sql
CREATE INDEX idx_documents_title ON documents USING GIN (to_tsvector('english', title));
CREATE INDEX idx_document_chunks_content ON document_chunks USING GIN (to_tsvector('english', content));
```

### 向量索引

```sql
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
```

### 外键索引

```sql
CREATE INDEX idx_documents_knowledge_base_id ON documents(knowledge_base_id);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_knowledge_base_id ON conversations(knowledge_base_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

### JSON索引

```sql
CREATE INDEX idx_documents_metadata ON documents USING GIN (metadata);
CREATE INDEX idx_document_chunks_metadata ON document_chunks USING GIN (metadata);
```

## 数据迁移

数据库迁移使用Alembic管理。所有迁移脚本存储在`backend/alembic/versions/`目录中。主要迁移包括：

1. 初始表结构创建
2. 添加pgvector扩展
3. 添加文档标签功能
4. 添加对话和消息功能
5. 添加引用跟踪功能
6. 添加共享访问功能
7. 添加API密钥管理
8. 性能优化索引

## 数据备份与恢复

系统使用以下策略进行数据备份：

1. 每日自动完整备份
2. 每小时增量备份
3. 事务日志连续备份

备份文件存储在安全的远程位置，并定期测试恢复过程，以确保数据可以在需要时可靠地恢复。

## 性能考虑

### 分区策略

对于大型部署，我们对以下表实施了分区策略：

- `document_chunks` - 按文档ID范围分区
- `messages` - 按创建日期分区
- `user_logs` - 按创建日期分区

### 缓存策略

系统使用Redis缓存以下数据：

- 用户会话信息
- 频繁访问的知识库元数据
- 文档预览
- 对话历史 