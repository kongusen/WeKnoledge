import React from 'react';
import { Button, List } from 'antd';
import { CloseOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface DocumentUploadPanelProps {
  visible: boolean;
  fileList: UploadFile[];
  onClose: () => void;
  onFileChange: (files: UploadFile[]) => void;
}

const DocumentUploadPanel: React.FC<DocumentUploadPanelProps> = ({
  visible,
  fileList,
  onClose,
  onFileChange
}) => {
  if (!visible) return null;

  const handleDelete = (uid: string) => {
    const newFileList = fileList.filter(file => file.uid !== uid);
    onFileChange(newFileList);
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '未知大小';
    const kb = size / 1024;
    return kb < 1024 ? `${kb.toFixed(2)} KB` : `${(kb / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="document-upload-panel">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <FileTextOutlined className="mr-2" />
          <span className="font-medium">已上传文档</span>
        </div>
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={onClose}
        />
      </div>

      <List
        dataSource={fileList}
        renderItem={file => (
          <List.Item
            key={file.uid}
            actions={[
              <Button 
                key="delete" 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => handleDelete(file.uid)}
              >
                删除
              </Button>
            ]}
          >
            <List.Item.Meta
              title={file.name}
              description={`大小：${formatFileSize(file.size)}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default DocumentUploadPanel; 