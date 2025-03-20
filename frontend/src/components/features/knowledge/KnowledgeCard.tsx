import React from 'react';
import { Card, Tag, Space, Button, Typography, Tooltip, Badge } from 'antd';
import { 
  BookOutlined, 
  FileTextOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { KnowledgeItem, PermissionLevel, checkPermission } from '@/services/knowledgeService';

const { Paragraph, Text } = Typography;

interface KnowledgeCardProps {
  item: KnowledgeItem;
  onView: (item: KnowledgeItem) => void;
  onEdit?: (item: KnowledgeItem) => void;
  onDelete?: (item: KnowledgeItem) => void;
  onManageMembers?: (item: KnowledgeItem) => void;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  item,
  onView,
  onEdit,
  onDelete,
  onManageMembers,
}) => {
  // 权限检查
  const canWrite = checkPermission(item, PermissionLevel.WRITE);
  const canAdmin = checkPermission(item, PermissionLevel.ADMIN);
  
  // 获取权限标签
  const renderPermissionTag = () => {
    switch (item.permission) {
      case PermissionLevel.READ:
        return <Tag color="blue" icon={<EyeOutlined />}>只读</Tag>;
      case PermissionLevel.WRITE:
        return <Tag color="green" icon={<EditOutlined />}>可编辑</Tag>;
      case PermissionLevel.ADMIN:
        return <Tag color="purple" icon={<LockOutlined />}>管理员</Tag>;
      default:
        return null;
    }
  };

  return (
    <Card
      hoverable
      className="w-full"
      actions={[
        <Tooltip title="查看" key="view">
          <Button type="text" icon={<EyeOutlined />} onClick={() => onView(item)} />
        </Tooltip>,
        canWrite ? (
          <Tooltip title="编辑" key="edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => onEdit && onEdit(item)} 
            />
          </Tooltip>
        ) : (
          <Button type="text" icon={<EditOutlined />} disabled />
        ),
        item.type === 'organization' && (
          canAdmin ? (
            <Tooltip title="成员管理" key="members">
              <Button 
                type="text" 
                icon={<TeamOutlined />} 
                onClick={() => onManageMembers && onManageMembers(item)} 
              />
            </Tooltip>
          ) : (
            <Button type="text" icon={<TeamOutlined />} disabled />
          )
        ),
        canAdmin ? (
          <Tooltip title="删除" key="delete">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => onDelete && onDelete(item)} 
            />
          </Tooltip>
        ) : (
          <Button type="text" danger icon={<DeleteOutlined />} disabled />
        ),
      ]}
    >
      <Card.Meta
        avatar={item.type === 'personal' ? <UserOutlined /> : <TeamOutlined />}
        title={
          <Space>
            {item.name}
            {renderPermissionTag()}
          </Space>
        }
        description={
          <>
            <Paragraph ellipsis={{ rows: 2 }}>{item.description}</Paragraph>
            <Space className="mt-2">
              <Badge count={item.documentCount} overflowCount={999} showZero>
                <Text type="secondary"><FileTextOutlined /> 文档</Text>
              </Badge>
              <Text type="secondary">创建于 {new Date(item.createdAt).toLocaleDateString()}</Text>
            </Space>
            <div className="mt-2">
              {item.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </>
        }
      />
    </Card>
  );
};

export default KnowledgeCard; 