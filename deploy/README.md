# MyBlog 部署文档

> 简洁实用的部署指南

## 📚 快速导航

- **🚀 [首次部署](#一首次部署)** - 第一次部署到服务器
- **🔄 [版本迭代](#-版本迭代流程)** - 日常更新代码后如何部署 ⭐ **最常用**
- **⚙️ [配置管理](#-核心配置)** - 修改环境变量和配置
- **🔧 [常用命令](#-常用命令)** - 查看日志、重启服务等
- **⚠️ [故障排查](#-故障排查)** - 遇到问题如何解决

## 📋 环境说明

### 服务器环境
- **服务器**: 49.235.139.118
- **系统**: Linux (宝塔面板管理)
- **Docker**: 已安装
- **Docker Compose**: 已安装

### 已有服务（Docker部署）
- MySQL - 端口 13306 (root/Kpiass123.)
- Redis - 端口 26739
- Elasticsearch - 端口 9200

### 本地环境
- Java 21 + Maven 3.9+
- Node.js 18+ + npm

## 🚀 部署流程

### 一、首次部署

#### 1. 配置环境变量

在服务器上创建 `/app/myblog/.env.prod` 文件：

**⚠️ 关键说明 - Docker网络配置**：

由于后端应用运行在Docker容器内，需要访问宿主机的MySQL/Redis/ES服务，有以下配置选项：

| IP地址 | 说明 | 是否可用 |
|--------|------|---------|
| `127.0.0.1` | 容器内部回环地址 | ❌ 指向容器自己，不是宿主机 |
| `49.235.139.118` | 云服务器公网IP | ❌ Docker网络隔离，无法访问 |
| `172.17.0.1` | Docker默认网关 | ✅ 容器访问宿主机的"内部通道" |

**推荐使用 `172.17.0.1`**，这是Docker为容器访问宿主机服务提供的网关地址。

**步骤1：查找Redis密码**

```bash
# 在服务器上执行，查看Redis容器配置
docker inspect redis_jnhk-redis_jnHK-1 | grep -A 5 "Cmd"

# 或者直接测试Redis连接（如果有密码会提示NOAUTH）
docker exec redis_jnhk-redis_jnHK-1 redis-cli PING
```

**步骤2：创建环境变量文件**

```bash
# 服务器上执行
mkdir -p /app/myblog
cd /app/myblog

# 创建环境变量文件
cat > .env.prod << 'EOF'
# MySQL配置
MYSQL_HOST=172.17.0.1
MYSQL_PORT=13306
MYSQL_DATABASE=myblog
MYSQL_USERNAME=root
MYSQL_PASSWORD=Kpiass123.

# Redis配置
REDIS_HOST=172.17.0.1
REDIS_PORT=26739
# 如果Redis有密码，填写密码；没有则留空
REDIS_PASSWORD=

# Elasticsearch配置
ELASTICSEARCH_HOST=172.17.0.1
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# JWT密钥（使用 openssl rand -base64 32 生成）
JWT_SECRET=your-generated-secret-key-here
EOF

# 生成JWT密钥并替换
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s/your-generated-secret-key-here/$JWT_SECRET/" .env.prod

# 检查配置文件
cat .env.prod
```

#### 2. 初始化数据库

```bash
cd /app/myblog/deploy
chmod +x *.sh
./init-database.sh
```

#### 3. 本地构建

```bash
# 在本地项目根目录执行
./build-local.sh
```

这会生成：
- `myblog-backend/target/*.jar`
- `myblog-frontend/dist/`

#### 4. 上传构建产物

**方式1：使用宝塔面板**
- 打开宝塔面板文件管理
- 上传 jar 到 `/app/myblog/myblog-backend/target/`
- 上传 dist 目录到 `/app/myblog/myblog-frontend/`

**方式2：使用命令行**
```bash
# 上传jar（在本地执行）
scp myblog-backend/target/*.jar root@49.235.139.118:/app/myblog/myblog-backend/target/

# 上传dist（在本地执行）
scp -r myblog-frontend/dist root@49.235.139.118:/app/myblog/myblog-frontend/
```

#### 5. 部署启动

```bash
# 服务器上执行
cd /app/myblog/deploy
./quick-deploy.sh
```

#### 6. 访问应用

- 博客首页: http://49.235.139.118
- 后端API: http://49.235.139.118:8081
- API文档: http://49.235.139.118:8081/doc.html

默认账号: admin / admin123

### 二、日常更新

#### 1. 本地构建
```bash
./build-local.sh
```

#### 2. 上传构建产物
通过宝塔面板或命令行上传新的jar和dist

#### 3. 重新部署
```bash
# 服务器上执行
cd /app/myblog/deploy
./quick-deploy.sh
```

## 🔄 版本迭代流程

### 方式一：一键部署（推荐）⭐

**前提条件**：配置SSH密钥（5分钟，只需一次）
- 📖 查看配置指南：[deploy/SSH-SETUP.md](SSH-SETUP.md)

**使用方法**：

```bash
cd /Users/xuran/Dev/myblog
./deploy-update.sh
```

**自动完成**：
- ✅ 本地构建（后端jar + 前端dist）
- ✅ 上传到服务器
- ✅ 自动部署
- ✅ 健康检查
- ⏱️ **总耗时：3-5分钟**

---

### 方式二：手动部署（无需SSH密钥）

如果暂时不想配置SSH密钥，可以手动上传：

### 完整迭代步骤

```bash
# ============================================
# 步骤1: 本地开发修改代码
# ============================================
# 修改代码，本地测试通过后...

# ============================================
# 步骤2: 本地构建
# ============================================
cd /Users/xuran/Dev/myblog
./build-local.sh

# 构建输出：
# ✅ myblog-backend/target/myblog-1.0.0.jar
# ✅ myblog-frontend/dist/

# ============================================
# 步骤3: 上传到服务器
# ============================================

# 方法A：使用宝塔面板上传（推荐）
# 1. 打开宝塔面板 -> 文件管理
# 2. 导航到 /app/myblog/
# 3. 上传 myblog-backend/target/*.jar 到 /app/myblog/myblog-backend/target/
# 4. 上传 myblog-frontend/dist/ 整个目录 到 /app/myblog/myblog-frontend/

# 方法B：使用 scp 命令（需要配置SSH密钥）
scp myblog-backend/target/*.jar root@49.235.139.118:/app/myblog/myblog-backend/target/
scp -r myblog-frontend/dist/* root@49.235.139.118:/app/myblog/myblog-frontend/dist/

# ============================================
# 步骤4: 服务器部署
# ============================================
ssh root@49.235.139.118
cd /app/myblog/deploy
./quick-deploy.sh

# 部署脚本会自动：
# 1. ✅ 备份当前版本 → /app/myblog/backups/backup-YYYYMMDD-HHMMSS/
# 2. ✅ 停止旧容器
# 3. ✅ 构建新镜像
# 4. ✅ 启动新容器
# 5. ✅ 健康检查
# 6. ❌ 失败自动回滚（如果启动失败）

# ============================================
# 步骤5: 验证部署
# ============================================

# 检查容器状态
docker ps | grep myblog

# 查看后端日志
docker logs -f myblog-backend --tail 100

# 查看前端日志
docker logs -f myblog-frontend --tail 50

# 测试后端API
curl http://49.235.139.118:8081/actuator/health

# 测试前端页面
curl -I http://49.235.139.118:3000

# 浏览器访问
# http://49.235.139.118:3000
```

---

### 对比：两种部署方式

| 特性 | 一键部署 | 手动部署 |
|------|---------|---------|
| **配置要求** | 需要SSH密钥 | 无需配置 |
| **操作步骤** | 1条命令 | 3-4步 |
| **耗时** | 3-5分钟 | 5-10分钟 |
| **适用场景** | 日常频繁迭代 | 首次部署/偶尔更新 |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

### 版本管理建议

#### 版本号规范

在 `pom.xml` 和 `package.json` 中维护版本号：

```xml
<!-- myblog-backend/pom.xml -->
<version>1.0.0</version>
```

```json
// myblog-frontend/package.json
"version": "1.0.0"
```

版本号规则：`主版本.次版本.修订号`
- **主版本**（1.x.x）：重大架构变更、不兼容的API修改
- **次版本**（x.1.x）：新功能添加、向后兼容
- **修订号**（x.x.1）：Bug修复、小优化

#### 版本标签（Git）

```bash
# 每次发布打标签
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 查看所有版本
git tag -l

# 回退到特定版本
git checkout v1.0.0
```

### 版本回滚方案

#### 方案1：使用备份快速回滚

```bash
# 查看可用备份
ls -lh /app/myblog/backups/

# 回滚到指定备份
cd /app/myblog/backups/backup-20241204-120000/

# 复制jar包
cp myblog-backend/target/*.jar /app/myblog/myblog-backend/target/

# 复制dist
rm -rf /app/myblog/myblog-frontend/dist/*
cp -r myblog-frontend/dist/* /app/myblog/myblog-frontend/dist/

# 重新部署
cd /app/myblog/deploy
./quick-deploy.sh
```

#### 方案2：从Git回滚

```bash
# 本地回滚到上一个版本
git checkout v1.0.0

# 重新构建和部署
./build-local.sh
# 然后上传并部署...
```

### 配置变更迭代

如果修改了配置文件（如 `application-prod.yml`、`.env.prod`）：

```bash
# ============================================
# 1. 修改服务器配置文件
# ============================================
ssh root@49.235.139.118
vim /app/myblog/.env.prod

# 或者修改后端配置（需要重新打包）
# myblog-backend/src/main/resources/application-prod.yml

# ============================================
# 2. 如果只是修改 .env.prod
# ============================================
cd /app/myblog/deploy
./quick-deploy.sh  # 会自动同步到 .env

# ============================================
# 3. 如果修改了 application-prod.yml
# ============================================
# 需要本地重新打包后端
cd /Users/xuran/Dev/myblog
mvn clean package -DskipTests

# 上传并部署
scp myblog-backend/target/*.jar root@49.235.139.118:/app/myblog/myblog-backend/target/
ssh root@49.235.139.118 "cd /app/myblog/deploy && ./quick-deploy.sh"
```

### 数据库迁移迭代

如果有新的数据库变更：

```bash
# ============================================
# 1. 编写迁移脚本
# ============================================
# 在 myblog-backend/database/migrations/ 添加新的SQL文件
# 命名规范: YYYY-MM-DD-description.sql

# ============================================
# 2. 上传迁移脚本
# ============================================
scp myblog-backend/database/migrations/*.sql \
    root@49.235.139.118:/app/myblog/myblog-backend/database/migrations/

# ============================================
# 3. 执行迁移
# ============================================
ssh root@49.235.139.118
cd /app/myblog/deploy
./init-database.sh  # 会自动执行新的迁移脚本

# ============================================
# 4. 部署新版本代码
# ============================================
./quick-deploy.sh
```

### 热更新（零停机）

目前的部署会有短暂的服务中断（约10-30秒）。如果需要零停机：

#### 方案1：使用Nginx负载均衡（未来）

```
Nginx (80)
  ├── Backend-1 (8081) ← 先更新
  └── Backend-2 (8082) ← 后更新
```

#### 方案2：蓝绿部署（未来）

```
# 保持旧版本运行，启动新版本在不同端口
# 测试通过后切换流量
```

### 监控和告警（建议）

```bash
# 定期检查服务状态
watch -n 5 'docker ps | grep myblog'

# 监控日志错误
tail -f /app/myblog/data/backend/logs/myblog.log | grep ERROR

# 检查资源使用
docker stats myblog-backend myblog-frontend
```

## 📖 脚本说明

### deploy/quick-deploy.sh
服务器端部署脚本，功能：
- 停止旧容器
- 备份当前版本
- 构建Docker镜像
- 启动新容器
- 健康检查
- 失败自动回滚

### deploy/init-database.sh
数据库初始化脚本，功能：
- 创建数据库
- 执行初始化SQL
- 运行迁移脚本

### deploy/logs.sh
查看日志，支持：
- 后端日志
- 前端日志
- Nginx日志
- 所有日志

### deploy/stop.sh
停止所有服务

### deploy/backup.sh
数据备份，包括：
- MySQL数据库
- 上传的文件
- 当前jar包

## 🔧 常用命令

### 查看服务状态
```bash
cd /app/myblog
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志
```bash
cd /app/myblog/deploy
./logs.sh
```

### 重启服务
```bash
cd /app/myblog
docker-compose -f docker-compose.prod.yml restart
```

### 停止服务
```bash
cd /app/myblog/deploy
./stop.sh
```

### 数据备份
```bash
cd /app/myblog/deploy
./backup.sh
```

## ⚠️ 故障排查

### 后端无法启动
```bash
# 查看日志
docker logs myblog-backend

# 检查jar文件
ls -lh /app/myblog/myblog-backend/target/*.jar

# 检查MySQL连接
mysql -h127.0.0.1 -P13306 -uroot -pKpiass123. -e "SELECT 1"
```

### 前端无法访问
```bash
# 查看日志
docker logs myblog-frontend

# 检查dist目录
ls -la /app/myblog/myblog-frontend/dist/
```

### 端口被占用
```bash
# 查看端口
netstat -tuln | grep -E '80|3000|8081'

# 停止占用进程
lsof -i:8081
kill -9 <PID>
```

## 📁 目录结构

```
/app/myblog/
├── .env.prod                      # 环境变量配置（主配置文件，手动编辑）
├── .env                           # 自动生成（从.env.prod复制，供docker-compose使用）
├── docker-compose.prod.yml        # Docker编排
├── myblog-backend/
│   ├── target/*.jar              # 后端jar包（上传）
│   ├── Dockerfile.prod           # 后端镜像
│   └── database/                 # 数据库脚本
├── myblog-frontend/
│   ├── dist/                     # 前端构建产物（上传）
│   ├── Dockerfile.prod           # 前端镜像
│   └── nginx.conf                # Nginx配置
├── nginx/
│   └── myblog.conf               # 主Nginx配置（可选）
├── deploy/
│   ├── quick-deploy.sh           # 部署脚本
│   ├── init-database.sh          # 数据库初始化
│   ├── logs.sh                   # 查看日志
│   ├── stop.sh                   # 停止服务
│   └── backup.sh                 # 数据备份
├── data/
│   └── backend/
│       ├── logs/                 # 应用日志
│       └── uploads/              # 上传文件
└── backups/                      # 备份目录
```

**⚠️ 配置文件说明**：
- **`.env.prod`**：主配置文件，所有配置修改都在这里
- **`.env`**：自动生成的文件，由 `quick-deploy.sh` 从 `.env.prod` 复制而来
- **不要手动编辑 `.env`**，所有修改都应该在 `.env.prod` 中进行

## 🎯 核心配置

### 配置文件管理

**重要**：项目使用 `.env.prod` 作为主配置文件。

```bash
# 配置文件流程
.env.prod (手动编辑) 
    ↓
quick-deploy.sh 自动复制
    ↓
.env (docker-compose 读取)
```

**修改配置的正确方法**：
1. 编辑 `/app/myblog/.env.prod`
2. 运行 `./deploy/quick-deploy.sh` 会自动同步到 `.env`
3. **不要直接编辑 `.env` 文件**（会被覆盖）

**为什么需要两个文件？**
- `docker-compose` 默认只读取 `.env` 文件（不带后缀）
- 我们使用 `.env.prod` 作为配置源，便于版本管理和区分环境
- `quick-deploy.sh` 会自动将 `.env.prod` 复制为 `.env`

### Docker网络
应用容器通过 `172.17.0.1`（Docker网关）访问宿主机的MySQL/Redis/ES服务。

**网络说明**：
- `127.0.0.1` - ❌ 在容器内指向容器自己
- `公网IP` - ❌ Docker网络隔离，无法访问
- `172.17.0.1` - ✅ Docker默认网关，容器访问宿主机的通道

### 端口映射
- 8081 → 后端API（直接访问）
- 3000 → 前端页面（直接访问）
- 80 → Nginx反向代理（可选，统一入口）

### 数据持久化
- 日志: `/app/myblog/data/backend/logs`
- 上传文件: `/app/myblog/data/backend/uploads`
- 备份: `/app/myblog/backups`

## 💡 提示

1. **首次部署**约需10分钟
2. **日常更新**约需2-3分钟
3. **定期备份**建议每天自动备份
4. **监控日志**出现问题及时查看日志
5. **安全加固**首次登录后立即修改admin密码

---

**部署愉快！** 🎉
