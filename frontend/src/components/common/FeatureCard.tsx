import React, { ReactNode } from 'react';
import { Card } from 'antd';
import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  comingSoon?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  href,
  comingSoon = false,
}) => {
  return (
    <Link href={comingSoon ? '#' : href}>
      <Card
        hoverable
        className={`transition-all duration-300 transform hover:scale-105 h-full ${
          comingSoon ? 'opacity-80' : ''
        }`}
        bodyStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {comingSoon && (
          <div className="absolute top-0 right-0 bg-yellow-400 text-white py-1 px-3 text-xs transform rotate-45 translate-x-2 -translate-y-1 z-10">
            即将上线
          </div>
        )}

        <div className="flex justify-center items-center mb-4">
          <div className="text-primary text-4xl">{icon}</div>
        </div>
        
        <h3 className="text-lg font-medium text-center mb-2">{title}</h3>
        <p className="text-gray-500 text-sm text-center">{description}</p>
      </Card>
    </Link>
  );
};

export default FeatureCard; 