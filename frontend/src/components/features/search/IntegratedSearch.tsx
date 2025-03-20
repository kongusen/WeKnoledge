import React, { useState, useEffect } from 'react';
import { Input, Button, Upload, Tooltip, message, Modal, Radio } from 'antd';
import { 
  SearchOutlined, 
  FileAddOutlined, 
  PictureOutlined, 
  SendOutlined, 
  FileTextOutlined, 
  EditOutlined,
  InboxOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileTextTwoTone,
  CopyOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  CloseOutlined,
  SwapOutlined,
  FileOutlined,
  CloseCircleOutlined,
  PaperClipOutlined,
  HighlightOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import DocumentUploadPanel from './DocumentUploadPanel';

type SearchMode = 'global' | 'document' | 'writing';
type WritingType = 'format' | 'proposal';

interface IntegratedSearchProps {
  onSearch: (query: string, files?: UploadFile[], mode?: SearchMode) => void;
}

const IntegratedSearch: React.FC<IntegratedSearchProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<SearchMode>('global');
  const [panelVisible, setPanelVisible] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [writingType, setWritingType] = useState<WritingType>('format');
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  // 切换模式时更新占位符文本
  const getPlaceholder = () => {
    switch (activeMode) {
      case 'document':
        return fileList.length > 0 ? '询问关于该文档的任何问题' : '点击上传文档开始解读';
      case 'writing':
        return fileList.length > 0 ? '描述您希望生成的内容格式和要点...' : '请先上传参考文档...';
      default:
        return '向知识库提问...';
    }
  };

  // 智能写作模式下提供的写作格式选项
  const writingFormats = [
    { label: '格式仿写', value: 'format' },
    { label: '公文写作', value: 'proposal' },
  ];

  // 更改模式时的处理逻辑 
  useEffect(() => {
    // 切换到非文档模式时清空文件列表
    if (activeMode !== 'document') {
      setFileList([]);
    }
    // 切换到智能写作模式时重置状态
    if (activeMode === 'writing') {
      setSelectedText('');
      setWritingType('format');
      setPreviewContent(null);
    }
  }, [activeMode]);

  const handleSearch = () => {
    if (!query.trim() && fileList.length === 0) {
      message.warning('请输入问题或上传文件');
      return;
    }
    
    if (activeMode === 'document' && fileList.length === 0) {
      message.warning('文档解读需要上传文件');
      return;
    }
    
    if (activeMode === 'writing') {
      if (fileList.length === 0) {
        message.warning('智能写作需要上传参考文档');
        return;
      }
      
      if (writingType === 'format' && !selectedText) {
        message.warning('格式仿写需要选择文本段落');
        return;
      }
    }
    
    setLoading(true);
    
    // 模拟请求
    setTimeout(() => {
      onSearch(query, fileList, activeMode);
      setLoading(false);
      
      // 模拟智能写作的预览内容
      if (activeMode === 'writing') {
        const previewText = writingType === 'format' 
          ? `根据您选择的段落格式和提供的要求，生成的内容：\n\n这是按照您要求生成的${query}内容，格式与选定段落相似。`
          : `根据您的方案要求，生成的${query}方案内容如下：\n\n1. 方案背景\n2. 实施步骤\n3. 预期效果`;
        
        setPreviewContent(previewText);
      }
    }, 500);
  };

  const handleUploadChange: UploadProps['onChange'] = ({ fileList }) => {
    setFileList(fileList);
  };

  // 根据模式获取接受的文件类型
  const getAcceptTypes = () => {
    switch (activeMode) {
      case 'document':
        return '.doc,.docx,.pdf,.txt';
      case 'writing':
        return '.doc,.docx,.pdf,.txt,.xlsx,.pptx';
      default:
        return '.doc,.docx,.pdf,.png,.jpg,.jpeg';
    }
  };
  
  // 获取文件图标
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) {
      return <FilePdfOutlined style={{ color: '#f5222d', fontSize: 24 }} />;
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return <FileWordOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
    } else {
      return <FileTextTwoTone style={{ fontSize: 24 }} />;
    }
  };
  
  // 根据模式获取上传按钮提示文本
  const getUploadTooltip = () => {
    switch (activeMode) {
      case 'document':
        return '管理上传的文档';
      case 'writing':
        return '上传参考文档';
      default:
        return '上传文档';
    }
  };

  // 处理文本选择
  const handleTextSelection = (text: string) => {
    setSelectedText(text);
  };

  // 功能提示文本
  const getWritingHelpText = () => {
    if (writingType === 'format') {
      return fileList.length === 0 
        ? '可添加参考文档进行格式仿写' 
        : selectedText
          ? '已选择参考文本段落'
          : '已添加参考文档';
    } else {
      return '描述您需要的公文内容';
    }
  };

  // 显示文档上传模态框
  const [docModalVisible, setDocModalVisible] = useState(false);
  
  // 打开文档模态框
  const openDocumentModal = () => {
    setDocModalVisible(true);
  };
  
  // 关闭文档模态框
  const closeDocumentModal = () => {
    setDocModalVisible(false);
  };

  return (
    <div className="w-full max-w-3xl">
      {/* 功能切换按钮组 */}
      <div className="flex justify-center mb-5">
        <div className="function-toggle">
          <button
            className={activeMode === 'global' ? 'active' : ''}
            onClick={() => setActiveMode('global')}
          >
            <SearchOutlined className="mr-1" /> 全局提问
          </button>
          <button
            className={activeMode === 'document' ? 'active' : ''}
            onClick={() => setActiveMode('document')}
          >
            <FileTextOutlined className="mr-1" /> 文档解读
          </button>
          <button
            className={activeMode === 'writing' ? 'active' : ''}
            onClick={() => setActiveMode('writing')}
          >
            <EditOutlined className="mr-1" /> 智能写作
          </button>
        </div>
      </div>
      
      <div className="search-input-wrapper">
        <div className="flex flex-col space-y-3">
          {/* 全局提问模式下的搜索框 */}
          {activeMode === 'global' && (
            <div className="flex items-center rounded-[20px] border border-gray-300 bg-white px-5 py-3 shadow-sm focus-within:border-primary focus-within:shadow-md">
              {/* 模式指示图标 */}
              <SearchOutlined className="text-lg text-gray-400 mr-3" />
              
              <Input
                placeholder={getPlaceholder()}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onPressEnter={handleSearch}
                bordered={false}
                className="flex-1"
                size="large"
              />
              
              <Tooltip title={getUploadTooltip()}>
                <Upload
                  accept={getAcceptTypes()}
                  fileList={fileList}
                  onChange={handleUploadChange}
                  maxCount={3}
                  multiple
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const acceptTypesStr = getAcceptTypes().replace(/\./g, '').replace(/,/g, '|');
                    const fileRegex = new RegExp(`\\.(${acceptTypesStr})$`, 'i');
                    const isValidFormat = fileRegex.test(file.name);
                    if (!isValidFormat) {
                      message.error(`仅支持 ${getAcceptTypes()} 格式`);
                    }
                    return isValidFormat || Upload.LIST_IGNORE;
                  }}
                >
                  <Button 
                    type="text" 
                    icon={<FileAddOutlined />} 
                    className="text-gray-500 hover:text-primary mr-1"
                  />
                </Upload>
              </Tooltip>
              
              <Tooltip title="上传截图">
                <Upload
                  accept=".png,.jpg,.jpeg"
                  onChange={handleUploadChange}
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const isImage = /\.(png|jpg|jpeg)$/i.test(file.name);
                    if (!isImage) {
                      message.error('仅支持 PNG、JPG 格式');
                    }
                    return isImage || Upload.LIST_IGNORE;
                  }}
                >
                  <Button 
                    type="text" 
                    icon={<PictureOutlined />} 
                    className="text-gray-500 hover:text-primary mr-2"
                  />
                </Upload>
              </Tooltip>
              
              <Button
                type="primary"
                shape="circle"
                icon={<SendOutlined />}
                onClick={handleSearch}
                loading={loading}
                className="flex items-center justify-center"
              />
            </div>
          )}
          
          {/* 文档解读模式下的界面 */}
          {activeMode === 'document' && (
            <>
              {fileList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-300 shadow-sm">
                  <div className="mb-4">
                    <InboxOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />
                  </div>
                  <div className="text-lg mb-2">将文档拖动至此或选择文档</div>
                  <div className="text-sm text-gray-500 mb-6">
                    支持PDF、Word、Markdown等，文档需小于100MB，低于500页
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      icon={<DatabaseOutlined />}
                      size="large"
                      className="flex items-center"
                    >
                      知识库文件
                    </Button>
                    <Upload
                      accept=".pdf,.doc,.docx,.md,.txt"
                      fileList={[]}
                      onChange={handleUploadChange}
                      showUploadList={false}
                      beforeUpload={(file) => {
                        const isValidFormat = /\.(pdf|doc|docx|md|txt)$/i.test(file.name);
                        if (!isValidFormat) {
                          message.error('文件格式不支持');
                          return Upload.LIST_IGNORE;
                        }
                        const isLt100M = file.size / 1024 / 1024 < 100;
                        if (!isLt100M) {
                          message.error('文件必须小于100MB');
                          return Upload.LIST_IGNORE;
                        }
                        return false;
                      }}
                    >
                      <Button 
                        icon={<FolderOpenOutlined />}
                        size="large"
                        className="flex items-center"
                      >
                        本地文件
                      </Button>
                    </Upload>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col rounded-lg border border-gray-300 shadow-sm bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center">
                      {getFileIcon(fileList[0].name)}
                      <span className="ml-2 font-medium">{fileList[0].name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Upload
                        accept=".pdf,.doc,.docx,.md,.txt"
                        fileList={[]}
                        onChange={handleUploadChange}
                        showUploadList={false}
                        beforeUpload={(file) => {
                          const isValidFormat = /\.(pdf|doc|docx|md|txt)$/i.test(file.name);
                          if (!isValidFormat) {
                            message.error('文件格式不支持');
                            return Upload.LIST_IGNORE;
                          }
                          return false;
                        }}
                      >
                        <Button 
                          type="text" 
                          size="small"
                          icon={<SwapOutlined />}
                        >
                          替换
                        </Button>
                      </Upload>
                      <Button 
                        type="text" 
                        icon={<CloseOutlined />} 
                        size="small"
                        onClick={() => setFileList([])}
                      />
                    </div>
                  </div>
                  <div className="h-56 bg-gray-50 p-4 overflow-auto">
                    <div className="text-center text-gray-500 py-8">
                      文档内容预览区域
                    </div>
                  </div>
                  <div className="flex items-center px-4 py-3 border-t">
                    <Input 
                      placeholder="询问关于该文档的任何问题"
                      size="large"
                      className="flex-1 mr-2"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onPressEnter={handleSearch}
                    />
                    <Button 
                      type="primary" 
                      shape="circle"
                      icon={<SendOutlined />}
                      size="large"
                      onClick={handleSearch}
                      loading={loading}
                    />
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* 智能写作模式下的界面 */}
          {activeMode === 'writing' && (
            <div className="flex flex-col rounded-lg border border-gray-300 shadow-sm bg-white overflow-hidden">
              {/* 写作类型选择区域 */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center">
                  <Radio.Group 
                    value={writingType} 
                    onChange={(e) => setWritingType(e.target.value)}
                    className="flex"
                  >
                    {writingFormats.map(format => (
                      <Radio.Button 
                        key={format.value} 
                        value={format.value}
                        className="flex items-center"
                      >
                        {format.value === 'format' ? <FileTextOutlined className="mr-1" /> : <FileOutlined className="mr-1" />}
                        {format.label}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </div>
                <div className="flex items-center gap-2">
                  {fileList.length > 0 ? (
                    <div className="flex items-center">
                      <div className="text-xs text-gray-500 mr-2">参考文档:</div>
                      <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-xs mr-2">
                        <span className="truncate max-w-[100px]">{fileList[0].name}</span>
                        <Button
                          type="text"
                          size="small"
                          className="ml-1 text-gray-500 hover:text-red-500 flex items-center justify-center p-0"
                          onClick={() => setFileList([])}
                          icon={<CloseCircleOutlined style={{ fontSize: 12 }} />}
                        />
                      </div>
                    </div>
                  ) : (
                    <Upload
                      accept=".doc,.docx,.pdf,.txt"
                      fileList={[]}
                      onChange={handleUploadChange}
                      showUploadList={false}
                      multiple={false}
                      maxCount={1}
                      beforeUpload={(file) => {
                        const isValidFormat = /\.(doc|docx|pdf|txt)$/i.test(file.name);
                        if (!isValidFormat) {
                          message.error('仅支持文档格式');
                          return Upload.LIST_IGNORE;
                        }
                        return false;
                      }}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<PaperClipOutlined />}
                        className="text-gray-500"
                      >
                        添加参考文档
                      </Button>
                    </Upload>
                  )}
                </div>
              </div>
              
              {/* 格式仿写模式下的内容选择区域 */}
              {writingType === 'format' && (
                <div className="px-4 py-3">
                  <div className="text-sm text-gray-500 mb-2">
                    {fileList.length === 0 
                      ? '添加参考文档后，可选择文档中的文本段落进行格式仿写' 
                      : selectedText 
                        ? '已选择文本段落作为格式参考' 
                        : '从参考文档中选择文本段落作为格式参考'}
                  </div>
                  
                  {fileList.length > 0 && !selectedText && (
                    <Button 
                      type="dashed" 
                      block 
                      icon={<HighlightOutlined />}
                      onClick={() => handleTextSelection('这是一段样例文本，实际使用时用户应该能够从上传的文档中选择段落。')}
                      className="mb-2"
                    >
                      从文档中选择文本段落
                    </Button>
                  )}
                  
                  {selectedText && (
                    <div className="border border-dashed border-gray-300 p-2 mb-2 rounded bg-gray-50">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-xs text-gray-500">已选择文本段落：</div>
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<CloseOutlined />} 
                          onClick={() => setSelectedText('')}
                          className="text-gray-500 hover:text-red-500"
                        />
                      </div>
                      <div className="text-sm">{selectedText}</div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 输入区域 */}
              <div className="px-4 pb-3">
                <Input.TextArea
                  placeholder={writingType === 'format' 
                    ? '请描述您希望生成的内容要点...' 
                    : '请描述您需要生成的公文类型和主要内容...'}
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mb-3 mt-2"
                />
                
                <div className="flex justify-end">
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSearch}
                    loading={loading}
                  >
                    生成内容
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* 显示上传的文件（非文档解读模式） */}
          {activeMode !== 'document' && fileList.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4">
              {fileList.map((file) => (
                <div key={file.uid} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-xs">
                  <span className="truncate max-w-xs">{file.name}</span>
                  <Button
                    type="text"
                    size="small"
                    className="ml-1 text-gray-500 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileList(fileList.filter((item) => item.uid !== file.uid));
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* 功能提示文本 */}
          <div className="text-[10px] text-gray-400 text-right px-1">
            {activeMode === 'global' && '可上传文档和图片辅助提问'}
            {activeMode === 'document' && fileList.length > 0 && `已上传文档：${fileList[0].name}`}
            {activeMode === 'writing' && getWritingHelpText()}
          </div>
          
          {/* 智能写作预览结果 */}
          {activeMode === 'writing' && previewContent && (
            <div className="mt-5 p-4 border rounded-lg border-gray-300 shadow-sm bg-white">
              <div className="flex justify-between items-center mb-3">
                <div className="font-medium text-gray-700">生成结果预览</div>
                <div className="flex gap-2">
                  <Button 
                    type="default"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setPreviewContent(null)}
                  >
                    继续编辑
                  </Button>
                  <Button 
                    type="primary" 
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(previewContent);
                      message.success('已复制到剪贴板');
                    }}
                  >
                    复制内容
                  </Button>
                </div>
              </div>
              <div className="whitespace-pre-line bg-gray-50 p-4 rounded border border-gray-200 text-sm leading-relaxed">
                {previewContent}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 文档管理面板仅当有超过1个文档时显示 */}
      {activeMode === 'document' && fileList.length > 1 && panelVisible && (
        <DocumentUploadPanel 
          visible={true}
          fileList={fileList}
          onClose={() => setPanelVisible(false)}
          onFileChange={setFileList}
        />
      )}
      
      {/* 文档解读模态框 */}
      <Modal
        title={
          <div className="flex items-center">
            <FileTextOutlined className="mr-2" />
            <span>文档解读</span>
          </div>
        }
        open={docModalVisible}
        onCancel={closeDocumentModal}
        footer={null}
        width={800}
        centered
        className="document-reader-modal"
      >
        <div className="p-4">
          {fileList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="mb-4">
                <InboxOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />
              </div>
              <div className="text-lg mb-2">将文档拖动至此或选择文档</div>
              <div className="text-sm text-gray-500 mb-6">
                支持PDF、Word、Markdown等，文档需小于100MB，低于500页
              </div>
              <div className="flex gap-4">
                <Button 
                  icon={<DatabaseOutlined />}
                  size="large"
                  className="flex items-center"
                >
                  知识库文件
                </Button>
                <Upload
                  accept=".pdf,.doc,.docx,.md,.txt"
                  fileList={[]}
                  onChange={handleUploadChange}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const isValidFormat = /\.(pdf|doc|docx|md|txt)$/i.test(file.name);
                    if (!isValidFormat) {
                      message.error('文件格式不支持');
                      return Upload.LIST_IGNORE;
                    }
                    const isLt100M = file.size / 1024 / 1024 < 100;
                    if (!isLt100M) {
                      message.error('文件必须小于100MB');
                      return Upload.LIST_IGNORE;
                    }
                    return false;
                  }}
                >
                  <Button 
                    icon={<FolderOpenOutlined />}
                    size="large"
                    className="flex items-center"
                  >
                    本地文件
                  </Button>
                </Upload>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-96">
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <div className="flex items-center">
                  {getFileIcon(fileList[0].name)}
                  <span className="ml-2 font-medium">{fileList[0].name}</span>
                </div>
                <Button 
                  type="text" 
                  icon={<CloseOutlined />} 
                  onClick={() => setFileList([])}
                />
              </div>
              <div className="flex-1 bg-gray-50 p-4 rounded mb-4 overflow-auto">
                <div className="text-center text-gray-500 py-8">
                  文档内容预览区域
                </div>
              </div>
              <div className="flex items-center">
                <Input 
                  placeholder="询问关于该文档的任何问题"
                  size="large"
                  className="flex-1 mr-2"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onPressEnter={() => {
                    handleSearch();
                    closeDocumentModal();
                  }}
                />
                <Button 
                  type="primary" 
                  shape="circle"
                  icon={<SendOutlined />}
                  size="large"
                  onClick={() => {
                    handleSearch();
                    closeDocumentModal();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default IntegratedSearch; 