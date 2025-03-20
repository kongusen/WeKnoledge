import React, { useState, useEffect } from 'react';
import { message, Modal, Form, Input, Button, Select, Spin } from 'antd';
import { TagsOutlined } from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { 
  KnowledgeItem, 
  PermissionLevel,
  getPersonalKnowledgeBases, 
  createKnowledgeBase, 
  updateKnowledgeBase,
  deleteKnowledgeBase 
} from '@/services/knowledgeService';
import KnowledgeList from '@/components/features/knowledge/KnowledgeList';

const { TextArea } = Input;
const { Option } = Select;

export default function PersonalKnowledge() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('创建个人知识库');
  const [currentItem, setCurrentItem] = useState<KnowledgeItem | null>(null);
  const [form] = Form.useForm();
  const [tagInputValue, setTagInputValue] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // 加载个人知识库列表
  const loadKnowledgeBases = async () => {
    setLoading(true);
    try {
      const data = await getPersonalKnowledgeBases();
      setKnowledgeBases(data);
    } catch (error) {
      message.error('获取个人知识库列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  // 打开创建知识库弹窗
  const handleAddNew = () => {
    setModalTitle('创建个人知识库');
    setCurrentItem(null);
    setTags([]);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑知识库弹窗
  const handleEdit = (item: KnowledgeItem) => {
    setModalTitle('编辑个人知识库');
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

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const data = {
        ...values,
        type: 'personal' as const,
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

  return (
    <MainLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">个人知识库</h1>
        
        {loading && knowledgeBases.length === 0 ? (
          <div className="flex justify-center py-20">
            <Spin size="large" tip="加载中..." />
          </div>
        ) : (
          <KnowledgeList
            items={knowledgeBases}
            loading={loading}
            type="personal"
            onAddNew={handleAddNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        
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
      </div>
    </MainLayout>
  );
} 