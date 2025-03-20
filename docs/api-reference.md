# API参考

本文档提供了WeKnoledge平台的API参考信息。所有API路径都相对于基础URL：`https://your-domain.com/api/v1`。

## 认证

除了公开端点外，所有API请求都需要认证。使用Bearer令牌方式进行身份验证：

```
Authorization: Bearer <your_access_token>
```

## 错误处理

API使用标准HTTP状态码表示请求状态：

- `200` - 成功
- `201` - 创建成功
- `400` - 错误请求
- `401` - 未授权
- `403` - 禁止访问
- `404` - 资源未找到
- `422` - 验证错误
- `500` - 服务器错误

错误响应格式：

```json
{
  "detail": "错误描述信息",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "字段名",
      "message": "错误详情"
    }
  ]
}
```

## 用户API

### 登录

```
POST /auth/login
```

请求体：

```json
{
  "username": "your_username",
  "password": "your_password"
}
```

响应：

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "your_username",
    "email": "your_email@example.com",
    "role": "user"
  }
}
```

### 注册

```
POST /auth/register
```

请求体：

```json
{
  "username": "new_username",
  "email": "new_email@example.com",
  "password": "secure_password"
}
```

响应：

```json
{
  "id": 2,
  "username": "new_username",
  "email": "new_email@example.com",
  "role": "user"
}
```

### 获取当前用户信息

```
GET /users/me
```

响应：

```json
{
  "id": 1,
  "username": "your_username",
  "email": "your_email@example.com",
  "role": "user",
  "created_at": "2023-01-01T00:00:00Z"
}
```

## 知识库API

### 创建知识库

```
POST /knowledge-bases
```

请求体：

```json
{
  "name": "技术文档库",
  "description": "包含技术文档和教程的知识库",
  "is_public": false
}
```

响应：

```json
{
  "id": 1,
  "name": "技术文档库",
  "description": "包含技术文档和教程的知识库",
  "is_public": false,
  "owner_id": 1,
  "created_at": "2023-06-15T10:30:00Z",
  "updated_at": "2023-06-15T10:30:00Z"
}
```

### 获取知识库列表

```
GET /knowledge-bases
```

查询参数：
- `page`: 页码，默认1
- `limit`: 每页条数，默认10
- `search`: 搜索关键词

响应：

```json
{
  "items": [
    {
      "id": 1,
      "name": "技术文档库",
      "description": "包含技术文档和教程的知识库",
      "is_public": false,
      "owner_id": 1,
      "created_at": "2023-06-15T10:30:00Z",
      "updated_at": "2023-06-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

### 获取知识库详情

```
GET /knowledge-bases/{knowledge_base_id}
```

响应：

```json
{
  "id": 1,
  "name": "技术文档库",
  "description": "包含技术文档和教程的知识库",
  "is_public": false,
  "owner_id": 1,
  "created_at": "2023-06-15T10:30:00Z",
  "updated_at": "2023-06-15T10:30:00Z",
  "document_count": 5,
  "last_updated": "2023-06-16T14:20:00Z"
}
```

### 更新知识库

```
PUT /knowledge-bases/{knowledge_base_id}
```

请求体：

```json
{
  "name": "更新的技术文档库",
  "description": "更新的描述",
  "is_public": true
}
```

响应：

```json
{
  "id": 1,
  "name": "更新的技术文档库",
  "description": "更新的描述",
  "is_public": true,
  "owner_id": 1,
  "created_at": "2023-06-15T10:30:00Z",
  "updated_at": "2023-06-16T15:45:00Z"
}
```

### 删除知识库

```
DELETE /knowledge-bases/{knowledge_base_id}
```

响应：

```json
{
  "detail": "知识库已成功删除"
}
```

## 文档API

### 上传文档

```
POST /knowledge-bases/{knowledge_base_id}/documents
```

使用`multipart/form-data`格式：

- `file`: 文件内容
- `metadata`: 文档元数据（JSON字符串）

元数据JSON示例：

```json
{
  "title": "开发手册",
  "description": "开发团队使用的技术参考",
  "tags": ["技术", "开发", "参考"]
}
```

响应：

```json
{
  "id": 1,
  "filename": "dev_manual.pdf",
  "title": "开发手册",
  "description": "开发团队使用的技术参考",
  "status": "processing",
  "knowledge_base_id": 1,
  "mime_type": "application/pdf",
  "size": 1048576,
  "tags": ["技术", "开发", "参考"],
  "created_at": "2023-06-16T10:00:00Z",
  "updated_at": "2023-06-16T10:00:00Z"
}
```

### 获取文档列表

```
GET /knowledge-bases/{knowledge_base_id}/documents
```

查询参数：
- `page`: 页码，默认1
- `limit`: 每页条数，默认10
- `status`: 文档状态筛选
- `search`: 搜索关键词

响应：

```json
{
  "items": [
    {
      "id": 1,
      "filename": "dev_manual.pdf",
      "title": "开发手册",
      "description": "开发团队使用的技术参考",
      "status": "completed",
      "knowledge_base_id": 1,
      "mime_type": "application/pdf",
      "size": 1048576,
      "tags": ["技术", "开发", "参考"],
      "created_at": "2023-06-16T10:00:00Z",
      "updated_at": "2023-06-16T10:05:00Z",
      "chunk_count": 32
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

### 获取文档详情

```
GET /knowledge-bases/{knowledge_base_id}/documents/{document_id}
```

响应：

```json
{
  "id": 1,
  "filename": "dev_manual.pdf",
  "title": "开发手册",
  "description": "开发团队使用的技术参考",
  "status": "completed",
  "knowledge_base_id": 1,
  "mime_type": "application/pdf",
  "size": 1048576,
  "tags": ["技术", "开发", "参考"],
  "created_at": "2023-06-16T10:00:00Z",
  "updated_at": "2023-06-16T10:05:00Z",
  "chunk_count": 32,
  "processing_time": 5.2,
  "download_url": "https://your-domain.com/api/v1/documents/1/download"
}
```

### 删除文档

```
DELETE /knowledge-bases/{knowledge_base_id}/documents/{document_id}
```

响应：

```json
{
  "detail": "文档已成功删除"
}
```

## 问答API

### 提问问题

```
POST /knowledge-bases/{knowledge_base_id}/chat
```

请求体：

```json
{
  "query": "如何设置开发环境？",
  "conversation_id": "conv_12345",
  "include_citations": true
}
```

响应：

```json
{
  "answer": "要设置开发环境，请按照以下步骤操作：\n\n1. 安装Python 3.10或更高版本\n2. 安装Node.js 18或更高版本\n3. 克隆仓库\n4. 运行`pip install -r requirements.txt`安装后端依赖\n5. 运行`npm install`安装前端依赖\n\n更多详细信息，请参考开发手册第15页。",
  "conversation_id": "conv_12345",
  "citations": [
    {
      "document_id": 1,
      "document_title": "开发手册",
      "chunk_id": 5,
      "text": "开发环境设置需要Python 3.10+和Node.js 18+...",
      "relevance_score": 0.92
    }
  ],
  "sources": [
    {
      "document_id": 1,
      "document_title": "开发手册",
      "chunk_count": 2
    }
  ],
  "processing_time": 1.2
}
```

### 获取对话历史

```
GET /conversations
```

查询参数：
- `page`: 页码，默认1
- `limit`: 每页条数，默认10

响应：

```json
{
  "items": [
    {
      "id": "conv_12345",
      "title": "开发环境问题",
      "last_message": "如何设置开发环境？",
      "knowledge_base_id": 1,
      "knowledge_base_name": "技术文档库",
      "message_count": 2,
      "created_at": "2023-06-18T09:30:00Z",
      "updated_at": "2023-06-18T09:35:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

### 获取对话详情

```
GET /conversations/{conversation_id}
```

响应：

```json
{
  "id": "conv_12345",
  "title": "开发环境问题",
  "knowledge_base_id": 1,
  "knowledge_base_name": "技术文档库",
  "created_at": "2023-06-18T09:30:00Z",
  "updated_at": "2023-06-18T09:35:00Z",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "如何设置开发环境？",
      "timestamp": "2023-06-18T09:30:00Z"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "要设置开发环境，请按照以下步骤操作：\n\n1. 安装Python 3.10或更高版本\n2. 安装Node.js 18或更高版本\n3. 克隆仓库\n4. 运行`pip install -r requirements.txt`安装后端依赖\n5. 运行`npm install`安装前端依赖\n\n更多详细信息，请参考开发手册第15页。",
      "timestamp": "2023-06-18T09:35:00Z",
      "citations": [
        {
          "document_id": 1,
          "document_title": "开发手册",
          "chunk_id": 5
        }
      ]
    }
  ]
}
```

## 数据导出API

### 导出知识库

```
POST /knowledge-bases/{knowledge_base_id}/export
```

响应：

```json
{
  "task_id": "task_78901",
  "status": "processing",
  "estimated_time": 30
}
```

### 检查导出状态

```
GET /tasks/{task_id}
```

响应：

```json
{
  "task_id": "task_78901",
  "status": "completed",
  "result": {
    "download_url": "https://your-domain.com/api/v1/downloads/export_12345.zip",
    "expires_at": "2023-06-19T10:00:00Z"
  },
  "created_at": "2023-06-18T11:00:00Z",
  "completed_at": "2023-06-18T11:01:30Z"
}
```