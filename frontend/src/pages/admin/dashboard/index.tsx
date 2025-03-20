import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Typography, Row, Col, Card, Statistic, Progress, Tabs, Table, Select, DatePicker } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  FileOutlined,
  QuestionOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 模拟用户使用数据
const mockUserActivityData = [
  ['2023-03-13', 45],
  ['2023-03-14', 52],
  ['2023-03-15', 49],
  ['2023-03-16', 60],
  ['2023-03-17', 72],
  ['2023-03-18', 56],
  ['2023-03-19', 63]
];

// 模拟搜索量趋势数据
const mockSearchData = [
  ['2023-03-13', 230],
  ['2023-03-14', 270],
  ['2023-03-15', 310],
  ['2023-03-16', 290],
  ['2023-03-17', 350],
  ['2023-03-18', 340],
  ['2023-03-19', 380]
];

// 模拟各部门文档数据
const mockDepartmentDocsData = [
  { name: '技术部', value: 320 },
  { name: '市场部', value: 180 },
  { name: '人力资源', value: 120 },
  { name: '产品部', value: 210 },
  { name: '运营部', value: 150 }
];

// 模拟文档类型分布
const mockDocTypeData = [
  { name: 'PDF', value: 45 },
  { name: 'Word', value: 30 },
  { name: 'PPT', value: 15 },
  { name: 'Excel', value: 8 },
  { name: '其他', value: 2 }
];

// 模拟热门搜索词
const mockHotSearches = [
  { keyword: '项目管理', count: 156, trend: 'up' },
  { keyword: '前端开发', count: 129, trend: 'up' },
  { keyword: '年终总结', count: 98, trend: 'down' },
  { keyword: '公司规章制度', count: 87, trend: 'up' },
  { keyword: '请假流程', count: 75, trend: 'down' },
];

// 模拟系统响应时间数据
const mockResponseTimeData = {
  search: [120, 132, 101, 134, 90, 110, 120],
  ai: [180, 182, 191, 184, 190, 170, 182],
  days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
};

const DashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('week');
  
  // 核心指标
  const statistics = {
    totalUsers: 256,
    userGrowth: 15.8,
    activeUsers: 128,
    activeUsersGrowth: 22.4,
    totalDocuments: 1458,
    docGrowth: 8.5,
    totalQuestions: 8642,
    questionGrowth: 18.3,
    avgResponseTime: 156,
    avgRespTimeChange: -8.2,
    satisfactionRate: 92,
    satisfactionChange: 3.4,
    knowledgeCoverage: 86,
    coverageChange: 5.1,
  };

  // 用户活跃度图表配置
  const userActivityOption = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 用户'
    },
    xAxis: {
      type: 'category',
      data: mockUserActivityData.map(item => item[0]),
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value',
      name: '日活跃用户数',
    },
    series: [{
      data: mockUserActivityData.map(item => item[1]),
      type: 'line',
      smooth: true,
      showSymbol: false,
      areaStyle: {
        opacity: 0.3,
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: '#1890ff' 
          }, {
            offset: 1, color: 'rgba(24,144,255,0.1)'
          }]
        }
      },
      lineStyle: {
        width: 3
      }
    }]
  };

  // 搜索量趋势图表配置
  const searchTrendOption = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 次'
    },
    xAxis: {
      type: 'category',
      data: mockSearchData.map(item => item[0]),
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value',
      name: '搜索/提问次数',
    },
    series: [{
      data: mockSearchData.map(item => item[1]),
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: '#52c41a' 
          }, {
            offset: 1, color: 'rgba(82,196,26,0.5)'
          }]
        }
      }
    }]
  };

  // 部门文档数图表配置
  const departmentDocsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 个文档 ({d}%)'
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      bottom: 20,
    },
    series: [
      {
        name: '部门文档数',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: mockDepartmentDocsData
      }
    ]
  };

  // 文档类型分布图表配置
  const docTypeOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)'
    },
    legend: {
      show: false
    },
    series: [
      {
        name: '文档类型',
        type: 'pie',
        radius: '80%',
        data: mockDocTypeData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {c}%',
          fontSize: 14
        }
      }
    ]
  };

  // 系统响应时间图表配置
  const responseTimeOption = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        let str = params[0].axisValue + '<br/>';
        params.forEach((item: any) => {
          str += item.marker + item.seriesName + ': ' + item.value + ' ms<br/>';
        });
        return str;
      }
    },
    legend: {
      data: ['搜索响应时间', 'AI服务响应时间']
    },
    xAxis: {
      type: 'category',
      data: mockResponseTimeData.days
    },
    yAxis: {
      type: 'value',
      name: '响应时间 (ms)'
    },
    series: [
      {
        name: '搜索响应时间',
        type: 'line',
        stack: '总量',
        data: mockResponseTimeData.search,
        symbol: 'emptyCircle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'AI服务响应时间',
        type: 'line',
        stack: '总量',
        data: mockResponseTimeData.ai,
        symbol: 'emptyCircle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        }
      }
    ]
  };

  // 热门搜索表格列定义
  const hotSearchColumns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '搜索次数',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => <b>{count}</b>,
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => trend === 'up' ? 
        <Text type="success"><ArrowUpOutlined /> 上升</Text> : 
        <Text type="danger"><ArrowDownOutlined /> 下降</Text>,
    }
  ];

  return (
    <MainLayout userRole="admin">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2}>仪表板</Title>
          <p className="text-gray-500">系统运行数据概览</p>
        </div>
        <div className="flex items-center">
          <span className="mr-2">时间范围：</span>
          <Select 
            value={timeRange} 
            onChange={setTimeRange}
            style={{ width: 120 }}
          >
            <Option value="day">今日</Option>
            <Option value="week">本周</Option>
            <Option value="month">本月</Option>
            <Option value="quarter">本季度</Option>
          </Select>
        </div>
      </div>
      
      {/* KPI 指标卡 */}
      <Row gutter={[24, 24]}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="总用户数" 
              value={statistics.totalUsers} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="mt-2 text-sm text-green-500">
              <ArrowUpOutlined /> {statistics.userGrowth}% 增长
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="活跃用户数" 
              value={statistics.activeUsers} 
              prefix={<TeamOutlined />} 
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2 text-sm text-green-500">
              <ArrowUpOutlined /> {statistics.activeUsersGrowth}% 增长
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="知识库文档数" 
              value={statistics.totalDocuments} 
              prefix={<FileOutlined />} 
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="mt-2 text-sm text-green-500">
              <ArrowUpOutlined /> {statistics.docGrowth}% 增长
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="总提问次数" 
              value={statistics.totalQuestions} 
              prefix={<QuestionOutlined />} 
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className="mt-2 text-sm text-green-500">
              <ArrowUpOutlined /> {statistics.questionGrowth}% 增长
            </div>
          </Card>
        </Col>
      </Row>

      {/* 系统性能指标 */}
      <Row gutter={[24, 24]} className="mt-6">
        <Col span={8}>
          <Card>
            <Statistic 
              title="平均响应时间" 
              value={statistics.avgResponseTime} 
              suffix="ms" 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="mt-2 text-sm text-green-500">
              <ArrowDownOutlined /> {Math.abs(statistics.avgRespTimeChange)}% 改善
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="回答满意度" 
              value={statistics.satisfactionRate} 
              suffix="%" 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2 text-sm text-green-500">
              <ArrowUpOutlined /> {statistics.satisfactionChange}% 提升
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="知识库覆盖率" 
              value={statistics.knowledgeCoverage} 
              suffix="%" 
              prefix={<FileSearchOutlined />} 
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className="mt-2 text-sm text-green-500">
              <ArrowUpOutlined /> {statistics.coverageChange}% 提升
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细数据图表 */}
      <Tabs defaultActiveKey="usage" className="mt-6">
        <TabPane tab="使用情况" key="usage">
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Card title="日活跃用户趋势">
                <ReactECharts option={userActivityOption} style={{ height: '300px' }} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="每日搜索/提问量趋势">
                <ReactECharts option={searchTrendOption} style={{ height: '300px' }} />
              </Card>
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="知识库分析" key="knowledge">
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Card title="部门文档数量分布">
                <ReactECharts option={departmentDocsOption} style={{ height: '300px' }} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="文档类型分布">
                <ReactECharts option={docTypeOption} style={{ height: '300px' }} />
              </Card>
            </Col>
          </Row>
        </TabPane>
        <TabPane tab="系统性能" key="performance">
          <Card title="系统响应时间">
            <ReactECharts option={responseTimeOption} style={{ height: '300px' }} />
          </Card>
        </TabPane>
        <TabPane tab="热门搜索" key="hotSearch">
          <Card title="热门搜索词">
            <Table 
              columns={hotSearchColumns} 
              dataSource={mockHotSearches} 
              pagination={false}
              rowKey="keyword"
            />
          </Card>
        </TabPane>
      </Tabs>
    </MainLayout>
  );
};

export default DashboardPage; 