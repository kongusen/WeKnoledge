import React, { useState } from 'react';
import { Tabs, Button, Upload, Input, Select, message, Form, Spin, Tooltip, Tag } from 'antd';
import { 
  EditOutlined, 
  FileTextOutlined, 
  FileAddOutlined, 
  SendOutlined,
  FileTextTwoTone,
  InfoCircleOutlined,
  BranchesOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { generateContent } from '@/services/api/writingService';
import ReactMarkdown from 'react-markdown';

const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

interface WritingAssistantProps {
  onSubmit?: (type: string, content: string, file?: UploadFile) => void;
}

const WritingAssistant: React.FC<WritingAssistantProps> = ({ onSubmit }) => {
  const [activeTab, setActiveTab] = useState('format');
  const [referenceFile, setReferenceFile] = useState<UploadFile | null>(null);
  const [referenceText, setReferenceText] = useState('');
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [markdownMode, setMarkdownMode] = useState(true);
  const [writingForm] = Form.useForm();

  // 处理格式仿写提交
  const handleFormatSubmit = async () => {
    if (!topic.trim()) {
      message.warning('请输入需要生成的内容');
      return;
    }

    try {
      setIsGenerating(true);
      
      const params = {
        topic: topic,
        writing_type: 'format',
        style: 'formal',
        keywords: [],
        max_length: 800,
        reference_text: referenceText,
        output_format: markdownMode ? 'markdown' : 'text'
      };
      
      const result = await generateContent(params);
      setGeneratedContent(result.content);
      message.success('内容生成成功');
      
      // 如果提供了外部回调，也调用它
      if (onSubmit) {
        onSubmit('format', result.content, referenceFile || undefined);
      }
    } catch (error) {
      console.error('生成内容失败:', error);
      message.error('生成内容失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理公文写作提交
  const handleDocumentSubmit = async () => {
    if (!topic.trim()) {
      message.warning('请输入需要生成的内容');
      return;
    }

    try {
      setIsGenerating(true);
      
      const params = {
        topic: topic,
        writing_type: 'document',
        style: 'formal',
        keywords: [],
        max_length: 800,
        reference_text: referenceText,
        output_format: markdownMode ? 'markdown' : 'text'
      };
      
      const result = await generateContent(params);
      setGeneratedContent(result.content);
      message.success('内容生成成功');
      
      // 如果提供了外部回调，也调用它
      if (onSubmit) {
        onSubmit('document', result.content, referenceFile || undefined);
      }
    } catch (error) {
      console.error('生成内容失败:', error);
      message.error('生成内容失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = (file: UploadFile) => {
    setReferenceFile(file);
    
    // 使用FileReader读取文件内容
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        setReferenceText(e.target.result);
        message.success('参考文档已加载');
      }
    };
    reader.onerror = () => {
      message.error('读取文件失败');
    };
    
    if (file.originFileObj) {
      reader.readAsText(file.originFileObj);
    }
    return false; // 阻止默认上传行为
  };

  // 定义上传组件的属性
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.txt,.doc,.docx,.pdf,.md',
    beforeUpload: (file) => {
      handleFileUpload(file as unknown as UploadFile);
      return false;
    },
    fileList: referenceFile ? [referenceFile] : [],
    onRemove: () => {
      setReferenceFile(null);
      setReferenceText('');
    }
  };

  const aiSystemDescription = (
    <Tooltip title="基于MCP协议的Agent群体协作完成文档写作，智能体会分析参考文档、知识库内容，通过思考模型进行写作规划和生成">
      <InfoCircleOutlined className="ml-2 text-blue-500" />
    </Tooltip>
  );

  return (
    <div className="bg-white rounded-lg transition-all duration-300">
      <div className="mb-4 flex space-x-4">
        <Button 
          type={activeTab === 'format' ? "primary" : "default"}
          icon={<FileTextOutlined />} 
          onClick={() => setActiveTab('format')}
          className="border rounded-full"
        >
          格式仿写
        </Button>
        <Button 
          type={activeTab === 'document' ? "primary" : "default"}
          icon={<FileTextOutlined />} 
          onClick={() => setActiveTab('document')}
          className="border rounded-full"
        >
          公文写作
        </Button>
      </div>
      
      <div className="mt-4 text-gray-500 mb-2 flex items-center">
        {activeTab === 'format' ? 
          '添加参考文档（可选）后，可选择文档中的文本段落进行格式仿写' :
          '输入主题内容，AI将为您生成规范的公文格式内容'
        }
        {aiSystemDescription}
      </div>
      
      <div className="mt-4">
        <Form
          form={writingForm}
          layout="vertical"
          onFinish={activeTab === 'format' ? handleFormatSubmit : handleDocumentSubmit}
        >
          <div className="mb-4">
            <TextArea 
              placeholder={activeTab === 'format' ? 
                "请描述您希望生成的内容要点..." : 
                "请输入公文主题或内容要点..."
              }
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          
          <div className="flex justify-between">
            <div className="flex items-center">
              <Upload {...uploadProps}>
                <Button 
                  type="text"
                  icon={<FileTextTwoTone />}
                >
                  添加参考文档 <Tag color="blue" className="ml-1">可选</Tag>
                </Button>
              </Upload>
              
              <Button 
                type="link"
                icon={<BranchesOutlined />}
                onClick={() => setMarkdownMode(!markdownMode)}
                className="ml-4"
              >
                {markdownMode ? "Markdown 格式" : "纯文本格式"}
              </Button>
            </div>
            
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={activeTab === 'format' ? handleFormatSubmit : handleDocumentSubmit}
              loading={isGenerating}
            >
              生成内容
            </Button>
          </div>
          
          {!!referenceText && (
            <div className="mt-4 p-2 border border-gray-200 rounded bg-gray-50">
              <div className="text-xs text-gray-500">已添加参考文档</div>
            </div>
          )}
          
          {isGenerating && (
            <div className="mt-4 text-center p-4">
              <Spin size="large" />
              <div className="mt-2 text-gray-500">
                正在生成内容，请稍候...
                <div className="text-xs text-gray-400 mt-1">
                  多个智能体正在协作完成写作任务
                </div>
              </div>
            </div>
          )}
          
          {generatedContent && !isGenerating && (
            <div className="mt-4 p-4 border border-gray-200 rounded">
              {markdownMode ? (
                <ReactMarkdown className="markdown-body">
                  {generatedContent}
                </ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap">{generatedContent}</div>
              )}
            </div>
          )}
        </Form>
      </div>
    </div>
  );
};

export default WritingAssistant; 