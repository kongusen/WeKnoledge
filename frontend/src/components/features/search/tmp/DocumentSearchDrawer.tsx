import React from 'react';
import { Upload, Button, message, Drawer, Space } from 'antd';
import { 
  DeleteOutlined, 
  InboxOutlined, 
  UploadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileTextTwoTone
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;

interface DocumentSearchDrawerProps {
  visible: boolean;
  fileList: UploadFile[];
  onClose: () => void;
  onFileChange: (fileList: UploadFile[]) => void;
}

const DocumentSearchDrawer: React.FC<DocumentSearchDrawerProps> = ({
  visible,
  fileList,
  onClose,
  onFileChange
}) => {
  // 处理上传文件变化
  const handleUploadChange = ({ fileList }: { fileList: UploadFile[] }) => {
    // 限制最多上传9个文档
    if (fileList.length > 9) {
      message.warning('最多只能上传9个文档');
      return;
    }
    onFileChange(fileList);
  };

  // 获取文件图标
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) {
      return <FilePdfOutlined className="text-red-500 text-4xl" />;
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return <FileWordOutlined className="text-blue-500 text-4xl" />;
    } else {
      return <FileTextTwoTone className="text-4xl" />;
    }
  };

  // 删除文件
  const handleRemoveFile = (uid: string) => {
    onFileChange(fileList.filter(file => file.uid !== uid));
  };

  return (
    <Drawer
      title="文档上传"
      placement="bottom"
      height={360}
      closable={true}
      onClose={onClose}
      open={visible}
      bodyStyle={{ padding: '16px' }}
    >
      <div className="mb-4">
        <Dragger
          accept={'.doc,.docx,.pdf,.txt'}
          multiple
          fileList={fileList}
          onChange={handleUploadChange}
          beforeUpload={(file) => {
            const isValidFormat = /\.(doc|docx|pdf|txt)$/i.test(file.name);
            if (!isValidFormat) {
              message.error('仅支持 Word、PDF 和文本文件');
              return Upload.LIST_IGNORE;
            }
            return false; // 阻止自动上传
          }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个或多个文件上传，最多可上传9个文档
          </p>
        </Dragger>
      </div>
      
      {/* 已上传文档列表 */}
      {fileList.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {fileList.map(file => (
            <div key={file.uid} className="flex flex-col items-center">
              <div className="relative">
                {getFileIcon(file.name)}
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  className="absolute -top-2 -right-2 rounded-full bg-white shadow-sm"
                  onClick={() => handleRemoveFile(file.uid)}
                />
              </div>
              <div className="text-xs text-center mt-1 w-full truncate">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-8">
          <p>暂无上传文件</p>
        </div>
      )}
      
      <div className="mt-4 flex justify-between">
        <div className="text-gray-500 text-sm">
          {fileList.length}/9 个文档
        </div>
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={onClose}
            disabled={fileList.length === 0}
          >
            完成上传
          </Button>
        </Space>
      </div>
    </Drawer>
  );
};

export default DocumentSearchDrawer; 