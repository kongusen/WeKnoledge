import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Button, 
  Upload, 
  List, 
  Tag, 
  Space, 
  message, 
  Modal, 
  Input, 
  Spin,
  Typography,
  Breadcrumb,
  Card,
  Divider,
  Empty
} from 'antd';
import { 
  UploadOutlined, 
  FileTextOutlined, 
  FileExcelOutlined, 
  FilePdfOutlined,
  FileWordOutlined, 
  FileUnknownOutlined, 
  DeleteOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  TagsOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { 
  KnowledgeItem, 
  Document, 
  DocumentType, 
  PermissionLevel, 
  getDocuments, 
  uploadDocument, 
  deleteDocument,
  checkPermission
} from '@/services/knowledgeService';
import Link from 'next/link';

const { Search } = Input;
const { Title, Text } = Typography;

export default function KnowledgeDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  
  // 加载知识库详情和文档列表
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      setLoading(true);
      try {
        // 模拟获取知识库详情，实际项目中应该从API获取
        // 这里我们手动构造一个样例数据
        const kbData: KnowledgeItem = {
          id: id as string,
          name: `知识库 ${id}`,
          description: '这是一个知识库示例描述',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documentCount: 0,
          type: 'personal',
          createdBy: 'user123',
          permission: PermissionLevel.ADMIN,
          tags: ['示例', '文档'],
        };
        
        setKnowledgeBase(kbData);
        
        // 确定用户权限
        const hasWritePermission = checkPermission(kbData, PermissionLevel.WRITE);
        setCanWrite(hasWritePermission);
        
        // 获取文档列表
        const docs = await getDocuments(id as string);
        setDocuments(docs);
        setFilteredDocuments(docs);
      } catch (error) {
        message.error('加载知识库数据失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id]);
  
  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    
    if (!value.trim()) {
      setFilteredDocuments(documents);
      return;
    }
    
    const filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(value.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(value.toLowerCase()))
    );
    
    setFilteredDocuments(filtered);
  };
  
  // 处理上传
  const handleUpload = async (file: File) => {
    if (!id || !knowledgeBase) return;
    
    setUploading(true);
    
    try {
      await uploadDocument(id as string, file);
      message.success('文档上传成功');
      
      // 重新加载文档列表
      const docs = await getDocuments(id as string);
      setDocuments(docs);
      setFilteredDocuments(docs);
    } catch (error) {
      message.error('文档上传失败');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };
  
  // 处理删除文档
  const handleDeleteDocument = (document: Document) => {
    setCurrentDocument(document);
    setDeleteModalVisible(true);
  };
  
  // 确认删除文档
  const confirmDeleteDocument = async () => {
    if (!id || !currentDocument) return;
    
    try {
      await deleteDocument(id as string, currentDocument.id);
      message.success('文档删除成功');
      
      // 更新文档列表
      setDocuments(documents.filter(doc => doc.id !== currentDocument.id));
      setFilteredDocuments(filteredDocuments.filter(doc => doc.id !== currentDocument.id));
      
      setDeleteModalVisible(false);
      setCurrentDocument(null);
    } catch (error) {
      message.error('文档删除失败');
      console.error(error);
    }
  };
  
  // 获取文档图标
  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case DocumentType.PDF:
        return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
      case DocumentType.WORD:
        return <FileWordOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
      case DocumentType.EXCEL:
        return <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
      case DocumentType.TEXT:
        return <FileTextOutlined style={{ fontSize: 24, color: '#faad14' }} />;
      default:
        return <FileUnknownOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />;
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <Spin size="large" tip="加载中..." />
        </div>
      </MainLayout>
    );
  }
  
  if (!knowledgeBase) {
    return (
      <MainLayout>
        <div className="py-10">
          <Empty description="知识库不存在或已被删除" />
          <div className="text-center mt-4">
            <Button type="primary" onClick={() => router.push('/knowledge')}>
              返回知识库列表
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div>
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item>
            <Link href="/knowledge">知识库</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link href={`/knowledge/${knowledgeBase.type === 'personal' ? 'personal' : 'organization'}`}>
              {knowledgeBase.type === 'personal' ? '个人知识库' : '组织知识库'}
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{knowledgeBase.name}</Breadcrumb.Item>
        </Breadcrumb>
        
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="flex items-center">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => router.back()}
              className="mr-4"
            >
              返回
            </Button>
            <Title level={3} className="m-0 flex items-center">
              {knowledgeBase.type === 'personal' ? <UserOutlined className="mr-2" /> : <TeamOutlined className="mr-2" />}
              {knowledgeBase.name}
            </Title>
          </div>
          
          {canWrite && (
            <Upload
              beforeUpload={(file) => {
                handleUpload(file);
                return false;
              }}
              showUploadList={false}
            >
              <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
                上传文档
              </Button>
            </Upload>
          )}
        </div>
        
        <Card className="mb-6">
          <div>
            <Text type="secondary">描述:</Text>
            <p>{knowledgeBase.description}</p>
          </div>
          <div className="mt-2">
            <Text type="secondary">标签:</Text>
            <div className="mt-1">
              {knowledgeBase.tags.map(tag => (
                <Tag key={tag} icon={<TagsOutlined />}>{tag}</Tag>
              ))}
            </div>
          </div>
          <div className="mt-2">
            <Text type="secondary">创建时间:</Text>
            <p>{new Date(knowledgeBase.createdAt).toLocaleString()}</p>
          </div>
        </Card>
        
        <div className="mb-4">
          <Search
            placeholder="搜索文档"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ maxWidth: 400 }}
          />
        </div>
        
        <Divider orientation="left">文档列表 ({filteredDocuments.length})</Divider>
        
        {filteredDocuments.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={filteredDocuments}
            renderItem={item => (
              <List.Item
                actions={[
                  canWrite && (
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleDeleteDocument(item)}
                    >
                      删除
                    </Button>
                  )
                ]}
              >
                <List.Item.Meta
                  avatar={getDocumentIcon(item.type)}
                  title={<a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">上传时间: {new Date(item.createdAt).toLocaleString()}</Text>
                      <Text type="secondary">大小: {(item.size / 1024 / 1024).toFixed(2)} MB</Text>
                      <div>
                        {item.tags.map(tag => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty 
            description={
              searchText 
                ? '没有找到匹配的文档' 
                : '知识库中还没有文档'
            }
          />
        )}
        
        <Modal
          title="确认删除"
          open={deleteModalVisible}
          onCancel={() => setDeleteModalVisible(false)}
          onOk={confirmDeleteDocument}
          okText="确认删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <p>确定要删除文档 "{currentDocument?.name}" 吗？</p>
          <p>此操作不可恢复。</p>
        </Modal>
      </div>
    </MainLayout>
  );
} 