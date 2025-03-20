import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Tree, 
  Button, 
  Input, 
  Table, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  Select,
  Tooltip,
  message,
  Tabs
} from 'antd';
import { 
  TeamOutlined, 
  UserOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  SwapOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import type { DataNode, TreeProps } from 'antd/es/tree';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

// 模拟部门数据
const mockDepartments = [
  {
    key: 'company',
    title: '公司总部',
    icon: <TeamOutlined />,
    children: [
      {
        key: 'tech',
        title: '技术部',
        icon: <TeamOutlined />,
        children: [
          {
            key: 'frontend',
            title: '前端组',
            icon: <TeamOutlined />,
          },
          {
            key: 'backend',
            title: '后端组',
            icon: <TeamOutlined />,
          },
          {
            key: 'qa',
            title: '测试组',
            icon: <TeamOutlined />,
          },
        ],
      },
      {
        key: 'product',
        title: '产品部',
        icon: <TeamOutlined />,
      },
      {
        key: 'design',
        title: '设计部',
        icon: <TeamOutlined />,
      },
      {
        key: 'marketing',
        title: '市场部',
        icon: <TeamOutlined />,
      },
      {
        key: 'hr',
        title: '人力资源部',
        icon: <TeamOutlined />,
      },
    ],
  },
];

// 模拟员工数据
interface Employee {
  key: string;
  id: string;
  name: string;
  department: string;
  departmentKey: string;
  position: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

const mockEmployees: Employee[] = [
  {
    key: '1',
    id: 'EMP001',
    name: '张三',
    department: '技术部 / 前端组',
    departmentKey: 'frontend',
    position: '高级前端工程师',
    email: 'zhangsan@example.com',
    phone: '13800138001',
    status: 'active',
  },
  {
    key: '2',
    id: 'EMP002',
    name: '李四',
    department: '技术部 / 后端组',
    departmentKey: 'backend',
    position: '后端工程师',
    email: 'lisi@example.com',
    phone: '13800138002',
    status: 'active',
  },
  {
    key: '3',
    id: 'EMP003',
    name: '王五',
    department: '产品部',
    departmentKey: 'product',
    position: '产品经理',
    email: 'wangwu@example.com',
    phone: '13800138003',
    status: 'active',
  },
  {
    key: '4',
    id: 'EMP004',
    name: '赵六',
    department: '设计部',
    departmentKey: 'design',
    position: 'UI设计师',
    email: 'zhaoliu@example.com',
    phone: '13800138004',
    status: 'inactive',
  },
  {
    key: '5',
    id: 'EMP005',
    name: '钱七',
    department: '市场部',
    departmentKey: 'marketing',
    position: '市场专员',
    email: 'qianqi@example.com',
    phone: '13800138005',
    status: 'active',
  },
];

// 部门表单类型
interface DepartmentFormData {
  name: string;
  parentId: string;
  description?: string;
}

// 员工表单类型
interface EmployeeFormData {
  name: string;
  departmentKey: string;
  position: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

const OrganizationPage: React.FC = () => {
  // 状态
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(mockEmployees);
  const [isAddDepartmentModalVisible, setIsAddDepartmentModalVisible] = useState<boolean>(false);
  const [isEditDepartmentModalVisible, setIsEditDepartmentModalVisible] = useState<boolean>(false);
  const [isDeleteDepartmentModalVisible, setIsDeleteDepartmentModalVisible] = useState<boolean>(false);
  const [isAddEmployeeModalVisible, setIsAddEmployeeModalVisible] = useState<boolean>(false);
  const [isEditEmployeeModalVisible, setIsEditEmployeeModalVisible] = useState<boolean>(false);
  const [isDeleteEmployeeModalVisible, setIsDeleteEmployeeModalVisible] = useState<boolean>(false);
  const [isTransferEmployeeModalVisible, setIsTransferEmployeeModalVisible] = useState<boolean>(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [departmentForm] = Form.useForm();
  const [employeeForm] = Form.useForm();
  const [transferForm] = Form.useForm();

  // 部门树点击处理
  const onDepartmentSelect: TreeProps['onSelect'] = (selectedKeys) => {
    if (selectedKeys.length > 0) {
      const departmentKey = selectedKeys[0].toString();
      setSelectedDepartment(departmentKey);
      
      // 过滤员工列表
      if (departmentKey === 'company') {
        setFilteredEmployees(mockEmployees);
      } else {
        setFilteredEmployees(
          mockEmployees.filter((employee) => employee.departmentKey === departmentKey)
        );
      }
    } else {
      setSelectedDepartment(null);
      setFilteredEmployees(mockEmployees);
    }
  };

  // 搜索员工
  const onSearchEmployee = (value: string) => {
    setSearchValue(value);
    if (!value) {
      if (selectedDepartment && selectedDepartment !== 'company') {
        setFilteredEmployees(
          mockEmployees.filter((employee) => employee.departmentKey === selectedDepartment)
        );
      } else {
        setFilteredEmployees(mockEmployees);
      }
      return;
    }

    // 搜索逻辑
    const filtered = mockEmployees.filter((employee) => {
      return (
        employee.name.includes(value) ||
        employee.id.includes(value) ||
        employee.department.includes(value) ||
        employee.position.includes(value) ||
        employee.email.includes(value) ||
        employee.phone.includes(value)
      );
    });

    setFilteredEmployees(filtered);
  };

  // 添加部门处理
  const handleAddDepartment = () => {
    setIsAddDepartmentModalVisible(true);
  };

  // 编辑部门处理
  const handleEditDepartment = () => {
    if (!selectedDepartment) {
      message.warning('请先选择一个部门');
      return;
    }
    
    if (selectedDepartment === 'company') {
      message.warning('不能编辑公司总部');
      return;
    }

    setIsEditDepartmentModalVisible(true);
    
    // 查找当前部门信息并填充表单
    // 这里是模拟，实际需要从部门数据中找到对应信息
    departmentForm.setFieldsValue({
      name: '当前部门名称', // 模拟数据
      parentId: 'company',
      description: '部门描述信息'
    });
  };

  // 删除部门处理
  const handleDeleteDepartment = () => {
    if (!selectedDepartment) {
      message.warning('请先选择一个部门');
      return;
    }
    
    if (selectedDepartment === 'company') {
      message.warning('不能删除公司总部');
      return;
    }

    setIsDeleteDepartmentModalVisible(true);
  };

  // 提交添加部门
  const submitAddDepartment = () => {
    departmentForm.validateFields().then(values => {
      console.log('添加部门:', values);
      message.success('部门添加成功');
      setIsAddDepartmentModalVisible(false);
      departmentForm.resetFields();
    }).catch(err => {
      console.log('表单验证失败:', err);
    });
  };

  // 提交编辑部门
  const submitEditDepartment = () => {
    departmentForm.validateFields().then(values => {
      console.log('编辑部门:', values);
      message.success('部门更新成功');
      setIsEditDepartmentModalVisible(false);
      departmentForm.resetFields();
    }).catch(err => {
      console.log('表单验证失败:', err);
    });
  };

  // 确认删除部门
  const confirmDeleteDepartment = () => {
    console.log('删除部门:', selectedDepartment);
    message.success('部门删除成功');
    setIsDeleteDepartmentModalVisible(false);
    setSelectedDepartment(null);
    setFilteredEmployees(mockEmployees);
  };

  // 添加员工处理
  const handleAddEmployee = () => {
    setIsAddEmployeeModalVisible(true);
    
    // 如果已选中部门，预设部门
    if (selectedDepartment && selectedDepartment !== 'company') {
      employeeForm.setFieldsValue({
        departmentKey: selectedDepartment
      });
    }
  };

  // 编辑员工处理
  const handleEditEmployee = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsEditEmployeeModalVisible(true);
    
    // 填充表单
    employeeForm.setFieldsValue({
      name: employee.name,
      departmentKey: employee.departmentKey,
      position: employee.position,
      email: employee.email,
      phone: employee.phone,
      status: employee.status
    });
  };

  // 删除员工处理
  const handleDeleteEmployee = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsDeleteEmployeeModalVisible(true);
  };

  // 调整员工部门处理
  const handleTransferEmployee = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsTransferEmployeeModalVisible(true);
    
    // 填充表单
    transferForm.setFieldsValue({
      departmentKey: employee.departmentKey
    });
  };

  // 提交添加员工
  const submitAddEmployee = () => {
    employeeForm.validateFields().then(values => {
      console.log('添加员工:', values);
      message.success('员工添加成功');
      setIsAddEmployeeModalVisible(false);
      employeeForm.resetFields();
    }).catch(err => {
      console.log('表单验证失败:', err);
    });
  };

  // 提交编辑员工
  const submitEditEmployee = () => {
    employeeForm.validateFields().then(values => {
      console.log('编辑员工:', values, '员工ID:', currentEmployee?.id);
      message.success('员工信息更新成功');
      setIsEditEmployeeModalVisible(false);
      employeeForm.resetFields();
      setCurrentEmployee(null);
    }).catch(err => {
      console.log('表单验证失败:', err);
    });
  };

  // 确认删除员工
  const confirmDeleteEmployee = () => {
    console.log('删除员工:', currentEmployee);
    message.success('员工删除成功');
    setIsDeleteEmployeeModalVisible(false);
    setCurrentEmployee(null);
  };

  // 提交调整员工部门
  const submitTransferEmployee = () => {
    transferForm.validateFields().then(values => {
      console.log('调整员工部门:', values, '员工ID:', currentEmployee?.id);
      message.success('员工部门调整成功');
      setIsTransferEmployeeModalVisible(false);
      transferForm.resetFields();
      setCurrentEmployee(null);
    }).catch(err => {
      console.log('表单验证失败:', err);
    });
  };

  // 员工表格列定义
  const employeeColumns: ColumnsType<Employee> = [
    {
      title: '工号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '所属部门',
      dataIndex: 'department',
      key: 'department',
      width: 180,
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      width: 150,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '在职' : '离职'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditEmployee(record)}
            />
          </Tooltip>
          <Tooltip title="调整部门">
            <Button 
              type="text" 
              icon={<SwapOutlined />}
              onClick={() => handleTransferEmployee(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteEmployee(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout userRole="admin">
      <div className="mb-6">
        <Title level={2}>组织架构管理</Title>
        <p className="text-gray-500">管理公司部门与员工信息</p>
      </div>

      <Tabs defaultActiveKey="structure" type="card">
        <TabPane 
          tab={
            <span>
              <ApartmentOutlined />
              组织结构
            </span>
          } 
          key="structure"
        >
          <Row gutter={24}>
            {/* 部门树 */}
            <Col span={8}>
              <Card 
                title="部门结构" 
                extra={
                  <Space>
                    <Tooltip title="添加部门">
                      <Button 
                        type="text" 
                        icon={<PlusOutlined />} 
                        onClick={handleAddDepartment}
                      />
                    </Tooltip>
                    <Tooltip title="编辑部门">
                      <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={handleEditDepartment}
                        disabled={!selectedDepartment}
                      />
                    </Tooltip>
                    <Tooltip title="删除部门">
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={handleDeleteDepartment}
                        disabled={!selectedDepartment}
                      />
                    </Tooltip>
                  </Space>
                }
                className="h-full"
              >
                <Tree
                  showIcon
                  defaultExpandAll
                  defaultSelectedKeys={['company']}
                  onSelect={onDepartmentSelect}
                  treeData={mockDepartments}
                />
              </Card>
            </Col>
            
            {/* 员工列表 */}
            <Col span={16}>
              <Card 
                title={
                  selectedDepartment ? 
                    `员工列表 - ${selectedDepartment === 'company' ? '全公司' : mockEmployees.find(e => e.departmentKey === selectedDepartment)?.department}` : 
                    '员工列表'
                }
                extra={
                  <Space>
                    <Search
                      placeholder="搜索员工"
                      allowClear
                      onSearch={onSearchEmployee}
                      style={{ width: 250 }}
                    />
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={handleAddEmployee}
                    >
                      添加员工
                    </Button>
                  </Space>
                }
                className="h-full"
              >
                <Table
                  columns={employeeColumns}
                  dataSource={filteredEmployees}
                  rowKey="key"
                  pagination={{ pageSize: 10 }}
                  scroll={{ y: 400 }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <TeamOutlined />
              部门管理
            </span>
          } 
          key="departments"
        >
          <Card>
            <p>部门详细管理界面。可以在这里进行更复杂的部门设置，如权限配置、知识库访问权限等。</p>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <UserOutlined />
              员工管理
            </span>
          } 
          key="employees"
        >
          <Card>
            <p>员工详细管理界面。可以在这里进行更复杂的员工设置，如角色分配、个人信息详情等。</p>
          </Card>
        </TabPane>
      </Tabs>

      {/* 添加部门模态框 */}
      <Modal
        title="添加部门"
        open={isAddDepartmentModalVisible}
        onOk={submitAddDepartment}
        onCancel={() => {
          setIsAddDepartmentModalVisible(false);
          departmentForm.resetFields();
        }}
      >
        <Form
          form={departmentForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item
            name="parentId"
            label="上级部门"
            rules={[{ required: true, message: '请选择上级部门' }]}
          >
            <Select placeholder="请选择上级部门">
              <Option value="company">公司总部</Option>
              <Option value="tech">技术部</Option>
              <Option value="product">产品部</Option>
              <Option value="design">设计部</Option>
              <Option value="marketing">市场部</Option>
              <Option value="hr">人力资源部</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="部门描述"
          >
            <Input.TextArea rows={4} placeholder="请输入部门描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑部门模态框 */}
      <Modal
        title="编辑部门"
        open={isEditDepartmentModalVisible}
        onOk={submitEditDepartment}
        onCancel={() => {
          setIsEditDepartmentModalVisible(false);
          departmentForm.resetFields();
        }}
      >
        <Form
          form={departmentForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item
            name="parentId"
            label="上级部门"
            rules={[{ required: true, message: '请选择上级部门' }]}
          >
            <Select placeholder="请选择上级部门">
              <Option value="company">公司总部</Option>
              <Option value="tech">技术部</Option>
              <Option value="product">产品部</Option>
              <Option value="design">设计部</Option>
              <Option value="marketing">市场部</Option>
              <Option value="hr">人力资源部</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="部门描述"
          >
            <Input.TextArea rows={4} placeholder="请输入部门描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除部门确认框 */}
      <Modal
        title="删除部门"
        open={isDeleteDepartmentModalVisible}
        onOk={confirmDeleteDepartment}
        onCancel={() => setIsDeleteDepartmentModalVisible(false)}
        okText="删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <p>确定要删除此部门吗？删除部门将同时删除该部门下所有子部门，且无法恢复。</p>
        <p className="text-red-500">注意：该部门下的员工将自动移动到上级部门。</p>
      </Modal>

      {/* 添加员工模态框 */}
      <Modal
        title="添加员工"
        open={isAddEmployeeModalVisible}
        onOk={submitAddEmployee}
        onCancel={() => {
          setIsAddEmployeeModalVisible(false);
          employeeForm.resetFields();
        }}
        width={600}
      >
        <Form
          form={employeeForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="departmentKey"
                label="所属部门"
                rules={[{ required: true, message: '请选择所属部门' }]}
              >
                <Select placeholder="请选择所属部门">
                  <Option value="frontend">技术部 / 前端组</Option>
                  <Option value="backend">技术部 / 后端组</Option>
                  <Option value="qa">技术部 / 测试组</Option>
                  <Option value="product">产品部</Option>
                  <Option value="design">设计部</Option>
                  <Option value="marketing">市场部</Option>
                  <Option value="hr">人力资源部</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="position"
                label="职位"
                rules={[{ required: true, message: '请输入职位' }]}
              >
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
                initialValue="active"
              >
                <Select placeholder="请选择状态">
                  <Option value="active">在职</Option>
                  <Option value="inactive">离职</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="电话"
                rules={[{ required: true, message: '请输入电话' }]}
              >
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 编辑员工模态框 */}
      <Modal
        title="编辑员工"
        open={isEditEmployeeModalVisible}
        onOk={submitEditEmployee}
        onCancel={() => {
          setIsEditEmployeeModalVisible(false);
          employeeForm.resetFields();
          setCurrentEmployee(null);
        }}
        width={600}
      >
        <Form
          form={employeeForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="departmentKey"
                label="所属部门"
                rules={[{ required: true, message: '请选择所属部门' }]}
              >
                <Select placeholder="请选择所属部门">
                  <Option value="frontend">技术部 / 前端组</Option>
                  <Option value="backend">技术部 / 后端组</Option>
                  <Option value="qa">技术部 / 测试组</Option>
                  <Option value="product">产品部</Option>
                  <Option value="design">设计部</Option>
                  <Option value="marketing">市场部</Option>
                  <Option value="hr">人力资源部</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="position"
                label="职位"
                rules={[{ required: true, message: '请输入职位' }]}
              >
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="active">在职</Option>
                  <Option value="inactive">离职</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="电话"
                rules={[{ required: true, message: '请输入电话' }]}
              >
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 删除员工确认框 */}
      <Modal
        title="删除员工"
        open={isDeleteEmployeeModalVisible}
        onOk={confirmDeleteEmployee}
        onCancel={() => {
          setIsDeleteEmployeeModalVisible(false);
          setCurrentEmployee(null);
        }}
        okText="删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <p>确定要删除员工 <Text strong>{currentEmployee?.name}</Text> ({currentEmployee?.id}) 吗？此操作不可恢复。</p>
      </Modal>

      {/* 调整员工部门模态框 */}
      <Modal
        title="调整员工部门"
        open={isTransferEmployeeModalVisible}
        onOk={submitTransferEmployee}
        onCancel={() => {
          setIsTransferEmployeeModalVisible(false);
          transferForm.resetFields();
          setCurrentEmployee(null);
        }}
      >
        <p>正在调整员工 <Text strong>{currentEmployee?.name}</Text> ({currentEmployee?.id}) 的部门</p>
        <Form
          form={transferForm}
          layout="vertical"
        >
          <Form.Item
            name="departmentKey"
            label="调整至部门"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select placeholder="请选择部门">
              <Option value="frontend">技术部 / 前端组</Option>
              <Option value="backend">技术部 / 后端组</Option>
              <Option value="qa">技术部 / 测试组</Option>
              <Option value="product">产品部</Option>
              <Option value="design">设计部</Option>
              <Option value="marketing">市场部</Option>
              <Option value="hr">人力资源部</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default OrganizationPage; 