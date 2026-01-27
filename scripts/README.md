# MyBlog Deployment Scripts

便捷部署脚本集合，简化本地和生产环境的部署流程。

## 本地环境部署

使用 `deploy.sh` 管理本地 Docker 开发环境：

```bash
# 启动环境
./scripts/deploy.sh start          # 启动所有服务
./scripts/deploy.sh start --rebuild # 强制重新构建并启动

# 管理服务
./scripts/deploy.sh stop           # 停止所有服务
./scripts/deploy.sh restart        # 重启所有服务
./scripts/deploy.sh status         # 查看容器状态

# 查看日志
./scripts/deploy.sh logs           # 查看所有服务日志
./scripts/deploy.sh logs backend   # 查看后端日志
./scripts/deploy.sh logs frontend  # 查看前端日志
./scripts/deploy.sh logs mysql     # 查看 MySQL 日志

# 维护操作
./scripts/deploy.sh clean          # 清理临时文件和日志
./scripts/deploy.sh rebuild        # 重新构建并重启

# 健康检查
./scripts/health-check.sh          # 检查所有服务健康状态
```

## 生产环境部署

使用 `deploy-prod.sh` 管理生产环境部署：

```bash
# 首次部署（新服务器）
./scripts/deploy-prod.sh init      # 完整初始化：创建目录、上传配置、初始化数据库

# 更新部署（已有环境）
./scripts/deploy-prod.sh deploy    # 完整部署流程：构建 → 上传 → 部署

# 单独操作
./scripts/deploy-prod.sh build     # 本地构建产物
./scripts/deploy-prod.sh upload    # 上传产物到服务器
./scripts/deploy-prod.sh server-deploy  # 仅在服务器上部署

# 维护操作
./scripts/deploy-prod.sh backup    # 备份数据库和文件
./scripts/deploy-prod.sh init-db   # 初始化数据库
./scripts/deploy-prod.sh logs      # 查看生产日志
./scripts/deploy-prod.sh status    # 检查生产状态
```

## 快速部署（使用 rsync）

```bash
# 使用 rsync 快速上传和部署
./scripts/rsync-deploy.sh
```

## 服务访问地址

### 本地环境
- 前端: http://localhost:3000
- 后端 API: http://localhost:8081
- API 文档: http://localhost:8081/doc.html
- Kafka UI: http://localhost:8088
- Elasticsearch: http://localhost:9200

### 生产环境
- 前端: http://49.235.139.118:3000
- 后端 API: http://49.235.139.118:8081
- API 文档: http://49.235.139.118:8081/doc.html

## 默认账号

- 用户名: `admin`
- 密码: `admin123`

## 故障排查

### 容器无法启动
```bash
# 查看容器状态
./scripts/deploy.sh status

# 查看服务日志
./scripts/deploy.sh logs <service>
```

### 端口冲突
如果端口被占用，请修改 `docker-compose.yml` 或 `docker-compose.prod.yml` 中的端口映射。

### 数据库连接失败
```bash
# 检查 MySQL 健康状态
./scripts/health-check.sh

# 查看 MySQL 日志
./scripts/deploy.sh logs mysql
```

### 完全重启
```bash
# 停止并清理
./scripts/deploy.sh stop

# 清理临时文件
./scripts/deploy.sh clean

# 重新构建并启动
./scripts/deploy.sh rebuild
```

## 生产环境回滚

如需回滚到之前的版本：

```bash
# SSH 到服务器
ssh root@49.235.139.118

# 查看备份
cd /app/myblog/backups
ls -la

# 恢复备份（以 backup-20260127-115953 为例）
cp backup-20260127-115953/myblog-backend.jar ../myblog-backend/target/
docker-compose -f /app/myblog/docker-compose.prod.yml restart backend
```

## 相关文档

- [本地架构说明](../.claude/skills/myblog-deploy-local/references/architecture.md)
- [Docker 命令参考](../.claude/skills/myblog-deploy-local/references/commands.md)
- [生产环境检查清单](../.claude/skills/myblog-deploy-prod/references/production-checklist.md)
- [故障排查指南](../.claude/skills/myblog-deploy-prod/references/troubleshooting.md)
