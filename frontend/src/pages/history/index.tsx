import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Typography, Table, Tag, Space, Input, Button, DatePicker, Select, message, Modal } from 'antd';
import { SearchOutlined, FilterOutlined, DeleteOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { getHistoryList, deleteHistory, batchDeleteHistory, downloadExportedHistory, HistoryQueryParams, HistoryItem } from '@/services/historyService';
import { useRouter } from 'next/router';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const HistoryPage: React.FC = () => {
  const router = useRouter();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [current, setCurrent] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  
  // 查询参数
  const [searchParams, setSearchParams] = useState<HistoryQueryParams>({
    skip: 0,
    limit: 10
  });
  
  // 初始化加载
  useEffect(() => {
    fetchHistoryList();
  }, [searchParams]);
  
  // 获取历史列表
  const fetchHistoryList = async () => {
    setLoading(true);
    try {
      const response = await getHistoryList(searchParams);
      setData(response.items);
      setTotal(response.total);
      setLoading(false);
    } catch (error) {
      console.error('获取历史记录失败:', error);
      message.error('获取历史记录失败');
      setLoading(false);
    }
  };
  
  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams({
      ...searchParams,
      search: value,
      skip: 0 // 重置分页
    });
    setCurrent(1);
  };
  
  // 处理日期范围变化
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setSearchParams({
        ...searchParams,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD'),
        skip: 0
      });
    } else {
      // 清除日期筛选
      const newParams = { ...searchParams };
      delete newParams.start_date;
      delete newParams.end_date;
      setSearchParams(newParams);
    }
    setCurrent(1);
  };
  
  // 处理类型变化
  const handleTypeChange = (value: string) => {
    if (value === 'all') {
      // 清除类型筛选
      const newParams = { ...searchParams };
      delete newParams.history_type;
      setSearchParams(newParams);
    } else {
      setSearchParams({
        ...searchParams,
        history_type: value,
        skip: 0
      });
    }
    setCurrent(1);
  };
  
  // 处理状态变化
  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      // 清除状态筛选
      const newParams = { ...searchParams };
      delete newParams.status;
      setSearchParams(newParams);
    } else {
      setSearchParams({
        ...searchParams,
        status: value,
        skip: 0
      });
    }
    setCurrent(1);
  };
  
  // 处理导出
  const handleExport = async (format: 'json' | 'csv' = 'json') => {
    try {
      setLoading(true);
      const exportParams = { ...searchParams };
      delete exportParams.skip;
      delete exportParams.limit;
      
      await downloadExportedHistory(format, exportParams);
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理单条删除
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条历史记录吗？删除后将无法恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          const success = await deleteHistory(id);
          if (success) {
            message.success('删除成功');
            fetchHistoryList(); // 重新加载列表
          } else {
            message.error('删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };
  
  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的记录');
      return;
    }
    
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条历史记录吗？删除后将无法恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await batchDeleteHistory(selectedRowKeys as string[]);
          if (result.status === 'success') {
            message.success(`成功删除 ${result.deleted_count} 条记录`);
            setSelectedRowKeys([]);
            fetchHistoryList(); // 重新加载列表
          } else {
            message.error('批量删除失败');
          }
        } catch (error) {
          console.error('批量删除失败:', error);
          message.error('批量删除失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };
  
  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    setCurrent(pagination.current);
    setPageSize(pagination.pageSize);
    setSearchParams({
      ...searchParams,
      skip: (pagination.current - 1) * pagination.pageSize,
      limit: pagination.pageSize
    });
  };
  
  // 点击查看详情
  const handleView = (id: string) => {
    // 跳转到详情页或聊天页面
    router.push(`/chat?id=${id}`);
  };

  const columns: ColumnsType<HistoryItem> = [
    {
      title: '问题',
      dataIndex: 'question',
      key: 'question',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      sorter: (a: HistoryItem, b: HistoryItem) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let color = 'blue';
        if (type === '文档解读') color = 'green';
        if (type === '智能写作') color = 'purple';
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === '已回答' ? 'success' : 'warning';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => handleView(record.id)}>查看</a>
          <a onClick={() => handleDelete(record.id)}>删除</a>
        </Space>
      ),
    },
  ];

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  return (
    <MainLayout userRole="admin">
      <div className="mb-6">
        <Title level={2}>历史提问</Title>
        <p className="text-gray-500">查看和管理您的历史提问记录</p>
      </div>
      
      <div className="mb-4 flex justify-between">
        <Space size="middle">
          <Input.Search
            placeholder="搜索历史提问"
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            onSearch={handleSearch}
            allowClear
          />
          <RangePicker 
            placeholder={['开始日期', '结束日期']} 
            onChange={handleDateRangeChange}
          />
          <Select 
            defaultValue="all" 
            style={{ width: 120 }}
            onChange={handleTypeChange}
          >
            <Option value="all">全部类型</Option>
            <Option value="全局提问">全局提问</Option>
            <Option value="文档解读">文档解读</Option>
            <Option value="智能写作">智能写作</Option>
          </Select>
          <Select 
            defaultValue="all" 
            style={{ width: 120 }}
            onChange={handleStatusChange}
          >
            <Option value="all">全部状态</Option>
            <Option value="已回答">已回答</Option>
            <Option value="未回答">未回答</Option>
          </Select>
        </Space>
        
        <Space>
          <Button 
            icon={<CloudDownloadOutlined />} 
            onClick={() => handleExport('csv')}
            loading={loading}
          >
            导出CSV
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            disabled={selectedRowKeys.length === 0}
            onClick={handleBatchDelete}
            loading={loading}
          >
            删除选中
          </Button>
        </Space>
      </div>
      
      <Table 
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data} 
        rowKey="id"
        loading={loading}
        pagination={{
          current: current,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        onChange={handleTableChange}
      />
    </MainLayout>
  );
};

export default HistoryPage; 