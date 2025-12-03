# MyBlog 服务器部署文档

## 服务器环境

- **服务器 IP**: 49.235.139.118
- **操作系统**: OpenCloudOS (RHEL/CentOS 兼容)
- **已安装服务**:
  - MySQL: 端口 13306 (容器端口映射)
  - Redis: 端口 26739 (容器端口映射)
  - Elasticsearch: 端口 9200
  - Nginx: 已安装
  - Java 21: 已安装

## 部署架构

```
Internet
    ↓
Nginx (80)
    ├─→ Frontend (Docker容器:3000) → Nginx:8080
    └─→ Backend API (Docker容器:8081)
            ↓
    MySQL/Redis/ES (宿主机服务)
```

## 部署步骤

### 准备工作

#### 1. 上传项目到服务器

```bash
# 方式一：使用 Git
ssh root@49.235.139.118
cd /app
git clone <your-repo-url> myblog
cd myblog

# 方式二：使用 scp
scp -r /path/to/myblog root@49.235.139.118:/app/
```

#### 2. 配置环境变量

```bash
cd /app/myblog
cp .env.prod.example .env.prod
vi .env.prod
```

**必须配置的变量**：
```env
# MySQL配置
MYSQL_USERNAME=myblog_user
MYSQL_PASSWORD=<your-mysql-password>

# Redis配置（如果设置了密码）
REDIS_PASSWORD=<your-redis-password>

# JWT密钥（至少32位随机字符串）
JWT_SECRET=<your-jwt-secret-min-32-chars>

# 服务器IP
SERVER_IP=49.235.139.118
```

**生成JWT密钥**：
```bash
# 方式一：使用openssl
openssl rand -base64 32

# 方式二：使用/dev/urandom
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
```

### 步骤 1: 服务器环境初始化

```bash
cd /app/myblog/deploy
chmod +x *.sh

# 安装Docker和配置环境
sudo ./server-setup.sh
```

这个脚本会：
- 安装 Docker 和 Docker Compose
- 配置防火墙开放必要端口
- 创建应用目录
- 优化系统参数
- 配置Docker日志轮转

### 步骤 2: 初始化数据库

```bash
cd /app/myblog/deploy
./init-database.sh
```

这个脚本会：
- 创建 `myblog` 数据库
- 创建数据库用户 `myblog_user` 并授权
- 执行初始化SQL脚本
- 插入默认数据（分类、标签、示例文章）

**默认管理员账号**：
- 用户名: `admin`
- 密码: `admin123`（首次登录后请立即修改）

### 步骤 3: 部署应用

```bash
cd /app/myblog/deploy
./deploy.sh
```

部署过程：
1. 停止旧容器
2. 构建Docker镜像（后端+前端）
3. 启动服务
4. 健康检查

**预计耗时**: 5-10分钟（首次构建）

### 步骤 4: 配置Nginx反向代理

```bash
# 复制Nginx配置
sudo cp /app/myblog/nginx/myblog.conf /etc/nginx/conf.d/

# 创建上传文件访问目录软链接
sudo ln -s /app/myblog/data/backend/uploads /app/myblog/uploads

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

### 步骤 5: 验证部署

#### 检查服务状态
```bash
cd /app/myblog
docker-compose -f docker-compose.prod.yml ps
```

应该看到两个容器都是 `Up` 状态。

#### 访问测试
- **前端**: http://49.235.139.118
- **后端健康检查**: http://49.235.139.118/api/actuator/health
- **API文档**: http://49.235.139.118/api/doc.html

#### 查看日志
```bash
cd /app/myblog/deploy
./logs.sh
```

## 日常维护

### 查看服务状态

```bash
cd /app/myblog
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志

```bash
cd /app/myblog/deploy
./logs.sh

# 或直接查看
docker logs myblog-backend
docker logs myblog-frontend
docker logs -f myblog-backend  # 实时跟踪
```

### 重启服务

```bash
cd /app/myblog
docker-compose -f docker-compose.prod.yml restart

# 重启单个服务
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
```

### 停止服务

```bash
cd /app/myblog/deploy
./stop.sh
```

### 更新应用

```bash
# 1. 拉取最新代码
cd /app/myblog
git pull

# 2. 重新部署
cd deploy
./deploy.sh
```

### 数据备份

```bash
cd /app/myblog/deploy
./backup.sh
```

备份文件位置: `/app/myblog/backups/`

**建议**：
- 每天自动备份（配置cron任务）
- 定期下载备份到本地
- 保留最近30天的备份

#### 配置自动备份

```bash
# 编辑crontab
crontab -e

# 添加每天凌晨2点自动备份
0 2 * * * /app/myblog/deploy/backup.sh >> /app/myblog/backups/backup.log 2>&1
```

### 恢复数据

```bash
# 1. 解压备份文件
cd /app/myblog/backups
gunzip myblog_db_20250103_020000.sql.gz

# 2. 恢复数据库
mysql -h127.0.0.1 -P13306 -umyblog_user -p myblog < myblog_db_20250103_020000.sql

# 3. 恢复上传文件
tar -xzf myblog_uploads_20250103_020000.tar.gz -C /app/myblog/data/backend/
```

## 监控和优化

### 查看资源使用

```bash
# 容器资源使用
docker stats

# 磁盘使用
df -h
du -sh /app/myblog/data/*

# 日志大小
du -sh /app/myblog/data/backend/logs
```

### 清理日志

```bash
# 清理应用日志（保留最近7天）
find /app/myblog/data/backend/logs -name "*.log" -mtime +7 -delete

# 清理Docker日志
truncate -s 0 $(docker inspect --format='{{.LogPath}}' myblog-backend)
truncate -s 0 $(docker inspect --format='{{.LogPath}}' myblog-frontend)
```

### 性能优化建议

1. **MySQL优化**
   - 定期执行 `ANALYZE TABLE` 优化表
   - 检查慢查询日志
   - 适当增加缓冲池大小

2. **Redis优化**
   - 启用持久化（AOF/RDB）
   - 设置合理的过期策略
   - 监控内存使用

3. **Nginx优化**
   - 启用gzip压缩（已配置）
   - 配置静态资源缓存（已配置）
   - 启用HTTP/2（需要HTTPS）

## 安全建议

### 1. 修改默认密码

```bash
# 修改MySQL root密码
mysql -h127.0.0.1 -P13306 -uroot -p
ALTER USER 'root'@'%' IDENTIFIED BY 'new_secure_password';

# 登录后台修改admin密码
访问: http://49.235.139.118
使用 admin/admin123 登录后立即修改密码
```

### 2. 配置防火墙

```bash
# 只开放必要端口
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# 不要对外开放 MySQL、Redis、ES 的端口
```

### 3. 启用HTTPS（推荐）

如果有域名，可以使用Let's Encrypt免费证书：

```bash
# 安装certbot
sudo yum install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 4. 定期更新

```bash
# 更新系统
sudo yum update -y

# 更新Docker镜像
docker pull eclipse-temurin:21-jre-alpine
docker pull nginx:alpine
```

## 故障排查

### 后端启动失败

```bash
# 查看详细日志
docker logs myblog-backend

# 常见问题：
# 1. 数据库连接失败 -> 检查 .env.prod 中的数据库配置
# 2. Redis连接失败 -> 检查Redis是否运行，端口是否正确
# 3. ES连接失败 -> 检查Elasticsearch是否运行
```

### 前端无法访问

```bash
# 检查容器状态
docker ps -a | grep myblog-frontend

# 检查Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### 数据库连接问题

```bash
# 测试从容器内访问宿主机MySQL
docker exec -it myblog-backend sh
curl -v telnet://host.docker.internal:13306

# 检查MySQL是否监听正确端口
netstat -tlnp | grep 13306
```

### 内存不足

```bash
# 查看内存使用
free -h

# 降低JVM内存限制
# 编辑 docker-compose.prod.yml 中的 JAVA_OPTS
JAVA_OPTS: "-Xms512m -Xmx1g ..."
```

## 联系支持

如有问题，请查看：
- 后端日志: `docker logs myblog-backend`
- 前端日志: `docker logs myblog-frontend`
- Nginx日志: `/var/log/nginx/myblog_error.log`

## 附录

### 端口清单

| 服务 | 宿主机端口 | 容器端口 | 说明 |
|------|-----------|----------|------|
| Nginx | 80 | - | HTTP入口 |
| 前端 | 3000 | 8080 | React应用 |
| 后端 | 8081 | 8081 | Spring Boot API |
| MySQL | 13306 | 3306 | 数据库（容器） |
| Redis | 26739 | 6379 | 缓存（容器） |
| ES | 9200 | 9200 | 搜索引擎（容器） |

### 重要文件路径

- 项目目录: `/app/myblog`
- 配置文件: `/app/myblog/.env.prod`
- 日志目录: `/app/myblog/data/backend/logs`
- 上传文件: `/app/myblog/data/backend/uploads`
- 备份目录: `/app/myblog/backups`
- Nginx配置: `/etc/nginx/conf.d/myblog.conf`

### 有用的命令

```bash
# 进入容器
docker exec -it myblog-backend sh
docker exec -it myblog-frontend sh

# 查看容器资源
docker stats myblog-backend myblog-frontend

# 导出容器日志
docker logs myblog-backend > backend.log 2>&1

# 清理未使用的Docker资源
docker system prune -a
```
