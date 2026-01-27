# 📦 MyBlog 部署手册

> 完整的部署指南，从零到上线

## 📋 目录

- [环境准备](#环境准备)
- [首次部署](#首次部署)
- [版本更新](#版本更新)
- [常见问题](#常见问题)
- [回滚操作](#回滚操作)

---

## 🛠️ 环境准备

### 服务器要求

**最低配置：**
- CPU: 2核
- 内存: 4GB
- 硬盘: 20GB
- 系统: CentOS 7+ / Ubuntu 18.04+

**推荐配置：**
- CPU: 4核
- 内存: 8GB
- 硬盘: 50GB

### 依赖软件

#### 1. Docker 和 Docker Compose

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### 2. MySQL（如果使用外部数据库）

```bash
# 使用宝塔面板安装 MySQL 8.0
# 或使用 Docker 安装
docker run -d \
  --name mysql \
  -p 13306:3306 \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -v /data/mysql:/var/lib/mysql \
  mysql:8.0
```

#### 3. Redis（如果使用外部 Redis）

```bash
# 使用宝塔面板安装 Redis 7.x
# 或使用 Docker 安装
docker run -d \
  --name redis \
  -p 26739:6379 \
  redis:7-alpine redis-server --requirepass your_password
```

---

## 🚀 首次部署

### 方式一：完全自动化部署（推荐新手）

**适用场景**：服务器上没有任何基础设施，需要一键部署所有服务。

#### 步骤 1：准备服务器

```bash
# 登录服务器
ssh root@your-server-ip

# 创建项目目录
mkdir -p /app/myblog
cd /app/myblog
```

#### 步骤 2：上传项目文件

**使用 Git（推荐）：**
```bash
git clone https://github.com/your-username/myblog.git /app/myblog
cd /app/myblog
```

**或使用宝塔面板：**
1. 将整个项目打包成 `myblog.zip`
2. 上传到服务器 `/app/` 目录
3. 解压：`unzip myblog.zip`

#### 步骤 3：配置环境变量

```bash
cd /app/myblog

# 复制环境变量模板
cp .env.example .env.prod

# 编辑配置文件
vim .env.prod
```

**必须配置的环境变量：**
```bash
# MySQL 配置
MYSQL_HOST=172.17.0.1
MYSQL_PORT=13306
MYSQL_DATABASE=myblog
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_strong_password  # ⚠️ 务必修改

# Redis 配置
REDIS_HOST=172.17.0.1
REDIS_PORT=26739
REDIS_PASSWORD=your_redis_password   # ⚠️ 务必修改

# JWT 密钥
JWT_SECRET=your_jwt_secret_key_at_least_32_characters  # ⚠️ 务必修改

# Elasticsearch（可选）
ELASTICSEARCH_ENABLED=false
```

#### 步骤 4：本地构建

```bash
# 在本地机器（不是服务器）执行

# 1. 构建前后端
cd /path/to/myblog
chmod +x deploy/build-local.sh
./deploy/build-local.sh

# 2. 上传构建产物到服务器
# 方法一：使用 scp
scp myblog-backend/target/*.jar root@your-server:/app/myblog/myblog-backend/target/
scp -r myblog-frontend/dist/* root@your-server:/app/myblog/myblog-frontend/dist/

# 方法二：使用宝塔面板上传
# - myblog-backend/target/*.jar → /app/myblog/myblog-backend/target/
# - myblog-frontend/dist/ 所有文件 → /app/myblog/myblog-frontend/dist/
```

#### 步骤 5：初始化数据库

```bash
# 在服务器上执行
cd /app/myblog/deploy
chmod +x init-database.sh
./init-database.sh
```

#### 步骤 6：启动应用

```bash
cd /app/myblog/deploy
chmod +x quick-deploy.sh
./quick-deploy.sh
```

#### 步骤 7：验证部署

```bash
# 检查容器状态
docker ps

# 查看日志
docker logs myblog-backend
docker logs myblog-frontend

# 访问应用
curl http://localhost:3000
```

**浏览器访问：**
- 前端：`http://your-server-ip:3000`
- 后端API：`http://your-server-ip:8081`
- API文档：`http://your-server-ip:8081/doc.html`

### 方式二：使用现有数据库（推荐生产环境）

如果你已经有独立的 MySQL 和 Redis 服务（如宝塔面板部署的），按以下步骤操作：

#### 步骤 1：配置环境变量

```bash
# 修改 .env.prod
MYSQL_HOST=172.17.0.1  # 宝塔面板 MySQL 地址
MYSQL_PORT=13306       # 宝塔面板 MySQL 端口
MYSQL_PASSWORD=Kpiass123.  # 你在宝塔设置的密码

REDIS_HOST=172.17.0.1  # 宝塔面板 Redis 地址
REDIS_PORT=26739       # 宝塔面板 Redis 端口
REDIS_PASSWORD=        # 你的 Redis 密码
```

#### 步骤 2-6：同方式一

---

## 🔄 版本更新

详见 [QUICK-ITERATION.md](./QUICK-ITERATION.md)

### 快速部署（推荐）⭐⭐⭐

项目已提供统一的部署脚本 `scripts/deploy-prod.sh`，支持一键部署：

```bash
# 完整部署流程（构建 → 上传 → 部署）
./scripts/deploy-prod.sh deploy

# 分步操作
./scripts/deploy-prod.sh build          # 本地构建产物
./scripts/deploy-prod.sh upload         # 上传产物到服务器
./scripts/deploy-prod.sh server-deploy  # 仅在服务器上部署
```

### 场景 1：已配置 SSH 密钥（最快）

```bash
# 在本地执行一条命令即可
cd /path/to/myblog
./scripts/deploy-prod.sh deploy
```

### 场景 2：未配置 SSH 密钥

```bash
# 1. 本地构建
./scripts/deploy-prod.sh build

# 2. 手动上传 jar 和 dist

# 3. 服务器部署
ssh root@your-server
cd /app/myblog/deploy/prod
./quick-deploy.sh
```

---

## ❓ 常见问题

### 1. 数据库连接失败

**错误信息：**
```
Unable to connect to MySQL
```

**解决方案：**

```bash
# 检查 MySQL 是否运行
docker ps | grep mysql
# 或
ss -tulnp | grep 13306

# 检查防火墙
firewall-cmd --list-ports

# 测试连接
mysql -h127.0.0.1 -P13306 -uroot -p
```

### 2. Redis 连接失败

**错误信息：**
```
Unable to connect to Redis
```

**解决方案：**

```bash
# 检查 Redis 是否运行
docker ps | grep redis
# 或
ss -tulnp | grep 26739

# 测试连接
redis-cli -h 127.0.0.1 -p 26739 -a your_password ping
```

### 3. 容器启动失败

**查看日志：**
```bash
docker logs myblog-backend
docker logs myblog-frontend
```

**常见原因：**
- 端口被占用：`docker ps -a` 检查是否有旧容器
- 内存不足：`free -h` 检查内存，考虑增加 swap
- 配置错误：检查 `.env.prod` 文件

### 4. 前端无法访问

**检查步骤：**

```bash
# 1. 检查容器运行
docker ps | grep myblog-frontend

# 2. 检查端口监听
ss -tulnp | grep 3000

# 3. 测试本地访问
curl http://localhost:3000

# 4. 检查防火墙
firewall-cmd --list-ports
# 开放端口
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

### 5. 文件上传失败

**错误信息：**
```
Permission denied
```

**解决方案：**
```bash
# 设置上传目录权限
chmod -R 777 /app/myblog/data/backend/uploads
```

---

## 🔙 回滚操作

### 自动回滚

部署脚本会自动创建备份，如果新版本启动失败会尝试自动回滚。

### 手动回滚

```bash
cd /app/myblog/backups

# 查看备份列表
ls -lht

# 恢复数据库
cd /app/myblog/backups
gunzip myblog_db_YYYYMMDD_HHMMSS.sql.gz
mysql -h127.0.0.1 -P13306 -uroot -p myblog < myblog_db_YYYYMMDD_HHMMSS.sql

# 恢复应用文件
cd /app/myblog
cp backups/backup-YYYYMMDD-HHMMSS/myblog-backend.jar myblog-backend/target/

# 重新部署
cd deploy
./quick-deploy.sh
```

---

## 📊 监控和维护

### 查看服务状态

```bash
# 容器状态
docker-compose -f docker-compose.prod.yml ps

# 资源使用
docker stats

# 磁盘使用
df -h
du -sh /app/myblog/data
```

### 查看日志

```bash
# 使用日志脚本（推荐）
cd /app/myblog/deploy
./logs.sh

# 或直接查看
docker logs -f myblog-backend
docker logs -f myblog-frontend
```

### 定期备份

```bash
# 手动备份
cd /app/myblog/deploy
./backup.sh

# 设置定时备份（每天凌晨3点）
crontab -e
# 添加：
0 3 * * * /app/myblog/deploy/backup.sh >> /var/log/myblog-backup.log 2>&1
```

### 清理磁盘

```bash
# 清理 Docker 镜像
docker system prune -a

# 清理旧日志
find /app/myblog/data/backend/logs -name "*.log.*" -mtime +30 -delete

# 清理旧备份（保留最近 7 天）
find /app/myblog/backups -name "myblog_*" -type f -mtime +7 -delete
```

---

## 🔒 安全建议

### 1. 修改默认密码

```bash
# MySQL root 密码
# Redis 密码
# JWT 密钥
# 管理员账户密码
```

### 2. 配置防火墙

```bash
# 只开放必要端口
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=8081/tcp
firewall-cmd --reload
```

### 3. 启用 HTTPS

参考 [SSL-SETUP.md](./SSL-SETUP.md)

### 4. 定期更新

```bash
# 更新系统
yum update -y

# 更新 Docker
yum update docker

# 更新应用
git pull && ./deploy/deploy-update.sh
```

---

## 📞 获取帮助

- 📖 查看文档：`/app/myblog/doc/`
- 🐛 问题反馈：GitHub Issues
- 💬 技术支持：your.email@example.com

---

**最后更新：** 2026-01-27
