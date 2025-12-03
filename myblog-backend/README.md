# MyBlog 后端服务

基于 Spring Boot 3 的博客系统后端服务，专为 Serverless 和独立部署优化。

## 🚀 快速部署

### 1. 构建和运行 Docker 镜像

```bash
# 构建镜像
docker build -t myblog-backend:latest .

# 运行容器
docker run -d \
  --name myblog-backend \
  -p 8081:8081 \
  -e DB_USERNAME=myblog \
  -e DB_PASSWORD=your_password \
  myblog-backend:latest
```

### 2. 本地开发

```bash
# 使用 Maven 启动
./mvnw spring-boot:run -Dspring.profiles.active=local

# 或设置环境变量后启动
export DB_PASSWORD=your_password
./mvnw spring-boot:run
```

### 3. Serverless 部署

应用已配置为适用于 Serverless 平台。

**重要提示**: 生产环境的数据库凭据已配置在 `application-prod.yml` 文件中，请勿将真实凭据提交到版本控制系统。

通过环境变量可覆盖配置：
- `DB_HOST`: 数据库主机
- `DB_PORT`: 数据库端口
- `DB_NAME`: 数据库名称
- `DB_USERNAME`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `JWT_SECRET`: JWT 密钥

## 📋 服务端口

- **应用**: http://localhost:8081
- **健康检查**: http://localhost:8081/actuator/health
- **应用信息**: http://localhost:8081/actuator/info

## 🔧 配置文件

- **生产环境**: `application-prod.yml` (Serverless/生产环境)
- **开发环境**: `application-local.yml` (本地开发)
- **默认配置**: `application.yml` (基础配置)

## 📁 项目结构

```
src/main/java/           # Java 源码
src/main/resources/      # 配置文件
  ├── application.yml
  ├── application-local.yml
  └── application-prod.yml  # Serverless 专用配置
Dockerfile              # Docker 构建文件
pom.xml                 # Maven 依赖
```

## 🏥 健康检查

```bash
# 检查应用健康状态
curl http://localhost:8081/actuator/health

# 检查应用信息
curl http://localhost:8081/actuator/info
```

## ⚙️ 环境变量

| 变量名 | 说明 |
|--------|------|
| `DB_HOST` | 数据库主机 |
| `DB_PORT` | 数据库端口 |
| `DB_NAME` | 数据库名称 |
| `DB_USERNAME` | 数据库用户名 |
| `DB_PASSWORD` | 数据库密码 |
| `JWT_SECRET` | JWT 签名密钥 |
| `SERVER_PORT` | 应用端口 |

**⚠️ 安全提示**: 请不要在文档或版本控制系统中存储真实的数据库密码和其他敏感信息。

## 🔒 安全配置

- **默认禁用**: Swagger UI、API 文档
- **HTTPS 支持**: 数据库 SSL 连接配置
- **安全头**: 防止 XSS、点击劫持等攻击
- **CORS**: 可通过环境变量配置允许的域名

## 🚨 故障排除

### 应用启动失败
1. 检查数据库连接：确保 `10.43.112.18:3306` 可访问
2. 验证数据库凭据：用户名和密码是否正确
3. 查看应用日志：`docker logs myblog-backend`

### 健康检查失败
1. 确认应用已完全启动（等待 30 秒）
2. 检查端口 8081 是否被占用
3. 验证网络配置

### 数据库连接问题
```bash
# 测试数据库连接
mysql -h 10.43.112.18 -P 3306 -u myblog -p -e "SELECT 1;"
```