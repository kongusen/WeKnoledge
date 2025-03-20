import React, { useState } from 'react';
import { Button, Upload, Input, message } from 'antd';
import { InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;
const { TextArea } = Input;

interface DocumentUploadProps {
  onSubmit: (question: string, file: UploadFile) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onSubmit }) => {
  const [file, setFile] = useState<UploadFile | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (info: any) => {
    const { status } = info.file;
    
    if (status === 'done') {
      message.success(`${info.file.name} 上传成功`);
      setFile(info.file);
    } else if (status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      message.warning('请先上传文档');
      return;
    }

    if (!question.trim()) {
      message.warning('请输入您的问题');
      return;
    }

    setLoading(true);
    
    // 模拟提交
    setTimeout(() => {
      if (file) {
        onSubmit(question, file);
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="text-center mb-4">
        <FileTextOutlined className="text-4xl text-primary mb-2" />
        <h3 className="text-lg font-medium">文档解读</h3>
        <p className="text-gray-500 text-sm">上传文档，获取AI智能解读</p>
      </div>
      
      <div className="mb-4">
        <Dragger
          name="file"
          maxCount={1}
          accept=".pdf,.doc,.docx,.txt"
          showUploadList={{ showRemoveIcon: true }}
          onChange={handleFileChange}
          beforeUpload={(file) => {
            const isValidType = /\.(pdf|doc|docx|txt)$/i.test(file.name);
            if (!isValidType) {
              message.error('请上传PDF、Word或文本文档');
              return Upload.LIST_IGNORE;
            }
            setFile(file as unknown as UploadFile);
            return false; // 阻止自动上传
          }}
          className="transition-all duration-300 hover:border-primary"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint text-xs">
            支持PDF、Word、文本文档格式
          </p>
        </Dragger>
      </div>
      
      <div className="mb-4">
        <TextArea
          placeholder="请输入您对文档的问题，例如：总结这份文档的要点"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          className="transition-all duration-300"
        />
      </div>
      
      <Button
        type="primary"
        block
        onClick={handleSubmit}
        loading={loading}
        disabled={!file}
        className="transition-all duration-300"
      >
        开始解读
      </Button>
    </div>
  );
};

export default DocumentUpload; 