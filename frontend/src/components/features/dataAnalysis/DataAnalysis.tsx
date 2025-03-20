import React from 'react';
import { LineChartOutlined } from '@ant-design/icons';
import { Button } from 'antd';

const DataAnalysis: React.FC = () => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden">
      {/* 研发中水印 */}
      <div className="absolute top-0 right-0 bg-yellow-400 text-white py-1 px-3 text-xs transform rotate-45 translate-x-2 -translate-y-1">
        即将上线
      </div>
      
      <div className="text-center mb-4">
        <LineChartOutlined className="text-4xl text-gray-400 mb-2" />
        <h3 className="text-lg font-medium">数据分析</h3>
        <p className="text-gray-500 text-sm">智能分析数据，生成可视化图表</p>
      </div>
      
      <div className="py-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <LineChartOutlined className="text-2xl text-gray-400" />
        </div>
        <p className="text-gray-400 mb-4">功能研发中，敬请期待...</p>
        <Button disabled className="opacity-60">
          敬请期待
        </Button>
      </div>
    </div>
  );
};

export default DataAnalysis; 