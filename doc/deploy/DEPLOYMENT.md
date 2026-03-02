# 部署手册

本文档描述 MyBlog 的本地部署与生产部署流程。

## 1. 部署模式

- 本地开发：`docker-compose.yml`
- 生产环境：`docker-compose.prod.yml`
- 本地脚本目录：`deploy/local/`
- 生产脚本目录：`deploy/prod/`
- 统一生产入口：`scripts/deploy-prod.sh`

## 2. 前置要求

- Docker 与 Docker Compose 可用
- 目标机器具备网络访问与磁盘空间
- 生产部署机器已配置可用 SSH 连接

## 3. 本地部署

### 3.1 首次启动

```bash
./deploy/local/quick-deploy.sh
```

### 3.2 增量更新

```bash
./deploy/local/deploy-update.sh
```

### 3.3 全量重建

```bash
./deploy/local/quick-deploy.sh --rebuild
```

## 4. 生产部署

### 4.1 一键增量发布（推荐）

```bash
./scripts/deploy-prod.sh deploy
```

该命令会自动执行：

1. 本地构建后端与前端产物
2. 上传构建产物
3. 远端执行部署脚本
4. 健康检查与结果输出

### 4.2 全量发布

```bash
./scripts/deploy-prod.sh deploy --full
```

## 5. 生产运维常用命令

```bash
# 远端查看容器状态
docker ps

# 远端查看后端日志
docker logs -f myblog-backend

# 远端查看前端日志
docker logs -f myblog-frontend
```

## 6. 失败回滚建议

- 保留最近一次可用构建产物
- 通过备份目录恢复旧版本 JAR 与前端 dist
- 回滚后再次执行健康检查

## 7. 安全要求

- 严禁在文档中写入真实主机地址、账号和密钥
- 环境变量文件仅保存在受控环境中
- 部署日志输出如包含敏感字段应立即清理
