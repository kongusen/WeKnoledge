import React from 'react';
import { Card, Typography, Tag, Space, Tooltip } from 'antd';
import { 
  FileTextOutlined, 
  FileWordOutlined, 
  FilePdfOutlined, 
  FileExcelOutlined, 
  FileImageOutlined, 
  FileUnknownOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface KnowledgeItemProps {
  id: string;
  title: string;
  content: string;
  summary?: string;
  type: 'personal' | 'organization';
  fileType?: string;
  tags?: string[];
  author?: string;
  createdAt: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// 文件类型图标映射
const fileIconMap: Record<string, React.ReactNode> = {
  pdf: <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />,
  doc: <FileWordOutlined style={{ fontSize: 24, color: '#2f54eb' }} />,
  docx: <FileWordOutlined style={{ fontSize: 24, color: '#2f54eb' }} />,
  xls: <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
  xlsx: <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
  txt: <FileTextOutlined style={{ fontSize: 24, color: '#faad14' }} />,
  jpg: <FileImageOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
  png: <FileImageOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
  gif: <FileImageOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
};

// 获取文件图标
const getFileIcon = (fileType?: string) => {
  if (!fileType) return <FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />;
  return fileIconMap[fileType.toLowerCase()] || <FileUnknownOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />;
};

const KnowledgeItem: React.FC<KnowledgeItemProps> = ({
  id,
  title,
  content,
  summary,
  type,
  fileType,
  tags = [],
  author,
  createdAt,
  onView,
  onEdit,
  onDelete
}) => {
  return (
    <Card
      hoverable
      className="mb-4"
    >
      <div className="flex">
        <div className="flex-shrink-0 mr-4">
          {getFileIcon(fileType)}
        </div>
        <div className="flex-grow">
          <div className="flex justify-between">
            <Text strong className="text-lg">{title}</Text>
            <Space>
              {type === 'personal' ? (
                <Tag color="blue">个人</Tag>
              ) : (
                <Tag color="green">组织</Tag>
              )}
              {tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </div>
          
          {/* 显示摘要，如果有的话 */}
          {summary ? (
            <Paragraph className="my-2 text-gray-600" ellipsis={{ rows: 2 }}>
              {summary}
            </Paragraph>
          ) : (
            <Paragraph className="my-2 text-gray-600" ellipsis={{ rows: 2 }}>
              {content.length > 150 ? content.substring(0, 150) + '...' : content}
            </Paragraph>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <Space size="small" className="text-gray-500">
              {author && <Text><UserOutlined /> {author}</Text>}
              <Text><ClockCircleOutlined /> {createdAt}</Text>
            </Space>
            
            <Space>
              <Tooltip title="查看">
                <EyeOutlined className="text-blue-500 cursor-pointer" onClick={() => onView && onView(id)} />
              </Tooltip>
              {onEdit && (
                <Tooltip title="编辑">
                  <EditOutlined className="text-orange-500 cursor-pointer" onClick={() => onEdit(id)} />
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="删除">
                  <DeleteOutlined className="text-red-500 cursor-pointer" onClick={() => onDelete(id)} />
                </Tooltip>
              )}
            </Space>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default KnowledgeItem; 