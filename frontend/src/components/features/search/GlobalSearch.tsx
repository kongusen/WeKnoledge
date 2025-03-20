import React, { useState } from 'react';
import { Input, Button, Upload, message } from 'antd';
import { SearchOutlined, FileAddOutlined, PictureOutlined, SendOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface GlobalSearchProps {
  onSearch: (query: string, files?: UploadFile[]) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!query.trim() && fileList.length === 0) {
      message.warning('请输入问题或上传文件');
      return;
    }
    
    setLoading(true);
    
    // 模拟请求
    setTimeout(() => {
      onSearch(query, fileList);
      setLoading(false);
    }, 500);
  };

  const handleUploadChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
  };

  return (
    <div className="w-full max-w-3xl transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 shadow-sm transition-all duration-300 hover:shadow-md focus-within:border-primary focus-within:shadow-md">
          <SearchOutlined className="text-lg text-gray-400 mr-2" />
          <Input
            placeholder="向知识库提问..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={handleSearch}
            bordered={false}
            className="flex-1"
            size="large"
          />
          
          <Upload
            accept=".doc,.docx,.pdf,.png,.jpg,.jpeg"
            fileList={fileList}
            onChange={handleUploadChange}
            maxCount={3}
            multiple
            showUploadList={false}
            beforeUpload={(file) => {
              const isValidFormat = /\.(doc|docx|pdf|png|jpg|jpeg)$/i.test(file.name);
              if (!isValidFormat) {
                message.error('仅支持 Word、PDF、PNG、JPG 格式');
              }
              return isValidFormat || Upload.LIST_IGNORE;
            }}
          >
            <Button 
              type="text" 
              icon={<FileAddOutlined />} 
              className="text-gray-500 hover:text-primary mr-1"
              title="上传文档"
            />
          </Upload>
          
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
              title="上传截图"
            />
          </Upload>
          
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            onClick={handleSearch}
            loading={loading}
            className="flex items-center justify-center"
          />
        </div>
        
        {fileList.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4">
            {fileList.map((file) => (
              <div key={file.uid} className="flex items-center bg-gray-100 px-2 py-1 rounded-md text-xs">
                <span className="truncate max-w-xs">{file.name}</span>
                <Button
                  type="text"
                  size="small"
                  className="ml-1 text-gray-500 hover:text-red-500"
                  onClick={() => {
                    setFileList(fileList.filter((item) => item.uid !== file.uid));
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch; 