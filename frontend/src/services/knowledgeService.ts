import { get, post, put, del } from '@/utils/api';
import { getCurrentUser } from './authService';

// 文档类型定义
export enum DocumentType {
  PDF = 'pdf',
  WORD = 'word',
  EXCEL = 'excel',
  TEXT = 'text',
  OTHER = 'other'
}

// 权限级别
export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  NONE = 'none'
}

// 知识库项接口
export interface KnowledgeItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  type: 'personal' | 'organization';
  createdBy: string;
  permission: PermissionLevel;
  tags: string[];
}

// 文档接口
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  createdAt: string;
  updatedAt: string;
  knowledgeBaseId: string;
  createdBy: string;
  url: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  tags: string[];
}

// 组织成员接口
export interface Member {
  id: string;
  username: string;
  email: string;
  permission: PermissionLevel;
}

// 本地缓存功能
const PERSONAL_KNOWLEDGE_KEY = 'personalKnowledge';
const ORGANIZATION_KNOWLEDGE_KEY = 'organizationKnowledge';

// 保存个人知识库到本地
export const savePersonalKnowledgeToLocal = (items: KnowledgeItem[]): void => {
  localStorage.setItem(PERSONAL_KNOWLEDGE_KEY, JSON.stringify(items));
};

// 获取本地个人知识库
export const getPersonalKnowledgeFromLocal = (): KnowledgeItem[] => {
  try {
    const data = localStorage.getItem(PERSONAL_KNOWLEDGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('解析个人知识库数据出错:', error);
    return [];
  }
};

// 保存组织知识库到本地
export const saveOrganizationKnowledgeToLocal = (items: KnowledgeItem[]): void => {
  localStorage.setItem(ORGANIZATION_KNOWLEDGE_KEY, JSON.stringify(items));
};

// 获取本地组织知识库
export const getOrganizationKnowledgeFromLocal = (): KnowledgeItem[] => {
  try {
    const data = localStorage.getItem(ORGANIZATION_KNOWLEDGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('解析组织知识库数据出错:', error);
    return [];
  }
};

// 获取个人知识库列表
export const getPersonalKnowledgeBases = async (): Promise<KnowledgeItem[]> => {
  try {
    const response = await get<KnowledgeItem[]>('/knowledge/personal');
    savePersonalKnowledgeToLocal(response);
    return response;
  } catch (error) {
    console.error('获取个人知识库失败:', error);
    // 返回本地缓存数据
    return getPersonalKnowledgeFromLocal();
  }
};

// 获取组织知识库列表
export const getOrganizationKnowledgeBases = async (): Promise<KnowledgeItem[]> => {
  try {
    const response = await get<KnowledgeItem[]>('/knowledge/organization');
    saveOrganizationKnowledgeToLocal(response);
    return response;
  } catch (error) {
    console.error('获取组织知识库失败:', error);
    // 返回本地缓存数据
    return getOrganizationKnowledgeFromLocal();
  }
};

// 创建知识库
export const createKnowledgeBase = async (data: {
  name: string;
  description: string;
  type: 'personal' | 'organization';
  tags?: string[];
}): Promise<KnowledgeItem> => {
  return await post<KnowledgeItem>('/knowledge', data);
};

// 更新知识库
export const updateKnowledgeBase = async (
  id: string,
  data: Partial<KnowledgeItem>
): Promise<KnowledgeItem> => {
  return await put<KnowledgeItem>(`/knowledge/${id}`, data);
};

// 删除知识库
export const deleteKnowledgeBase = async (id: string): Promise<void> => {
  await del(`/knowledge/${id}`);
};

// 获取知识库中的文档
export const getDocuments = async (knowledgeBaseId: string): Promise<Document[]> => {
  return await get<Document[]>(`/knowledge/${knowledgeBaseId}/documents`);
};

// 上传文档到知识库
export const uploadDocument = async (
  knowledgeBaseId: string,
  file: File,
  tags?: string[]
): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);
  if (tags) {
    formData.append('tags', JSON.stringify(tags));
  }
  
  // 使用自定义配置调用post方法
  const url = `/knowledge/${knowledgeBaseId}/documents`;
  const headers = { 'Content-Type': 'multipart/form-data' };
  return await post<Document>(url, formData);
};

// 删除文档
export const deleteDocument = async (knowledgeBaseId: string, documentId: string): Promise<void> => {
  await del(`/knowledge/${knowledgeBaseId}/documents/${documentId}`);
};

// 获取知识库成员
export const getKnowledgeBaseMembers = async (knowledgeBaseId: string): Promise<Member[]> => {
  return await get<Member[]>(`/knowledge/${knowledgeBaseId}/members`);
};

// 添加成员到知识库
export const addMemberToKnowledgeBase = async (
  knowledgeBaseId: string,
  data: { userId: string; permission: PermissionLevel }
): Promise<Member> => {
  return await post<Member>(`/knowledge/${knowledgeBaseId}/members`, data);
};

// 更新成员权限
export const updateMemberPermission = async (
  knowledgeBaseId: string,
  userId: string,
  permission: PermissionLevel
): Promise<Member> => {
  return await put<Member>(`/knowledge/${knowledgeBaseId}/members/${userId}`, { permission });
};

// 移除成员
export const removeMember = async (knowledgeBaseId: string, userId: string): Promise<void> => {
  await del(`/knowledge/${knowledgeBaseId}/members/${userId}`);
};

// 检查用户对知识库的权限
export const checkPermission = (item: KnowledgeItem, requiredPermission: PermissionLevel): boolean => {
  const user = getCurrentUser();
  
  // 如果是个人知识库且是创建者，拥有全部权限
  if (item.type === 'personal' && user && item.createdBy === user.id) {
    return true;
  }
  
  // 如果是管理员，拥有全部权限
  if (user && user.is_superuser) {
    return true;
  }
  
  // 根据权限级别检查
  switch (requiredPermission) {
    case PermissionLevel.READ:
      return item.permission !== PermissionLevel.NONE;
    case PermissionLevel.WRITE:
      return [PermissionLevel.WRITE, PermissionLevel.ADMIN].includes(item.permission);
    case PermissionLevel.ADMIN:
      return item.permission === PermissionLevel.ADMIN;
    default:
      return false;
  }
}; 