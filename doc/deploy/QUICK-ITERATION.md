# 🚀 快速迭代部署指南

> 涵盖本地 Docker 开发和生产环境部署的完整流程

## 📋 快速导航

- [本地 Docker 开发](#本地-docker-开发)
- [生产环境部署](#生产环境部署)
  - [前置准备（只需一次）](#前置准备)
  - [日常迭代流程](#日常迭代流程)
  - [部署场景选择](#部署场景选择)

---

## 💻 本地 Docker 开发

### 快速开始

```bash
# 一键部署完整本地环境（Backend + Frontend + MySQL + Redis + Kafka + ES）
./scripts/deploy.sh start

# 强制重新构建并启动
./scripts/deploy.sh start --rebuild
```

### 访问地址

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8081
- **API 文档**: http://localhost:8081/doc.html
- **Kafka UI**: http://localhost:8088

### 默认账号

- 用户名: `admin`
- 密码: `admin123`

### 详细文档

完整的本地 Docker 使用指南请查看：[LOCAL-DOCKER-GUIDE.md](./LOCAL-DOCKER-GUIDE.md)

---

## ☁️ 生产环境部署

## ⚡ 前置准备（只需一次）

### 1. 配置 SSH 密钥免密登录

**为什么要配置？**
- ✅ 一条命令完成部署，无需输入密码
- ✅ 3-5分钟完成整个部署流程
- ✅ 适合频繁迭代开发

**配置步骤：**

```bash
# 1. 生成 SSH 密钥（如果已有可跳过）
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 一路回车即可

# 2. 复制公钥到服务器
ssh-copy-id root@49.235.139.118
# 输入一次密码即可

# 3. 测试免密登录
ssh root@49.235.139.118
# 如果不需要密码直接登录，说明配置成功
```

**Windows 用户：**

```powershell
# 使用 PowerShell
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@49.235.139.118 "cat >> .ssh/authorized_keys"
```

**macOS/Linux 用户：**

```bash
# 方法一：使用 ssh-copy-id（推荐）
ssh-copy-id root@49.235.139.118

# 方法二：手动复制
cat ~/.ssh/id_rsa.pub | ssh root@49.235.139.118 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

### 2. 首次部署完成

确保已经按照 [DEPLOYMENT.md](./DEPLOYMENT.md) 完成首次部署。

---

## 🔄 日常迭代流程

### 场景 A：已配置 SSH 密钥（推荐 ⭐⭐⭐）

**一条命令搞定：**

```bash
cd /path/to/myblog
./scripts/deploy-prod.sh deploy
```

**流程说明：**
1. ✅ 自动本地构建（前端 + 后端）
2. ✅ 自动上传到服务器
3. ✅ 自动在服务器部署
4. ✅ 自动检查健康状态
5. ✅ 失败自动回滚

**预计时间：** 3-5 分钟

**脚本做了什么？**

```bash
步骤 1/5: 检查服务器连接         # 验证 SSH 连接
步骤 2/5: 本地构建              # mvn package + npm build
步骤 3/5: 上传后端JAR           # scp jar 到服务器
步骤 4/5: 上传前端dist          # scp dist 到服务器
步骤 5/5: 服务器部署            # 远程执行 quick-deploy.sh
```

---

### 场景 B：未配置 SSH 密钥

**步骤 1：本地构建**

```bash
cd /path/to/myblog
./scripts/deploy-prod.sh build
```

**输出：**
```
✓ 后端构建成功
  JAR文件: myblog-backend/target/myblog-0.0.1-SNAPSHOT.jar
  文件大小: 85M

✓ 前端构建成功
  Dist目录: myblog-frontend/dist/
  目录大小: 2.3M
```

**步骤 2：上传文件到服务器**

**方法一：使用 SCP**
```bash
# 上传后端 JAR
scp myblog-backend/target/*.jar root@49.235.139.118:/app/myblog/myblog-backend/target/

# 上传前端 dist
scp -r myblog-frontend/dist/* root@49.235.139.118:/app/myblog/myblog-frontend/dist/
```

**方法二：使用宝塔面板**
1. 打开宝塔文件管理器
2. 导航到 `/app/myblog/myblog-backend/target/`
3. 上传 `myblog-backend/target/*.jar`
4. 导航到 `/app/myblog/myblog-frontend/dist/`
5. 删除旧文件，上传新的 `dist/` 所有内容

**步骤 3：服务器部署**

```bash
# 登录服务器
ssh root@49.235.139.118

# 执行部署脚本
cd /app/myblog/deploy
./quick-deploy.sh
```

**预计时间：** 10-15 分钟

---

## 📦 部署场景选择

| 场景 | 推荐方案 | 命令 | 时间 |
|------|---------|------|------|
| 🔥 **日常开发迭代**（已配置SSH） | deploy-update.sh | `./deploy/deploy-update.sh` | 3-5分钟 |
| 📦 **手动部署**（未配置SSH） | build-local.sh + 手动上传 + quick-deploy.sh | 见场景B | 10-15分钟 |
| 🆕 **首次部署** | 完整部署流程 | 见 [DEPLOYMENT.md](./DEPLOYMENT.md) | 30-60分钟 |
| 🐛 **紧急修复** | deploy-update.sh（跳过测试） | `./deploy/deploy-update.sh` | 3分钟 |
| 🎯 **生产发布** | 完整流程 + 测试 | 见 [DEPLOYMENT.md](./DEPLOYMENT.md) | 30分钟 |

---

## 🛠️ 脚本详解

### deploy-update.sh（一键部署）

**脚本位置：** `deploy/deploy-update.sh`

**默认服务器配置：**
```bash
SERVER_HOST="49.235.139.118"
SERVER_USER="root"
SERVER_PATH="/app/myblog"
```

**如何修改服务器地址？**
```bash
# 编辑脚本
vim deploy/deploy-update.sh

# 修改这几行
SERVER_HOST="your-server-ip"
SERVER_USER="your-username"
SERVER_PATH="/your/path/to/myblog"
```

### build-local.sh（本地构建）

**脚本位置：** `deploy/build-local.sh`

**做了什么？**
1. 构建后端：`mvn clean package -DskipTests`
2. 构建前端：`npm run build`
3. 生成版本信息文件：`build-info.txt`

**跳过测试构建：**
```bash
# 后端默认已跳过测试
# 如需运行测试，编辑脚本去掉 -DskipTests
```

### quick-deploy.sh（服务器部署）

**脚本位置：** `deploy/quick-deploy.sh`

**做了什么？**
1. 检查环境（Docker、Docker Compose）
2. 检查构建产物（jar、dist）
3. 备份当前版本
4. 停止旧容器
5. 构建新镜像
6. 启动新服务
7. 健康检查
8. 失败自动回滚

**部署流程：**
```
检查环境 → 检查产物 → 备份 → 停止旧服务 → 构建镜像 → 启动新服务 → 健康检查
                                                    ↓（失败）
                                                 自动回滚
```

---

## 🔍 部署验证

### 自动健康检查

脚本会自动检查以下内容：

1. **容器状态**
   ```bash
   docker ps | grep myblog
   ```

2. **后端健康**
   ```bash
   curl http://localhost:8081/actuator/health
   ```

3. **前端访问**
   ```bash
   curl http://localhost:3000
   ```

### 手动验证

```bash
# 1. 检查容器
docker ps

# 2. 查看日志
docker logs -f myblog-backend
docker logs -f myblog-frontend

# 3. 测试接口
curl http://your-server-ip:8081/api/blogs/latest

# 4. 浏览器访问
# http://your-server-ip:3000
```

---

## ❌ 常见错误处理

### 错误 1：SSH 连接失败

```
⚠ SSH密钥未配置，将使用密码登录
```

**解决方案：**
- 配置 SSH 密钥（见前置准备）
- 或者手动输入密码继续

### 错误 2：构建失败

```
✗ 本地构建失败
```

**解决方案：**

```bash
# 检查后端
cd myblog-backend
mvn clean package

# 检查前端
cd myblog-frontend
npm install
npm run build
```

### 错误 3：上传失败

```
✗ 后端JAR上传失败
```

**解决方案：**
- 检查网络连接
- 检查服务器磁盘空间：`ssh root@server "df -h"`
- 手动上传

### 错误 4：部署失败

```
✗ 后端服务启动失败
```

**解决方案：**

```bash
# 登录服务器查看日志
ssh root@49.235.139.118
docker logs myblog-backend

# 常见原因
# - 数据库连接失败：检查 .env.prod 配置
# - 端口被占用：docker ps -a 查看旧容器
# - 内存不足：free -h 检查内存
```

---

## 📊 部署时间对比

| 操作 | 已配置SSH | 未配置SSH |
|------|----------|----------|
| 本地构建 | 自动（2分钟） | 手动（2分钟） |
| 上传文件 | 自动（1分钟） | 手动（5分钟） |
| 服务器部署 | 自动（2分钟） | 手动（3分钟） |
| **总计** | **3-5分钟** | **10-15分钟** |

---

## 💡 最佳实践

### 1. 配置 SSH 密钥

配置一次，终身受益。5分钟的投入，每次部署节省10分钟。

### 2. 使用版本标签

```bash
# 发布新版本前打标签
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# 部署
./deploy/deploy-update.sh
```

### 3. 部署前检查

```bash
# 检查本地代码状态
git status
git pull

# 检查服务器状态
ssh root@49.235.139.118 "docker ps && df -h"
```

### 4. 保留备份

```bash
# 部署脚本会自动备份到
/app/myblog/backups/backup-YYYYMMDD-HHMMSS/

# 定期清理旧备份（保留最近7天）
# 脚本会自动处理
```

### 5. 分环境部署

```bash
# 开发环境
./deploy/deploy-update.sh

# 测试环境
# 修改 deploy-update.sh 中的 SERVER_HOST

# 生产环境
# 使用独立的配置文件
```

---

## 🎯 快速参考

### 日常最常用命令

```bash
# ✅ 一键部署（推荐）
./deploy/deploy-update.sh

# 📦 仅构建
./deploy/build-local.sh

# 🔄 仅部署（服务器上）
cd /app/myblog/deploy && ./quick-deploy.sh

# 📋 查看日志
cd /app/myblog/deploy && ./logs.sh

# 🛑 停止服务
cd /app/myblog/deploy && ./stop.sh

# 💾 备份数据
cd /app/myblog/deploy && ./backup.sh
```

### 脚本位置一览

| 脚本 | 位置 | 执行位置 | 用途 |
|------|------|---------|------|
| deploy-update.sh | `deploy/` | 本地 | 一键部署 |
| build-local.sh | `deploy/` | 本地 | 本地构建 |
| quick-deploy.sh | `deploy/` | 服务器 | 服务器部署 |
| init-database.sh | `deploy/` | 服务器 | 数据库初始化 |
| backup.sh | `deploy/` | 服务器 | 数据备份 |
| logs.sh | `deploy/` | 服务器 | 查看日志 |
| stop.sh | `deploy/` | 服务器 | 停止服务 |

---

## 🆘 获取帮助

**问题排查顺序：**

1. 查看脚本输出的错误信息
2. 查看本文档的「常见错误处理」章节
3. 查看服务器日志：`docker logs myblog-backend`
4. 查看完整部署手册：[DEPLOYMENT.md](./DEPLOYMENT.md)
5. 提交 Issue 或联系技术支持

---

**配置一次 SSH 密钥，享受一键部署的快乐！** 🚀

**最后更新：** 2026-01-27
