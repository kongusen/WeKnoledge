import { Message, ChatHistory } from '../services/chatService';

// 前端Message类型转为后端ChatMessage类型
export const convertMessageToBackend = (message: Message) => {
  return {
    role: message.type,
    content: message.content,
    timestamp: message.timestamp
  };
};

// 后端ChatMessage类型转为前端Message类型
export const convertMessageToFrontend = (message: any): Message => {
  return {
    id: Date.now().toString() + Math.random(),
    content: message.content,
    type: message.role as 'user' | 'assistant',
    timestamp: new Date(message.timestamp),
    references: []
  };
};

// 前端ChatHistory转为后端请求格式
export const convertChatHistoryToBackend = (history: ChatHistory) => {
  return {
    title: history.title,
    messages: history.messages.map(convertMessageToBackend)
  };
};

// 后端ChatHistory转为前端格式
export const convertChatHistoryToFrontend = (history: any): ChatHistory => {
  return {
    id: history.id,
    title: history.title || '新对话',
    updatedAt: new Date(history.updated_at),
    messages: Array.isArray(history.messages) 
      ? history.messages.map(convertMessageToFrontend) 
      : []
  };
};

// 格式化聊天历史标题
export const formatChatTitle = (messages: Message[], defaultTitle = '新对话'): string => {
  if (!messages || messages.length === 0) {
    return defaultTitle;
  }

  // 获取第一条用户消息作为标题
  const firstUserMessage = messages.find(msg => msg.type === 'user');
  if (firstUserMessage) {
    const title = firstUserMessage.content.substring(0, 30);
    return title.length < firstUserMessage.content.length 
      ? `${title}...` 
      : title;
  }

  return defaultTitle;
}; 