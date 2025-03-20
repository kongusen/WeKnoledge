/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'antd', 
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-table',
    'rc-field-form',
    'rc-select',
    'rc-cascader',
    'rc-checkbox',
    'rc-dropdown',
    'rc-menu',
    'rc-input',
    'rc-input-number',
    'rc-tooltip',
    '@ant-design'
  ],
  images: {
    domains: ['localhost'],
  },
  eslint: {
    dirs: ['src'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
