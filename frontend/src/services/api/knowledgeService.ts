import request from './request';

// 知识条目类型
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  type: 'personal' | 'organization';
  is_public: boolean;
  views: number;
  likes: number;
  author_id: string;
  author?: {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
  };
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

// 创建知识条目参数
export interface CreateKnowledgeItemParams {
  title: string;
  content: string;
  tags?: string[];
  type?: 'personal' | 'organization';
  is_public?: boolean;
  metadata?: Record<string, any>;
}

// 更新知识条目参数
export interface UpdateKnowledgeItemParams {
  title?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  type?: 'personal' | 'organization';
  is_public?: boolean;
  metadata?: Record<string, any>;
}

// 搜索结果类型
export interface KnowledgeSearchResult {
  item: KnowledgeItem;
  score: number;
  similarity: number;
}

// 知识库类型
export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
  document_count: number;
}

// 创建知识库参数
export interface CreateKnowledgeBaseParams {
  name: string;
  description?: string;
  is_public?: boolean;
  embedding_model?: string;
  search_config?: Record<string, any>;
}

// 文档类型
export interface Document {
  id: string;
  title: string;
  doc_type?: string;
  tags?: string[];
  knowledge_base_id: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  has_embedding: boolean;
  metadata?: Record<string, any>;
}

// 创建文档参数
export interface CreateDocumentParams {
  title: string;
  content: string;
  doc_type?: string;
  tags?: string[];
  knowledge_base_id: string;
  metadata?: Record<string, any>;
}

// 文档片段类型
export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  has_embedding: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 引用信息类型
export interface CitationInfo {
  document_id: string;
  title: string;
  page_num?: number;
  chunk_id: string;
  score: number;
}

// 问答响应类型
export interface AnswerResponse {
  data: {
    answer: string;
    citations?: CitationInfo[];
  }
}

// 聊天消息类型
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: CitationInfo[];
}

// 聊天历史类型
export interface ChatHistory {
  id: string;
  knowledge_base_id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// 向量搜索参数类型
export interface VectorSearchParams {
  query: string;
  knowledge_base_id?: string;
  doc_type?: string;
  tags?: string[];
  limit?: number;
  similarity_threshold?: number;
}

// 向量搜索结果类型
export interface VectorSearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, any>;
  similarity: number;
  score: number;
}

export interface VectorSearchResponse {
  results: VectorSearchResult[];
  query: string;
  total: number;
}

// 获取知识条目列表
export const getKnowledgeItems = async (
  type?: 'personal' | 'organization',
  tag?: string,
  skip = 0,
  limit = 100
): Promise<KnowledgeItem[]> => {
  const params: Record<string, any> = { skip, limit };
  if (type) params.type = type;
  if (tag) params.tag = tag;
  
  return request.get('/api/v1/knowledge', { params });
};

// 获取单个知识条目
export const getKnowledgeItem = async (id: string): Promise<KnowledgeItem> => {
  return request.get(`/api/v1/knowledge/${id}`);
};

// 创建知识条目
export const createKnowledgeItem = async (
  data: CreateKnowledgeItemParams
): Promise<KnowledgeItem> => {
  return request.post('/api/v1/knowledge', data);
};

// 更新知识条目
export const updateKnowledgeItem = async (
  id: string,
  data: UpdateKnowledgeItemParams
): Promise<KnowledgeItem> => {
  return request.put(`/api/v1/knowledge/${id}`, data);
};

// 删除知识条目
export const deleteKnowledgeItem = async (id: string): Promise<{ message: string }> => {
  return request.delete(`/api/v1/knowledge/${id}`);
};

// 文本搜索
export const searchKnowledgeItems = async (
  query: string,
  type?: 'personal' | 'organization'
): Promise<KnowledgeItem[]> => {
  const params: Record<string, any> = { q: query };
  if (type) params.type = type;
  
  return request.get('/api/v1/knowledge/search/text', { params });
};

// 向量搜索
export const vectorSearchKnowledgeItems = async (
  query: string,
  type?: 'personal' | 'organization',
  limit = 10
): Promise<KnowledgeSearchResult[]> => {
  const params: Record<string, any> = { q: query, limit };
  if (type) params.type = type;
  
  return request.get('/api/v1/knowledge/search/vector', { params });
};

// 创建新知识库
export async function createKnowledgeBase(params: CreateKnowledgeBaseParams) {
  return request('/api/v1/knowledge-base', {
    method: 'POST',
    data: params,
  });
}

// 获取知识库列表
export async function getKnowledgeBases(params?: { skip?: number; limit?: number }) {
  return request<KnowledgeBase[]>('/api/v1/knowledge-base', {
    method: 'GET',
    params,
  });
}

// 获取知识库详情
export async function getKnowledgeBase(id: string) {
  return request<KnowledgeBase>(`/api/v1/knowledge-base/${id}`, {
    method: 'GET',
  });
}

// 更新知识库
export async function updateKnowledgeBase(id: string, data: Partial<CreateKnowledgeBaseParams>) {
  return request<KnowledgeBase>(`/api/v1/knowledge-base/${id}`, {
    method: 'PUT',
    data,
  });
}

// 删除知识库
export async function deleteKnowledgeBase(id: string) {
  return request<{ message: string }>(`/api/v1/knowledge-base/${id}`, {
    method: 'DELETE',
  });
}

// 创建文档
export async function createDocument(params: CreateDocumentParams) {
  return request<Document>('/api/v1/document', {
    method: 'POST',
    data: params,
  });
}

// 上传文档文件
export async function uploadDocument(
  file: File,
  knowledge_base_id: string,
  title: string,
  tags?: string,
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('knowledge_base_id', knowledge_base_id);
  if (tags) {
    formData.append('tags', tags);
  }

  return request<Document>('/api/v1/document/upload', {
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// 获取文档列表
export async function getDocuments(params?: {
  skip?: number;
  limit?: number;
  knowledge_base_id?: string;
  doc_type?: string;
  tag?: string;
}) {
  return request<Document[]>('/api/v1/document', {
    method: 'GET',
    params,
  });
}

// 获取文档详情
export async function getDocument(id: string) {
  return request<Document>(`/api/v1/document/${id}`, {
    method: 'GET',
  });
}

// 获取文档片段列表
export async function getDocumentChunks(documentId: string) {
  return request<DocumentChunk[]>(`/api/v1/document/${documentId}/chunks`, {
    method: 'GET',
  });
}

// 删除文档
export async function deleteDocument(id: string) {
  return request<{ message: string }>(`/api/v1/document/${id}`, {
    method: 'DELETE',
  });
}

// 向量搜索
export async function vectorSearch(params: VectorSearchParams) {
  return request<VectorSearchResponse>('/api/v1/vector/search', {
    method: 'POST',
    data: params,
  });
}

// 提问问题
export async function askQuestion(params: {
  query: string;
  knowledge_base_id?: string;
  history_id?: string;
  use_history?: boolean;
  max_results?: number;
  similarity_threshold?: number;
}) {
  return request<AnswerResponse>('/api/v1/qa/ask', {
    method: 'POST',
    data: params,
  });
}

// 获取聊天历史列表
export async function getChatHistories(params?: { skip?: number; limit?: number }) {
  return request<ChatHistory[]>('/api/v1/qa/history', {
    method: 'GET',
    params,
  });
}

// 获取聊天历史详情
export const getChatHistory = (chatHistoryId: string) => {
  return request<{ data: ChatHistory }>({
    url: `/api/chat/history/${chatHistoryId}`,
    method: 'GET'
  });
};

// 删除聊天历史
export const deleteChatHistory = (chatHistoryId: string) => {
  return request<{ success: boolean }>({
    url: `/api/chat/history/${chatHistoryId}`,
    method: 'DELETE'
  });
};

/**
 * 向知识库提问
 */
export const askKnowledgeBase = (knowledgeBaseId: string, question: string) => {
  return request<AnswerResponse>({
    url: '/api/knowledge/ask',
    method: 'POST',
    data: {
      knowledge_base_id: knowledgeBaseId,
      query: question
    }
  });
};

/**
 * 创建聊天历史
 */
export const createChatHistory = (data: {
  knowledge_base_id: string;
  title: string;
  messages: ChatMessage[];
}) => {
  return request<{ data: ChatHistory }>({
    url: '/api/chat/history',
    method: 'POST',
    data
  });
};

/**
 * 更新聊天历史
 */
export const updateChatHistory = (
  chatHistoryId: string,
  data: {
    title?: string;
    messages?: ChatMessage[];
  }
) => {
  return request<{ data: ChatHistory }>({
    url: `/api/chat/history/${chatHistoryId}`,
    method: 'PUT',
    data
  });
};

/**
 * 获取聊天历史列表
 */
export const getChatHistoryList = () => {
  return request<{ data: ChatHistory[] }>({
    url: '/api/chat/history',
    method: 'GET'
  });
}; 