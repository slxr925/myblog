# 基础阶段
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# 开发阶段 (Local Development)
# 使用方法: docker build --target dev -t myblog-frontend:dev .
FROM base AS dev
COPY . .
ENV VITE_API_BASE_URL=http://localhost:8081
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# 构建阶段 (Production Build)
FROM base AS builder
COPY . .
RUN npm run build

# 生产阶段 (Production Runtime with Nginx)
FROM nginx:alpine AS prod

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 权限设置和用户创建
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

USER nextjs

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]