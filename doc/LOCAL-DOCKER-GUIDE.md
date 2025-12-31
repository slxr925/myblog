# MyBlog 本地 Docker 开发环境使用手册

## 概述

本手册介绍如何使用 Docker 在本地搭建完整的 MyBlog 开发环境，包括前端、后端和所有依赖的基础设施服务。

## 环境架构

### 服务列表

| 服务名 | 镜像 | 容器名 | 端口映射 | 用途 |
|--------|------|--------|----------|------|
| MySQL | `mysql:8.0` | `myblog-mysql` | `3307:3306` | 数据库 |
| Redis | `redis:7-alpine` | `myblog-redis` | `6380:6379` | 缓存 |
| Elasticsearch | `elasticsearch:8.11.0` | `myblog-elasticsearch` | `9200:9200` | 全文搜索 |
| Kafka | `apache/kafka:3.7.0` | `myblog-kafka` | `9092:9092` | 消息队列 |
| Kafka UI | `provectuslabs/kafka-ui:latest` | `myblog-kafka-ui` | `8088:8080` | Kafka管理界面 |
| Backend | `myblog-backend` | `myblog-backend` | `8081:8081` | Spring Boot后端 |
| Frontend | `myblog-frontend` | `myblog-frontend` | `3000:3000` | React前端 |

### 网络配置

所有容器运行在同一 Docker 网络 `myblog-network` 中，容器间通过服务名相互访问。

## 快速开始

### 首次部署

```bash
# 1. 进入项目根目录
cd /path/to/myblog

# 2. 执行快速部署脚本
./deploy/local/quick-deploy.sh

# 等待所有服务启动（约1-2分钟）
```

### 完整更新部署

```bash
# 构建最新镜像并部署（推荐用于代码变更后）
./deploy/local/deploy-update.sh

# 强制重新构建（忽略缓存）
./deploy/local/deploy-update.sh --rebuild
```

### 停止服务

```bash
# 停止所有容器
./deploy/local/stop.sh

# 停止并删除数据卷（重置数据库）
docker compose down -v
```

## 服务详细说明

### 1. MySQL 数据库

**容器名**: `myblog-mysql`  
**端口**: `localhost:3307`  
**账号**: `root` / `xr123321`  
**数据库**: `myblog`

#### 连接方式

```bash
# 通过宿主机连接
mysql -h 127.0.0.1 -P 3307 -u root -pxr123321 myblog

# 进入容器内连接
docker exec -it myblog-mysql mysql -uroot -pxr123321 myblog
```

#### 数据初始化

- **自动初始化**: 首次启动时自动执行 `config/mysql/init.sql`
- **包含内容**: 
  - 完整表结构
  - 默认分类/标签/管理员
  - 16篇测试文章（开发用）

#### 数据持久化

数据存储在 Docker volume `myblog_mysql_data` 中，容器重启数据不丢失。

**重置数据库**:
```bash
docker compose down -v  # 删除数据卷
./deploy/local/quick-deploy.sh  # 重新部署，自动初始化
```

---

### 2. Redis 缓存

**容器名**: `myblog-redis`  
**端口**: `localhost:6380`  
**密码**: 无

#### 连接方式

```bash
# 通过宿主机连接
redis-cli -h 127.0.0.1 -p 6380

# 进入容器内连接
docker exec -it myblog-redis redis-cli
```

#### 用途

- 用户 Session 缓存
- 文章点赞数据缓存
- 热点数据缓存

---

### 3. Elasticsearch 搜索引擎

**容器名**: `myblog-elasticsearch`  
**端口**: `localhost:9200`  
**认证**: 已禁用（开发环境）

#### 访问方式

```bash
# 健康检查
curl http://localhost:9200/_cluster/health

# 查看索引
curl http://localhost:9200/_cat/indices?v
```

#### 用途

- 文章全文搜索
- 标题/内容关键词检索
- 搜索结果高亮

---

### 4. Kafka 消息队列

**容器名**: `myblog-kafka`  
**端口**: `localhost:9092`  
**模式**: KRaft（无需 Zookeeper）

#### 主题列表

- `blog-notifications`: 通知事件主题
- `blog-notifications-dlq`: 死信队列

#### 使用 Kafka UI 管理

访问 **http://localhost:8088** 查看：
- Topic 列表和消息
- Consumer Group 状态
- 实时消息流

#### 命令行操作

```bash
# 列出所有 Topic
docker exec myblog-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list

# 查看消费者组
docker exec myblog-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --list

# 消费消息（测试）
docker exec myblog-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic blog-notifications \
  --from-beginning
```

---

### 5. 后端服务 (Spring Boot)

**容器名**: `myblog-backend`  
**端口**: `localhost:8081`  
**启动模式**: 开发模式（`mvn spring-boot:run`）

#### 访问地址

- **API 基础路径**: http://localhost:8081
- **Swagger 文档**: http://localhost:8081/doc.html
- **健康检查**: http://localhost:8081/actuator/health

#### 环境配置

使用 Profile: `docker-local` (`application-docker-local.yml`)

**主要配置**:
- 数据库: `mysql:3306` (容器内网络)
- Redis: `redis:6379`
- Kafka: `kafka:9092`
- Elasticsearch: `elasticsearch:9200`

#### 热重载

代码修改后，Maven 会自动重新编译并重启应用（可能需要等待10-30秒）。

**查看日志**:
```bash
docker logs -f myblog-backend
```

---

### 6. 前端服务 (React + Vite)

**容器名**: `myblog-frontend`  
**端口**: `localhost:3000`  
**启动模式**: 开发模式（`npm run dev`）

#### 访问地址

- **首页**: http://localhost:3000
- **API 代理**: 前端通过 `VITE_API_BASE_URL=http://localhost:8081` 访问后端

#### 热重载

前端代码修改后，Vite 会自动编译并刷新浏览器（秒级响应）。

**查看日志**:
```bash
docker logs -f myblog-frontend
```

---

## 常用操作

### 查看日志

```bash
# 使用脚本（推荐）
./deploy/local/logs.sh

# 或手动查看
docker logs -f myblog-backend   # 后端
docker logs -f myblog-frontend  # 前端
docker logs -f myblog-mysql     # 数据库
```

### 重启单个服务

```bash
docker compose restart backend
docker compose restart frontend
docker compose restart mysql
```

### 进入容器调试

```bash
docker exec -it myblog-backend bash
docker exec -it myblog-mysql bash
```

### 查看容器状态

```bash
docker compose ps
```

## 测试访问指南

### 前端界面

1. **首页**: http://localhost:3000
2. **登录**: 使用默认管理员账号
   - 用户名: `admin`
   - 密码: `admin123`
3. **功能测试**:
   - 浏览文章（已预置16篇）
   - 发表评论
   - 点赞文章
   - 关注用户
   - 查看通知

### 后端 API

1. **API 文档**: http://localhost:8081/doc.html
2. **健康检查**: http://localhost:8081/actuator/health
3. **示例请求**:
   ```bash
   # 获取文章列表
   curl http://localhost:8081/api/blogs?page=1&size=10
   
   # 登录
   curl -X POST http://localhost:8081/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

### Kafka 消息流

1. 访问 **Kafka UI**: http://localhost:8088
2. 触发通知事件（评论/点赞/关注）
3. 在 Kafka UI 中查看 `blog-notifications` 主题的消息

### 数据库数据

```bash
# 查看文章数量
docker exec myblog-mysql mysql -uroot -pxr123321 -e \
  "SELECT COUNT(*) FROM myblog.tb_blog;"

# 查看用户列表
docker exec myblog-mysql mysql -uroot -pxr123321 -e \
  "SELECT id, username, nickname FROM myblog.tb_user;"
```

## 故障排查

### 服务启动失败

```bash
# 查看详细日志
docker logs myblog-backend
docker logs myblog-mysql

# 检查健康状态
docker compose ps
```

### 数据库连接失败

1. 确认 MySQL 容器已启动且 Healthy
2. 检查端口映射: `docker compose ps | grep mysql`
3. 验证密码: `xr123321`

### 端口冲突

如果 `3307` 或 `6380` 端口被占用：
1. 修改 `docker-compose.yml` 中的端口映射
2. 重新启动服务

### 完全重置环境

```bash
# 1. 停止并删除所有容器和数据
docker compose down -v

# 2. 删除镜像（可选）
docker rmi myblog-backend myblog-frontend

# 3. 重新部署
./deploy/local/quick-deploy.sh
```

## 数据文件说明

### SQL 脚本位置

所有 SQL 文件位于 `myblog-backend/database/`:

| 文件 | 用途 | 适用环境 |
|------|------|----------|
| `init.sql` | 完整数据库初始化 | 开发/首次部署 |
| `seed_data.sql` | 测试文章数据（16篇） | 仅开发环境 |
| `migrate-notification.sql` | 通知系统迁移 | 生产环境增量更新 |

### Docker 自动初始化

`config/mysql/init.sql` = `init.sql` + `migrate-notification.sql` + `seed_data.sql`

此文件会在 MySQL 容器首次启动时自动执行。

## 开发工作流

### 日常开发

1. **启动环境**:
   ```bash
   ./deploy/local/quick-deploy.sh
   ```

2. **修改代码**:
   - 后端代码修改后自动热重载（等待约20秒）
   - 前端代码修改后自动刷新浏览器

3. **测试功能**:
   - 访问 http://localhost:3000 测试前端
   - 访问 http://localhost:8081/doc.html 测试 API

4. **查看日志**:
   ```bash
   ./deploy/local/logs.sh
   ```

### 版本更新部署

```bash
# 代码修改后完整更新
./deploy/local/deploy-update.sh

# 强制重建（清除缓存）
./deploy/local/deploy-update.sh --rebuild
```

### 数据重置

```bash
# 重置数据库（恢复16篇测试文章）
docker compose down -v
./deploy/local/quick-deploy.sh
```

## 性能优化建议

1. **Docker Desktop 配置**:
   - 内存: 至少 4GB
   - CPU: 至少 2 核

2. **减少构建时间**:
   - 使用 `quick-deploy.sh` 而非 `--rebuild`
   - Maven 依赖已缓存到 `~/.m2`

3. **日志管理**:
   ```bash
   # 清理旧日志
   docker system prune -a
   ```

## 总结

- ✅ 一键部署完整开发环境
- ✅ 自动初始化数据库（含测试数据）
- ✅ 支持热重载（前后端）
- ✅ 端口隔离（避免与本地服务冲突）
- ✅ 数据持久化（容器重启不丢失）

**常用命令速查**:
```bash
./deploy/local/quick-deploy.sh      # 快速部署
./deploy/local/deploy-update.sh     # 完整更新
./deploy/local/stop.sh               # 停止服务
./deploy/local/logs.sh               # 查看日志
docker compose ps                    # 查看状态
docker compose down -v               # 完全重置
```

**访问地址速查**:
- 前端: http://localhost:3000
- 后端: http://localhost:8081
- API文档: http://localhost:8081/doc.html
- Kafka UI: http://localhost:8088
