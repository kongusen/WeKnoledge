import React, { useState, useEffect } from 'react';
import { message, Modal, Form, Input, Button, Select, Spin, Table, Tag } from 'antd';
import { TagsOutlined, UserAddOutlined } from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { 
  KnowledgeItem, 
  PermissionLevel,
  getOrganizationKnowledgeBases, 
  createKnowledgeBase, 
  updateKnowledgeBase,
  deleteKnowledgeBase,
  Member,
  getKnowledgeBaseMembers,
  addMemberToKnowledgeBase,
  updateMemberPermission,
  removeMember
} from '@/services/knowledgeService';
import KnowledgeList from '@/components/features/knowledge/KnowledgeList';

const { TextArea } = Input;
const { Option } = Select;

export default function OrganizationKnowledge() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('创建组织知识库');
  const [currentItem, setCurrentItem] = useState<KnowledgeItem | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [form] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [tagInputValue, setTagInputValue] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // 加载组织知识库列表
  const loadKnowledgeBases = async () => {
    setLoading(true);
    try {
      const data = await getOrganizationKnowledgeBases();
      setKnowledgeBases(data);
    } catch (error) {
      message.error('获取组织知识库列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  // 加载知识库成员
  const loadMembers = async (knowledgeBaseId: string) => {
    setLoadingMembers(true);
    try {
      const data = await getKnowledgeBaseMembers(knowledgeBaseId);
      setMembers(data);
    } catch (error) {
      message.error('获取成员列表失败');
      console.error(error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // 打开创建知识库弹窗
  const handleAddNew = () => {
    setModalTitle('创建组织知识库');
    setCurrentItem(null);
    setTags([]);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑知识库弹窗
  const handleEdit = (item: KnowledgeItem) => {
    setModalTitle('编辑组织知识库');
    setCurrentItem(item);
    setTags(item.tags);
    form.setFieldsValue({
      name: item.name,
      description: item.description,
    });
    setModalVisible(true);
  };

  // 处理删除知识库
  const handleDelete = async (item: KnowledgeItem) => {
    try {
      await deleteKnowledgeBase(item.id);
      message.success('删除成功');
      loadKnowledgeBases();
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // 打开成员管理弹窗
  const handleManageMembers = (item: KnowledgeItem) => {
    setCurrentItem(item);
    loadMembers(item.id);
    setMembersModalVisible(true);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const data = {
        ...values,
        type: 'organization' as const,
        tags: tags,
      };
      
      if (currentItem) {
        // 更新
        await updateKnowledgeBase(currentItem.id, data);
        message.success('知识库更新成功');
      } else {
        // 创建
        await createKnowledgeBase(data);
        message.success('知识库创建成功');
      }
      
      setModalVisible(false);
      loadKnowledgeBases();
    } catch (error) {
      console.error('表单提交失败:', error);
    }
  };

  // 添加标签
  const handleAddTag = () => {
    if (!tagInputValue) return;
    
    const value = tagInputValue.trim();
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
    }
    setTagInputValue('');
  };

  // 删除标签
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 打开添加成员弹窗
  const handleAddMemberClick = () => {
    memberForm.resetFields();
    setAddMemberModalVisible(true);
  };

  // 添加新成员
  const handleAddMember = async () => {
    try {
      const values = await memberForm.validateFields();
      
      if (currentItem) {
        await addMemberToKnowledgeBase(currentItem.id, {
          userId: values.userId,
          permission: values.permission,
        });
        
        message.success('成员添加成功');
        setAddMemberModalVisible(false);
        loadMembers(currentItem.id);
      }
    } catch (error) {
      console.error('添加成员失败:', error);
    }
  };

  // 更新成员权限
  const handleUpdatePermission = async (memberId: string, permission: PermissionLevel) => {
    if (!currentItem) return;
    
    try {
      await updateMemberPermission(currentItem.id, memberId, permission);
      message.success('权限更新成功');
      loadMembers(currentItem.id);
    } catch (error) {
      message.error('权限更新失败');
      console.error(error);
    }
  };

  // 移除成员
  const handleRemoveMember = async (memberId: string) => {
    if (!currentItem) return;
    
    try {
      await removeMember(currentItem.id, memberId);
      message.success('成员移除成功');
      loadMembers(currentItem.id);
    } catch (error) {
      message.error('成员移除失败');
      console.error(error);
    }
  };

  // 成员表格列配置
  const memberColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '权限',
      dataIndex: 'permission',
      key: 'permission',
      render: (permission: PermissionLevel, record: Member) => {
        const colors = {
          [PermissionLevel.READ]: 'blue',
          [PermissionLevel.WRITE]: 'green',
          [PermissionLevel.ADMIN]: 'purple',
          [PermissionLevel.NONE]: 'default',
        };
        return (
          <Select
            value={permission}
            style={{ width: 100 }}
            onChange={(value) => handleUpdatePermission(record.id, value)}
          >
            <Option value={PermissionLevel.READ}>只读</Option>
            <Option value={PermissionLevel.WRITE}>可编辑</Option>
            <Option value={PermissionLevel.ADMIN}>管理员</Option>
          </Select>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Member) => (
        <Button 
          danger 
          type="link" 
          onClick={() => handleRemoveMember(record.id)}
        >
          移除
        </Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">组织知识库</h1>
        
        {loading && knowledgeBases.length === 0 ? (
          <div className="flex justify-center py-20">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : (
          <KnowledgeList
            items={knowledgeBases}
            loading={loading}
            type="organization"
            onAddNew={handleAddNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onManageMembers={handleManageMembers}
          />
        )}
        
        {/* 创建/编辑知识库弹窗 */}
        <Modal
          title={modalTitle}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setModalVisible(false)}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={handleSubmit}>
              确定
            </Button>,
          ]}
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label="知识库名称"
              rules={[{ required: true, message: '请输入知识库名称' }]}
            >
              <Input placeholder="请输入知识库名称" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="知识库描述"
              rules={[{ required: true, message: '请输入知识库描述' }]}
            >
              <TextArea rows={4} placeholder="请输入知识库描述" />
            </Form.Item>
            
            <div className="mb-4">
              <p className="mb-1">标签</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map(tag => (
                  <div key={tag} className="flex items-center bg-blue-50 px-2 py-1 rounded">
                    <span>{tag}</span>
                    <Button 
                      type="text" 
                      size="small" 
                      className="ml-1 text-gray-500" 
                      onClick={() => handleRemoveTag(tag)}
                    >
                      x
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <Input
                  placeholder="添加标签"
                  value={tagInputValue}
                  onChange={(e) => setTagInputValue(e.target.value)}
                  onPressEnter={handleAddTag}
                />
                <Button 
                  icon={<TagsOutlined />} 
                  onClick={handleAddTag}
                  className="ml-2"
                >
                  添加
                </Button>
              </div>
            </div>
          </Form>
        </Modal>
        
        {/* 成员管理弹窗 */}
        <Modal
          title={`成员管理 - ${currentItem?.name}`}
          open={membersModalVisible}
          onCancel={() => setMembersModalVisible(false)}
          footer={[
            <Button key="add" type="primary" icon={<UserAddOutlined />} onClick={handleAddMemberClick}>
              添加成员
            </Button>,
            <Button key="close" onClick={() => setMembersModalVisible(false)}>
              关闭
            </Button>,
          ]}
          width={700}
        >
          <Table
            columns={memberColumns}
            dataSource={members}
            rowKey="id"
            loading={loadingMembers}
            pagination={false}
          />
        </Modal>
        
        {/* 添加成员弹窗 */}
        <Modal
          title="添加成员"
          open={addMemberModalVisible}
          onCancel={() => setAddMemberModalVisible(false)}
          onOk={handleAddMember}
          okText="添加"
          cancelText="取消"
        >
          <Form
            form={memberForm}
            layout="vertical"
          >
            <Form.Item
              name="userId"
              label="用户ID"
              rules={[{ required: true, message: '请输入用户ID' }]}
            >
              <Input placeholder="请输入用户ID" />
            </Form.Item>
            
            <Form.Item
              name="permission"
              label="权限"
              initialValue={PermissionLevel.READ}
              rules={[{ required: true, message: '请选择权限' }]}
            >
              <Select>
                <Option value={PermissionLevel.READ}>只读</Option>
                <Option value={PermissionLevel.WRITE}>可编辑</Option>
                <Option value={PermissionLevel.ADMIN}>管理员</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
} 