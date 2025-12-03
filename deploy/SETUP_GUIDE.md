# 服务器部署完整指南

## 准备工作

### 1. 上传项目到服务器

```bash
# 在本地执行
cd /Users/xuran/Dev/myblog
tar -czf myblog.tar.gz --exclude=node_modules --exclude=target --exclude=.git myblog-backend myblog-frontend nginx deploy docker-compose.prod.yml DEPLOYMENT.md

# 上传到服务器
scp myblog.tar.gz root@49.235.139.118:/app/

# 在服务器上解压
ssh root@49.235.139.118
cd /app
tar -xzf myblog.tar.gz
mv myblog-backend myblog-frontend nginx deploy docker-compose.prod.yml DEPLOYMENT.md myblog/
cd myblog
```

### 2. 创建环境变量文件

在服务器上创建 `.env.prod` 文件：

```bash
cd /app/myblog

# 创建环境变量文件
cat > .env.prod << 'EOF'
# MySQL配置 (端口: 13306)
MYSQL_USERNAME=myblog_user
MYSQL_PASSWORD=YourSecureMysqlPassword123!

# Redis配置 (端口: 26739)
REDIS_PASSWORD=

# Elasticsearch配置 (端口: 9200)
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_ENABLED=true

# JWT配置 (生成方式: openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# 服务器配置
SERVER_IP=49.235.139.118
EOF

# 设置文件权限
chmod 600 .env.prod
```

**重要**: 请修改上面的 `MYSQL_PASSWORD` 为您的实际MySQL密码！

## 快速部署（推荐）

```bash
cd /app/myblog/deploy
chmod +x *.sh

# 一键部署
sudo ./quick-deploy.sh
```

这个脚本会自动执行所有步骤，包括环境检查、数据库初始化、应用部署和Nginx配置。

## 手动部署（详细步骤）

### 步骤 1: 初始化服务器环境

```bash
cd /app/myblog/deploy
sudo ./server-setup.sh
```

### 步骤 2: 初始化数据库

```bash
./init-database.sh
```

**注意**: 如果脚本执行失败，可手动执行：

```bash
# 连接MySQL
mysql -h127.0.0.1 -P13306 -uroot -p

# 执行以下SQL
CREATE DATABASE IF NOT EXISTS myblog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'myblog_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON myblog.* TO 'myblog_user'@'%';
FLUSH PRIVILEGES;
USE myblog;
SOURCE /app/myblog/myblog-backend/database/init.sql;
```

### 步骤 3: 部署应用

```bash
./deploy.sh
```

### 步骤 4: 配置Nginx反向代理

```bash
# 复制配置文件
sudo cp /app/myblog/nginx/myblog.conf /etc/nginx/conf.d/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

### 步骤 5: 验证部署

```bash
# 检查容器状态
docker ps | grep myblog

# 测试后端API
curl http://localhost:8081/actuator/health

# 测试前端
curl http://localhost:3000/health

# 通过Nginx访问
curl http://49.235.139.118
```

## 访问地址

部署成功后，可以通过以下地址访问：

- **博客首页**: http://49.235.139.118
- **后端API**: http://49.235.139.118/api/
- **API文档**: http://49.235.139.118/api/doc.html
- **健康检查**: http://49.235.139.118/api/actuator/health

## 默认账号

**管理员账号**:
- 用户名: `admin`
- 密码: `admin123`

⚠️ **首次登录后请立即修改密码！**

## 故障排查

### 问题1: 容器无法启动

```bash
# 查看详细日志
docker logs myblog-backend
docker logs myblog-frontend

# 检查容器状态
docker ps -a | grep myblog

# 检查网络
docker network inspect myblog-network
```

### 问题2: 数据库连接失败

```bash
# 从容器内测试连接
docker exec -it myblog-backend sh
telnet host.docker.internal 13306

# 检查MySQL是否监听
netstat -tlnp | grep 13306

# 验证用户权限
mysql -h127.0.0.1 -P13306 -umyblog_user -p
```

### 问题3: Nginx 502 错误

```bash
# 检查后端是否启动
curl http://localhost:8081/actuator/health

# 检查Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/myblog_error.log
```

### 问题4: 前端页面空白

```bash
# 检查前端容器日志
docker logs myblog-frontend

# 检查前端构建产物
docker exec -it myblog-frontend ls -la /usr/share/nginx/html

# 查看浏览器控制台错误
```

## 性能优化建议

### 1. 增加服务器资源

如果服务器配置较低，建议：
- 最低: 2核4G
- 推荐: 4核8G

### 2. 调整JVM参数

编辑 `docker-compose.prod.yml`:
```yaml
environment:
  JAVA_OPTS: "-Xms512m -Xmx1g -XX:+UseG1GC"
```

### 3. 配置CDN

将静态资源（图片、CSS、JS）托管到CDN，提升访问速度。

### 4. 启用Nginx缓存

在 `nginx/myblog.conf` 中添加缓存配置。

## 监控建议

### 1. 设置自动备份

```bash
# 编辑crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /app/myblog/deploy/backup.sh >> /app/myblog/backups/backup.log 2>&1
```

### 2. 配置监控告警

建议使用：
- Prometheus + Grafana（容器监控）
- 云服务商的监控服务
- Uptime Kuma（简单的健康检查）

### 3. 日志管理

```bash
# 定期清理旧日志
find /app/myblog/data/backend/logs -name "*.log" -mtime +30 -delete
```

## 下一步

1. ✅ 配置域名（可选）
2. ✅ 启用HTTPS（需要域名）
3. ✅ 配置自动备份
4. ✅ 设置监控告警
5. ✅ 优化性能参数
6. ✅ 配置CDN加速

## 技术支持

如遇问题，请：
1. 查看 `DEPLOYMENT.md` 详细文档
2. 检查日志文件
3. 验证服务器安全组配置

