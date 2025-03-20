// 用户相关类型
export interface User {
  id: string;
  username: string;
  avatar: string;
  email: string;
  role: 'admin' | 'user';
  department?: string;
  createdAt: string;
  updatedAt: string;
}

// 知识库相关类型
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  author: User;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

// 搜索相关类型
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'knowledge' | 'document';
  highlight: string;
  score: number;
  createdAt: string;
}

// 历史记录相关类型
export interface HistoryItem {
  id: string;
  type: 'search' | 'view' | 'ai_question';
  content: string;
  result?: string;
  userId: string;
  createdAt: string;
}

// AI相关类型
export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  userId: string;
  createdAt: string;
  updatedAt: string;
} 