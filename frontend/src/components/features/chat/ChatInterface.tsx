import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, Spin, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  initialMessages?: Message[];
  onSendMessage: (content: string) => Promise<void>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialMessages = [],
  onSendMessage,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      await onSendMessage(inputValue);
      setLoading(false);
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('消息发送失败，请重试');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">对话</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[80%] ${
                msg.isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar
                icon={msg.isUser ? <UserOutlined /> : <RobotOutlined />}
                className={`${
                  msg.isUser ? 'ml-2 bg-primary' : 'mr-2 bg-gray-200'
                }`}
              />
              <div
                className={`p-3 rounded-lg ${
                  msg.isUser
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-gray-100 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    msg.isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] flex-row">
              <Avatar icon={<RobotOutlined />} className="mr-2 bg-gray-200" />
              <div className="p-3 rounded-lg bg-gray-100 rounded-tl-none">
                <Spin size="small" className="mr-2" />
                <span className="text-gray-500 text-sm">思考中...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex">
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="flex-1 mr-2"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 