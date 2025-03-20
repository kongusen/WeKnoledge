import React, { useState } from 'react';
import { List, Input, Button, Space, Empty, Modal, Form, Select, Tag, message } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { KnowledgeItem, PermissionLevel } from '@/services/knowledgeService';
import KnowledgeCard from './KnowledgeCard';
import { useRouter } from 'next/router';

const { Search } = Input;
const { Option } = Select;

interface KnowledgeListProps {
  items: KnowledgeItem[];
  loading: boolean;
  type: 'personal' | 'organization';
  onAddNew: () => void;
  onEdit: (item: KnowledgeItem) => void;
  onDelete: (item: KnowledgeItem) => void;
  onManageMembers?: (item: KnowledgeItem) => void;
}

const KnowledgeList: React.FC<KnowledgeListProps> = ({
  items,
  loading,
  type,
  onAddNew,
  onEdit,
  onDelete,
  onManageMembers,
}) => {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [filterPermission, setFilterPermission] = useState<PermissionLevel | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string>('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<KnowledgeItem | null>(null);

  // 过滤知识库列表
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchText || 
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesPermission = filterPermission === 'all' || item.permission === filterPermission;
    
    const matchesTag = !filterTag || item.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()));
    
    return matchesSearch && matchesPermission && matchesTag;
  });

  // 查看知识库
  const handleView = (item: KnowledgeItem) => {
    router.push(`/knowledge/${item.id}`);
  };

  // 编辑知识库
  const handleEdit = (item: KnowledgeItem) => {
    onEdit(item);
  };

  // 删除知识库
  const handleDelete = (item: KnowledgeItem) => {
    setCurrentItem(item);
    setDeleteModalVisible(true);
  };

  // 确认删除
  const confirmDelete = () => {
    if (currentItem) {
      onDelete(currentItem);
      setDeleteModalVisible(false);
      setCurrentItem(null);
    }
  };

  // 管理成员
  const handleManageMembers = (item: KnowledgeItem) => {
    if (onManageMembers) {
      onManageMembers(item);
    }
  };

  // 渲染头部过滤和搜索栏
  const renderHeader = () => (
    <div className="mb-4">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="text-xl font-bold m-0">
          {type === 'personal' ? '个人知识库' : '组织知识库'}
        </h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={onAddNew}
        >
          创建知识库
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Search
          placeholder="搜索知识库名称或描述"
          allowClear
          enterButton
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        
        <Select
          placeholder="权限筛选"
          style={{ width: 150 }}
          value={filterPermission}
          onChange={setFilterPermission}
        >
          <Option value="all">全部权限</Option>
          <Option value={PermissionLevel.READ}>只读</Option>
          <Option value={PermissionLevel.WRITE}>可编辑</Option>
          <Option value={PermissionLevel.ADMIN}>管理员</Option>
        </Select>
        
        <Search
          placeholder="标签筛选"
          allowClear
          enterButton={<FilterOutlined />}
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          style={{ width: 200 }}
        />
      </div>
    </div>
  );

  return (
    <div>
      {renderHeader()}
      
      {filteredItems.length > 0 ? (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
          dataSource={filteredItems}
          loading={loading}
          pagination={{
            pageSize: 9,
            hideOnSinglePage: true,
          }}
          renderItem={(item) => (
            <List.Item>
              <KnowledgeCard
                item={item}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onManageMembers={type === 'organization' ? handleManageMembers : undefined}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description={
            <span>
              {searchText || filterPermission !== 'all' || filterTag
                ? '没有找到符合条件的知识库'
                : `还没有${type === 'personal' ? '个人' : '组织'}知识库，点击"创建知识库"按钮开始创建`}
            </span>
          }
        />
      )}
      
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除知识库 "{currentItem?.name}" 吗？</p>
        <p>此操作将删除知识库中的所有文档，且无法恢复。</p>
      </Modal>
    </div>
  );
};

export default KnowledgeList; 