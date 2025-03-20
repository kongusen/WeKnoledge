import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Typography, 
  Card, 
  Tabs, 
  Form, 
  InputNumber, 
  Select, 
  Switch, 
  Button, 
  Row, 
  Col, 
  Slider, 
  Space, 
  Divider,
  Radio,
  Alert,
  message,
  Tooltip
} from 'antd';
import { 
  SaveOutlined, 
  ExperimentOutlined, 
  DatabaseOutlined, 
  ApiOutlined, 
  SearchOutlined,
  QuestionCircleOutlined,
  SyncOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// 模拟RAG配置数据
const mockRagConfig = {
  // 分片配置
  chunking: {
    chunkSize: 1000,
    chunkOverlap: 200,
    chunkingMethod: 'token', // token, character, paragraph
  },
  // 检索配置
  retrieval: {
    retrievalMode: 'hybrid', // semantic, keyword, hybrid
    semanticWeight: 0.7,
    keywordWeight: 0.3,
    topK: 5,
    scoreThreshold: 0.7,
    useRerank: true,
    rerankModel: 'cohere-rerank-english-v2.0',
    rerankTopK: 3,
  },
  // Embedding配置
  embedding: {
    embeddingModel: 'text-embedding-3-large',
    embeddingDimension: 1536,
    embeddingBatchSize: 100,
    normalizeEmbeddings: true,
  },
  // 高级设置
  advanced: {
    useCache: true,
    cacheTTL: 24, // hours
    maxTokensPerRequest: 4000,
    enableLogging: true,
    logLevel: 'info', // debug, info, warn, error
  }
};

const KnowledgeConfigPage: React.FC = () => {
  const [chunkingForm] = Form.useForm();
  const [retrievalForm] = Form.useForm();
  const [embeddingForm] = Form.useForm();
  const [advancedForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('chunking');
  const [isRetrievalModeHybrid, setIsRetrievalModeHybrid] = useState<boolean>(
    mockRagConfig.retrieval.retrievalMode === 'hybrid'
  );
  const [isUsingRerank, setIsUsingRerank] = useState<boolean>(
    mockRagConfig.retrieval.useRerank
  );

  // 初始化表单值
  React.useEffect(() => {
    chunkingForm.setFieldsValue(mockRagConfig.chunking);
    retrievalForm.setFieldsValue(mockRagConfig.retrieval);
    embeddingForm.setFieldsValue(mockRagConfig.embedding);
    advancedForm.setFieldsValue(mockRagConfig.advanced);
  }, [chunkingForm, retrievalForm, embeddingForm, advancedForm]);

  // 处理检索模式变化
  const handleRetrievalModeChange = (value: string) => {
    setIsRetrievalModeHybrid(value === 'hybrid');
  };

  // 处理是否使用Rerank变化
  const handleRerankChange = (checked: boolean) => {
    setIsUsingRerank(checked);
  };

  // 保存分片配置
  const saveChunkingConfig = () => {
    chunkingForm.validateFields().then(values => {
      console.log('保存分片配置:', values);
      message.success('分片配置已保存');
    }).catch(error => {
      console.log('表单验证失败:', error);
    });
  };

  // 保存检索配置
  const saveRetrievalConfig = () => {
    retrievalForm.validateFields().then(values => {
      console.log('保存检索配置:', values);
      message.success('检索配置已保存');
    }).catch(error => {
      console.log('表单验证失败:', error);
    });
  };

  // 保存Embedding配置
  const saveEmbeddingConfig = () => {
    embeddingForm.validateFields().then(values => {
      console.log('保存Embedding配置:', values);
      message.success('Embedding配置已保存');
    }).catch(error => {
      console.log('表单验证失败:', error);
    });
  };

  // 保存高级设置
  const saveAdvancedConfig = () => {
    advancedForm.validateFields().then(values => {
      console.log('保存高级设置:', values);
      message.success('高级设置已保存');
    }).catch(error => {
      console.log('表单验证失败:', error);
    });
  };

  // 重新生成全部向量库
  const rebuildAllVectorStores = () => {
    if (window.confirm('确定要重新生成全部向量库吗？此操作可能需要较长时间完成，期间可能影响系统性能。')) {
      message.loading('正在重新生成向量库，这可能需要一些时间...');
      // 这里是模拟，实际需要调用API
      setTimeout(() => {
        message.success('向量库重新生成成功');
      }, 3000);
    }
  };

  return (
    <MainLayout userRole="admin">
      <div className="mb-6">
        <Title level={2}>知识库配置</Title>
        <p className="text-gray-500">配置知识库分片方式、检索策略和向量模型</p>
      </div>

      <Tabs 
        defaultActiveKey="chunking" 
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
      >
        {/* 分片配置 */}
        <TabPane 
          tab={
            <span>
              <DatabaseOutlined />
              分片配置
            </span>
          } 
          key="chunking"
        >
          <Card>
            <Alert
              message="分片配置说明"
              description="分片配置决定了文档如何被拆分和存储。适当的分片大小和重叠可以提高检索准确性，但过小的分片可能导致上下文丢失，过大的分片则可能引入噪声。"
              type="info"
              showIcon
              className="mb-6"
            />
            <Form
              form={chunkingForm}
              layout="vertical"
              initialValues={mockRagConfig.chunking}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="chunkSize"
                    label={
                      <Space>
                        <span>分片大小</span>
                        <Tooltip title="每个分片包含的最大token数量。较大的值可以保留更多上下文，较小的值可以提高精度。">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: '请输入分片大小' }]}
                  >
                    <InputNumber
                      min={100}
                      max={8000}
                      step={100}
                      style={{ width: '100%' }}
                      addonAfter="tokens"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="chunkOverlap"
                    label={
                      <Space>
                        <span>分片重叠</span>
                        <Tooltip title="相邻分片之间重叠的token数量。适当的重叠可以保持上下文连贯性。">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: '请输入分片重叠' }]}
                  >
                    <InputNumber
                      min={0}
                      max={1000}
                      step={50}
                      style={{ width: '100%' }}
                      addonAfter="tokens"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="chunkingMethod"
                label={
                  <Space>
                    <span>分片方法</span>
                    <Tooltip title="选择文档分片的基本单位。Token基于模型词汇，字符基于原始文本，段落基于文档自然分隔。">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: '请选择分片方法' }]}
              >
                <Radio.Group>
                  <Radio value="token">基于Token</Radio>
                  <Radio value="character">基于字符</Radio>
                  <Radio value="paragraph">基于段落</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={saveChunkingConfig}
                >
                  保存分片配置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* 检索配置 */}
        <TabPane 
          tab={
            <span>
              <SearchOutlined />
              检索配置
            </span>
          } 
          key="retrieval"
        >
          <Card>
            <Alert
              message="检索配置说明"
              description="检索配置决定了系统如何找到与用户查询相关的内容。可以选择语义检索（基于理解）、关键词检索（基于精确匹配）或混合模式，并通过重排序优化结果。"
              type="info"
              showIcon
              className="mb-6"
            />
            <Form
              form={retrievalForm}
              layout="vertical"
              initialValues={mockRagConfig.retrieval}
            >
              <Form.Item
                name="retrievalMode"
                label={
                  <Space>
                    <span>检索模式</span>
                    <Tooltip title="语义检索理解查询意图，关键词检索进行精确匹配，混合模式结合两者优势。">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: '请选择检索模式' }]}
              >
                <Select onChange={handleRetrievalModeChange}>
                  <Option value="semantic">语义检索</Option>
                  <Option value="keyword">关键词检索</Option>
                  <Option value="hybrid">混合检索</Option>
                </Select>
              </Form.Item>

              {isRetrievalModeHybrid && (
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="semanticWeight"
                      label={
                        <Space>
                          <span>语义检索权重</span>
                          <Tooltip title="在混合检索中语义检索的权重，总和与关键词权重为1">
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      rules={[{ required: true, message: '请设置语义检索权重' }]}
                    >
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        marks={{
                          0: '0',
                          0.5: '0.5',
                          1: '1'
                        }}
                        tipFormatter={value => `${value}`}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="keywordWeight"
                      label={
                        <Space>
                          <span>关键词检索权重</span>
                          <Tooltip title="在混合检索中关键词检索的权重，总和与语义权重为1">
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      rules={[{ required: true, message: '请设置关键词检索权重' }]}
                    >
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        marks={{
                          0: '0',
                          0.5: '0.5',
                          1: '1'
                        }}
                        tipFormatter={value => `${value}`}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="topK"
                    label={
                      <Space>
                        <span>返回结果数量 (Top-K)</span>
                        <Tooltip title="检索返回的最大结果数量。较大的值提供更多信息但可能引入噪声。">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: '请输入返回结果数量' }]}
                  >
                    <InputNumber
                      min={1}
                      max={50}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="scoreThreshold"
                    label={
                      <Space>
                        <span>相关性阈值</span>
                        <Tooltip title="结果必须达到的最小相关性分数（0-1）。较高的值提高精度但可能减少结果数量。">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: '请输入相关性阈值' }]}
                  >
                    <InputNumber
                      min={0}
                      max={1}
                      step={0.05}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">重排序配置</Divider>

              <Form.Item
                name="useRerank"
                label={
                  <Space>
                    <span>启用重排序</span>
                    <Tooltip title="重排序可以优化初始检索结果的顺序，提高最相关结果的排名。">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                valuePropName="checked"
              >
                <Switch onChange={handleRerankChange} />
              </Form.Item>

              {isUsingRerank && (
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      name="rerankModel"
                      label={
                        <Space>
                          <span>重排序模型</span>
                          <Tooltip title="用于重新排序结果的模型。不同模型在精度和性能上有所不同。">
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      rules={[{ required: true, message: '请选择重排序模型' }]}
                    >
                      <Select>
                        <Option value="cohere-rerank-english-v2.0">Cohere Rerank (英文 v2.0)</Option>
                        <Option value="cohere-rerank-multilingual-v2.0">Cohere Rerank (多语言 v2.0)</Option>
                        <Option value="bge-reranker-base">BGE Reranker Base</Option>
                        <Option value="bge-reranker-large">BGE Reranker Large</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="rerankTopK"
                      label={
                        <Space>
                          <span>重排序结果数量</span>
                          <Tooltip title="重排序后返回的最大结果数量，必须小于等于初始检索的Top-K。">
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      rules={[{ required: true, message: '请输入重排序结果数量' }]}
                    >
                      <InputNumber
                        min={1}
                        max={20}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              <Form.Item>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={saveRetrievalConfig}
                >
                  保存检索配置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* Embedding配置 */}
        <TabPane 
          tab={
            <span>
              <ApiOutlined />
              Embedding配置
            </span>
          } 
          key="embedding"
        >
          <Card>
            <Alert
              message="Embedding配置说明"
              description="Embedding是将文本转换为数值向量的过程，是语义检索的基础。选择合适的模型和参数可以提高检索效果和系统性能。"
              type="info"
              showIcon
              className="mb-6"
            />
            <Form
              form={embeddingForm}
              layout="vertical"
              initialValues={mockRagConfig.embedding}
            >
              <Form.Item
                name="embeddingModel"
                label={
                  <Space>
                    <span>Embedding模型</span>
                    <Tooltip title="用于生成文本向量表示的模型。不同模型在性能和向量质量上有所差异。">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: '请选择Embedding模型' }]}
              >
                <Select>
                  <Option value="text-embedding-3-large">OpenAI text-embedding-3-large</Option>
                  <Option value="text-embedding-3-small">OpenAI text-embedding-3-small</Option>
                  <Option value="text-embedding-ada-002">OpenAI text-embedding-ada-002</Option>
                  <Option value="bge-large-zh-v1.5">BGE-large-zh-v1.5</Option>
                  <Option value="bge-large-en-v1.5">BGE-large-en-v1.5</Option>
                  <Option value="m3e-large">M3E-large</Option>
                </Select>
              </Form.Item>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="embeddingDimension"
                    label={
                      <Space>
                        <span>向量维度</span>
                        <Tooltip title="向量的维度大小。较高的维度可以捕获更多信息，但会增加存储和计算成本。">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: '请输入向量维度' }]}
                  >
                    <InputNumber
                      disabled
                      style={{ width: '100%' }}
                      addonAfter="维度"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="embeddingBatchSize"
                    label={
                      <Space>
                        <span>批处理大小</span>
                        <Tooltip title="一次处理的文本块数量。较大的值可以提高处理速度，但需要更多内存。">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: '请输入批处理大小' }]}
                  >
                    <InputNumber
                      min={1}
                      max={1000}
                      style={{ width: '100%' }}
                      addonAfter="文本块"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="normalizeEmbeddings"
                label={
                  <Space>
                    <span>向量归一化</span>
                    <Tooltip title="将向量长度归一化为1，有助于提高相似度计算的准确性。">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Space>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={saveEmbeddingConfig}
                >
                  保存Embedding配置
                </Button>
                <Button 
                  type="default" 
                  icon={<SyncOutlined />}
                  onClick={rebuildAllVectorStores}
                >
                  重新生成全部向量库
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* 高级设置 */}
        <TabPane 
          tab={
            <span>
              <SettingOutlined />
              高级设置
            </span>
          } 
          key="advanced"
        >
          <Card>
            <Alert
              message="高级设置说明"
              description="这些设置影响系统性能和资源使用。建议在了解其影响的情况下进行修改。不恰当的配置可能影响系统稳定性。"
              type="warning"
              showIcon
              className="mb-6"
            />
            <Form
              form={advancedForm}
              layout="vertical"
              initialValues={mockRagConfig.advanced}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="useCache"
                    label={
                      <Space>
                        <span>启用检索缓存</span>
                        <Tooltip title="缓存检索结果可以提高性能，但可能导致结果不是最新的。">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="cacheTTL"
                    label={
                      <Space>
                        <span>缓存有效期</span>
                        <Tooltip title="缓存条目的有效时间，过期后将重新检索。">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: '请输入缓存有效期' }]}
                  >
                    <InputNumber
                      min={1}
                      max={720}
                      style={{ width: '100%' }}
                      addonAfter="小时"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="maxTokensPerRequest"
                label={
                  <Space>
                    <span>单次请求最大Token数</span>
                    <Tooltip title="限制请求中的最大token数量，防止请求过大导致性能问题。">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: '请输入最大Token数' }]}
              >
                <InputNumber
                  min={1000}
                  max={16000}
                  step={1000}
                  style={{ width: '100%' }}
                  addonAfter="tokens"
                />
              </Form.Item>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="enableLogging"
                    label={
                      <Space>
                        <span>启用检索日志</span>
                        <Tooltip title="记录检索请求和结果，用于分析和调试。">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="logLevel"
                    label={
                      <Space>
                        <span>日志级别</span>
                        <Tooltip title="控制日志详细程度，级别越高记录越详细。">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: '请选择日志级别' }]}
                  >
                    <Select>
                      <Option value="error">错误</Option>
                      <Option value="warn">警告</Option>
                      <Option value="info">信息</Option>
                      <Option value="debug">调试</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={saveAdvancedConfig}
                >
                  保存高级设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </MainLayout>
  );
};

export default KnowledgeConfigPage; 