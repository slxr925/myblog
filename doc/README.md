# 📚 MyBlog 项目文档中心

> 完整的项目文档，从部署到开发，一应俱全

## 🗂️ 文档目录

### 🚀 部署相关

| 文档 | 说明 | 适用场景 |
|------|------|----|
| [📦 deploy/DEPLOYMENT.md](./deploy/DEPLOYMENT.md) | **完整部署手册** | 首次部署、生产环境部署 ⭐ |
| [🚀 deploy/QUICK-ITERATION.md](./deploy/QUICK-ITERATION.md) | **快速迭代部署** | 日常开发、版本更新 ⭐⭐⭐ |
| [🔐 deploy/SSH-SETUP.md](./deploy/SSH-SETUP.md) | **SSH 密钥配置** | 实现一键部署 |

### 💻 开发相关

| 文档 | 说明 |
|------|------|
| [🔧 DEVELOPMENT.md](./DEVELOPMENT.md) | 本地开发指南 |
| [📝 API-GUIDE.md](./API-GUIDE.md) | API 接口文档 |
| [🎨 FRONTEND-GUIDE.md](./FRONTEND-GUIDE.md) | 前端开发指南 |

### 🛠️ 运维相关

| 文档 | 说明 |
|------|------|
| [📊 MONITORING.md](./MONITORING.md) | 监控和日志 |
| [🔄 BACKUP-RESTORE.md](./BACKUP-RESTORE.md) | 备份与恢复 |
| [⚡ PERFORMANCE.md](./PERFORMANCE.md) | 性能优化 |
| [🐛 TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 问题排查 |
| [🧹 tools/CLEANUP.md](./tools/CLEANUP.md) | 项目清理指南 ⭐ |
| [🔐 tools/SECURITY.md](./tools/SECURITY.md) | 敏感信息安全指南 ⭐ |

### 🎯 面试必备（技术深度）⭐⭐⭐

| 文档 | 说明 | 用途 |
|------|------|------|
| [🎯 interview/INTERVIEW-GUIDE.md](./interview/INTERVIEW-GUIDE.md) | **综合面试指南** | 项目介绍+技术栈+难点解析+17个常见问题 |
| [🏛️ interview/DESIGN-PATTERNS.md](./interview/DESIGN-PATTERNS.md) | **设计模式应用** | 8种设计模式+代码示例+面试话术 |
| [⚡ interview/PERFORMANCE-GUIDE.md](./interview/PERFORMANCE-GUIDE.md) | **性能优化实践** | 缓存+并发+数据库+搜索优化 |
| [❄️ interview/SNOWFLAKE-MIGRATION.md](./interview/SNOWFLAKE-MIGRATION.md) | **雪花算法迁移策略** | 分布式ID生成+老数据兼容 |
| [📊 interview/PROJECT-SUMMARY.md](./interview/PROJECT-SUMMARY.md) | **项目完整总结** | 功能清单+技术指标+部署架构 |

---

## ⚡ 快速开始

### 首次使用

1. **部署到服务器** → 阅读 [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **配置一键部署** → 阅读 [QUICK-ITERATION.md](./QUICK-ITERATION.md) 的"前置准备"部分
3. **本地开发** → 阅读 [DEVELOPMENT.md](./DEVELOPMENT.md)

### 日常开发

```bash
# 1. 修改代码
vim myblog-backend/src/...

# 2. 本地测试
./mvnw spring-boot:run

# 3. 部署到服务器
./deploy/deploy-update.sh  # 一键部署
```

### 运维管理

```bash
# 查看日志
cd /app/myblog/deploy && ./logs.sh

# 备份数据
cd /app/myblog/deploy && ./backup.sh

# 查看服务状态
docker ps
docker stats
```

---

## 📖 文档使用指南

### 按角色选择文档

**🧑‍💼 项目经理/产品经理：**
- README.md - 项目概览
- PROJECT-STRUCTURE.md - 了解项目结构

**👨‍💻 开发人员：**
- DEVELOPMENT.md - 本地开发环境搭建
- API-GUIDE.md - API 接口调用
- FRONTEND-GUIDE.md - 前端组件使用

**🛠️ 运维人员：**
- DEPLOYMENT.md - 完整部署流程
- QUICK-ITERATION.md - 快速更新部署
- MONITORING.md - 监控配置
- BACKUP-RESTORE.md - 备份恢复

**💼 面试准备：** ⭐
- INTERVIEW-GUIDE.md - 综合面试指南（必看！）
- DESIGN-PATTERNS.md - 设计模式应用实例
- PERFORMANCE-GUIDE.md - 性能优化证明
- PROJECT-SUMMARY.md - 项目完整总结

**🆕 新手入门：**
1. 先看 README.md 了解项目
2. 再看 DEPLOYMENT.md 完成首次部署
3. 最后看 QUICK-ITERATION.md 学习日常迭代

**🚀 资深用户：**
- 直接使用 `./deploy/deploy-update.sh` 一键部署
- 需要时查阅 TROUBLESHOOTING.md 解决问题

---

## 🔧 常用操作速查

### 部署相关

```bash
# 一键部署（推荐）
./deploy/deploy-update.sh

# 分步部署
./deploy/build-local.sh          # 本地构建
# 上传 jar 和 dist
ssh root@server                  # 登录服务器
cd /app/myblog/deploy
./quick-deploy.sh                # 服务器部署
```

### 服务管理

```bash
# 查看状态
docker ps
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker logs -f myblog-backend
docker logs -f myblog-frontend
# 或使用脚本
./deploy/logs.sh

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
./deploy/stop.sh
```

### 数据管理

```bash
# 备份数据
./deploy/backup.sh

# 初始化数据库
./deploy/init-database.sh

# 查看备份
ls -lh backups/
```

---

## 🗺️ 项目结构概览

```
myblog/
├── README.md                 # 项目主文档
├── doc/                      # 📚 文档中心（本目录）
│   ├── README.md            # 文档索引
│   ├── DEPLOYMENT.md        # 部署手册
│   ├── QUICK-ITERATION.md   # 快速迭代
│   ├── SSH-SETUP.md         # SSH配置
│   ├── SSL-SETUP.md         # SSL配置
│   ├── DEVELOPMENT.md       # 开发指南
│   └── ...                  # 其他文档
│
├── deploy/                   # 🚀 部署脚本
│   ├── deploy-update.sh     # 一键部署
│   ├── build-local.sh       # 本地构建
│   ├── quick-deploy.sh      # 服务器部署
│   ├── init-database.sh     # 数据库初始化
│   ├── backup.sh            # 数据备份
│   ├── logs.sh              # 日志查看
│   └── stop.sh              # 停止服务
│
├── myblog-backend/          # 后端 Spring Boot
│   ├── src/                 # 源代码
│   ├── database/            # 数据库脚本
│   └── target/              # 构建产物
│
├── myblog-frontend/         # 前端 React
│   ├── src/                 # 源代码
│   └── dist/                # 构建产物
│
├── nginx/                   # Nginx 配置
├── docker-compose.prod.yml  # 生产环境编排
└── .env.prod                # 生产环境配置
```

---

## 💡 最佳实践

### 1. 版本管理

```bash
# 发布新版本前打标签
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# 部署
./deploy/deploy-update.sh
```

### 2. 配置管理

```bash
# 开发环境
.env

# 生产环境
.env.prod

# 不要把敏感信息提交到 Git
# .env.prod 已在 .gitignore 中
```

### 3. 数据安全

```bash
# 定期备份（建议每天）
crontab -e
0 3 * * * /app/myblog/deploy/backup.sh

# 备份到远程
rsync -avz /app/myblog/backups/ user@backup-server:/backups/myblog/
```

### 4. 监控告警

```bash
# 使用 Docker 健康检查
docker ps  # 查看健康状态

# 查看资源使用
docker stats

# 设置磁盘空间告警
df -h
```

---

## 🔍 故障排查流程

遇到问题时，按以下顺序排查：

1. **检查容器状态**
   ```bash
   docker ps
   docker ps -a  # 包含已停止的
   ```

2. **查看日志**
   ```bash
   docker logs myblog-backend
   docker logs myblog-frontend
   ```

3. **检查配置**
   ```bash
   cat .env.prod
   ```

4. **检查资源**
   ```bash
   free -h      # 内存
   df -h        # 磁盘
   docker stats # 容器资源
   ```

5. **查阅文档**
   - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
   - [DEPLOYMENT.md](./DEPLOYMENT.md#常见问题)

6. **联系支持**
   - GitHub Issues
   - 技术支持邮箱

---

## 📝 文档维护

### 更新文档

文档保持与代码同步更新，每次重大更新后检查文档是否需要修改。

### 贡献文档

欢迎完善文档：

1. Fork 项目
2. 修改或新增文档
3. 提交 Pull Request

### 反馈问题

如果文档有错误或不清楚的地方：

- 提交 Issue
- 发送邮件
- Pull Request 修正

---

## 🎯 下一步

**新手：**
1. ✅ 阅读 [DEPLOYMENT.md](./DEPLOYMENT.md)
2. ✅ 完成首次部署
3. ✅ 配置 SSH 密钥（[QUICK-ITERATION.md](./QUICK-ITERATION.md)）
4. ✅ 尝试一键部署

**开发者：**
1. ✅ 阅读 [DEVELOPMENT.md](./DEVELOPMENT.md)
2. ✅ 搭建本地开发环境
3. ✅ 阅读 [API-GUIDE.md](./API-GUIDE.md)
4. ✅ 开始开发

**运维：**
1. ✅ 完成生产环境部署
2. ✅ 配置监控和备份
3. ✅ 设置告警
4. ✅ 准备应急预案

---

## 📞 获取帮助

- 📖 文档：当前目录所有文档
- 💬 问题反馈：GitHub Issues
- 📧 技术支持：your.email@example.com
- 🌐 项目主页：https://github.com/yourname/myblog

---

**保持文档更新，让协作更高效！** 📚

**最后更新：** 2026-01-04
