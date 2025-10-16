# MyBlog Docker 部署指南

## 🐳 Docker 镜像构建与部署

### 快速开始

#### 1. 构建镜像
```bash
# 在项目根目录执行
docker build -t myblog-backend:latest .
```

#### 2. 运行容器
```bash
# 简单运行（需要外部数据库服务）
docker run -d \
  --name myblog-backend \
  -p 8081:8081 \
  -e DB_HOST=your-db-host \
  -e DB_USERNAME=your-db-user \
  -e DB_PASSWORD=your-db-password \
  myblog-backend:latest
```

#### 3. 使用 Docker Compose（推荐）
```bash
# 复制环境变量配置
cp .env.example .env

# 编辑环境变量
vim .env

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f myblog-backend
```

## 📋 环境变量配置

### 生产环境配置文件
项目包含专门的生产环境配置文件 `application-prod.yml`，针对生产环境进行了以下优化：

#### 🔒 安全配置
- **数据库连接**: 启用 SSL 连接，优化连接池配置
- **日志配置**: 生产级别日志，自动轮转和大小限制
- **API 文档**: 默认禁用 Swagger 和 Knife4j
- **敏感信息**: 通过环境变量传递，不硬编码

#### ⚡ 性能优化
- **JVM 参数**: 针对容器环境优化的内存配置
- **连接池**: HikariCP 连接池优化配置
- **缓存**: 启用二级缓存和查询缓存
- **压缩**: 启用 HTTP 压缩和 HTTP/2

#### 📊 监控配置
- **健康检查**: 限制暴露的 Actuator 端点
- **指标收集**: 启用 JVM 和应用指标
- **磁盘空间**: 监控磁盘使用情况

### 必需的环境变量
```bash
# 数据库配置
DB_HOST=mysql                    # 数据库主机
DB_PORT=3306                     # 数据库端口
DB_NAME=myblog                   # 数据库名称
DB_USERNAME=myblog               # 数据库用户名
DB_PASSWORD=your-secure-password # 数据库密码

# JWT 配置
JWT_SECRET=your-jwt-secret-key   # JWT 密钥（生产环境必须设置，至少256位）
```

### 可选的环境变量
```bash
# Redis 配置
REDIS_HOST=redis                 # Redis 主机
REDIS_PORT=6379                  # Redis 端口
REDIS_PASSWORD=                  # Redis 密码
REDIS_DATABASE=0                 # Redis 数据库

# Elasticsearch 配置
ELASTICSEARCH_HOST=elasticsearch # ES 主机
ELASTICSEARCH_PORT=9200          # ES 端口

# 文件上传配置
UPLOAD_PATH=/app/uploads         # 上传文件路径
UPLOAD_URL_PREFIX=/uploads       # 访问前缀
UPLOAD_MAX_FILE_SIZE=10          # 最大文件大小(MB)
UPLOAD_MAX_IMAGE_SIZE=5          # 最大图片大小(MB)

# 应用配置
SPRING_PROFILES_ACTIVE=prod      # Spring 配置文件
```

## 🔧 Serverless 平台部署

### Vercel 部署

#### 1. 创建 `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "Dockerfile",
      "use": "@vercel/docker"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "myblog-backend"
    }
  ],
  "env": {
    "DB_HOST": "@db_host",
    "DB_USERNAME": "@db_username",
    "DB_PASSWORD": "@db_password",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

#### 2. 部署命令
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod

# 设置环境变量
vercel env add DB_HOST
vercel env add DB_USERNAME
vercel env add DB_PASSWORD
vercel env add JWT_SECRET
```

### Railway 部署

#### 1. 创建 `railway.toml`
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "java -jar app.jar"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "myblog-backend"

[services.variables]
SPRING_PROFILES_ACTIVE = "prod"
```

#### 2. Railway CLI 部署
```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 部署
railway up

# 设置环境变量
railway variables set DB_HOST=your-db-host
railway variables set DB_USERNAME=your-db-user
railway variables set DB_PASSWORD=your-db-password
railway variables set JWT_SECRET=your-jwt-secret
```

### Render 部署

#### 1. 创建 `render.yaml`
```yaml
services:
  - type: web
    name: myblog-backend
    env: docker
    dockerfilePath: ./Dockerfile
    plan: free
    envVars:
      - key: SPRING_PROFILES_ACTIVE
        value: prod
      - key: DB_HOST
        value: your-db-host
      - key: DB_USERNAME
        value: your-db-user
      - key: DB_PASSWORD
        value: your-db-password
      - key: JWT_SECRET
        value: your-jwt-secret
    healthCheckPath: /actuator/health
```

## 🏥 健康检查

应用提供以下健康检查端点：

- **健康检查**: `GET /actuator/health`
- **应用信息**: `GET /actuator/info`
- **指标监控**: `GET /actuator/metrics`

健康检查响应示例：
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "MySQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 250685575168,
        "free": 91833579520,
        "threshold": 10485760,
        "path": "/app"
      }
    }
  }
}
```

## 📊 监控与日志

### 日志配置
- **应用日志**: `/app/logs/myblog.log`
- **访问日志**: `/app/logs/access.log`
- **错误日志**: `/app/logs/error.log`

### 性能监控
```bash
# 查看容器资源使用
docker stats myblog-backend

# 查看容器日志
docker logs -f myblog-backend

# 进入容器调试
docker exec -it myblog-backend sh
```

## 🔒 安全配置

### 生产环境安全检查清单
- [ ] 设置强密码的 JWT_SECRET
- [ ] 启用数据库 SSL 连接
- [ ] 配置防火墙规则
- [ ] 定期更新依赖
- [ ] 启用日志监控
- [ ] 配置备份策略

### Docker 安全最佳实践
```bash
# 使用非 root 用户运行
USER myblog

# 只读文件系统
--read-only

# 临时文件系统
--tmpfs /tmp

# 限制资源使用
--memory=512m
--cpus=0.5
```

## 🚨 故障排除

### 常见问题

#### 1. 应用启动失败
```bash
# 查看详细日志
docker logs myblog-backend

# 检查环境变量
docker exec myblog-backend env | grep -E "(DB_|REDIS_|JWT_)"
```

#### 2. 数据库连接失败
```bash
# 测试数据库连接
docker exec myblog-backend telnet mysql 3306

# 检查数据库状态
docker exec myblog-mysql mysql -u root -p -e "SHOW PROCESSLIST;"
```

#### 3. 内存不足
```bash
# 调整 JVM 参数
docker run -e JAVA_OPTS="-Xms128m -Xmx256m" myblog-backend

# 监控内存使用
docker stats --no-stream myblog-backend
```

## 📝 更新与维护

### 更新应用
```bash
# 重新构建镜像
docker build -t myblog-backend:v2.0.0 .

# 停止旧容器
docker stop myblog-backend

# 启动新容器
docker run -d --name myblog-backend-new myblog-backend:v2.0.0

# 验证新版本
curl http://localhost:8081/actuator/health
```

### 数据备份
```bash
# MySQL 备份
docker exec myblog-mysql mysqldump -u root -p myblog > backup.sql

# Redis 备份
docker exec myblog-redis redis-cli BGSAVE
docker cp myblog-redis:/data/dump.rdb ./redis-backup.rdb
```