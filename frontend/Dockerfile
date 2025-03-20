FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY package.json package-lock.json* ./
RUN npm ci

# 复制源代码
COPY . .

# 开发环境配置
FROM base AS development
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# 生产环境构建
FROM base AS build
ENV NODE_ENV=production
RUN npm run build

# 生产环境运行
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# 复制构建产物和依赖
COPY --from=build /app/next.config.js ./
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"] 