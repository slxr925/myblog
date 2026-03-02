# 快速迭代发布指南

适用于“功能开发 -> 验证 -> 发布”的高频迭代场景。

## 1. 本地迭代

### 1.1 代码改动后快速更新

```bash
./deploy/local/deploy-update.sh
```

### 1.2 查看状态

```bash
docker compose ps
```

### 1.3 查看日志

```bash
docker logs -f myblog-backend
docker logs -f myblog-frontend
```

## 2. 生产迭代

```bash
./scripts/deploy-prod.sh deploy
```

默认流程：

1. 本地构建
2. 上传后端 JAR 与前端 dist
3. 远端执行增量部署
4. 健康检查

## 3. 发布前检查

- 前端 `npm run build` 通过
- 后端 `mvn package -DskipTests` 通过
- 文档和配置变更同步完成
- 不包含敏感信息和临时调试代码

## 4. 发布后检查

- 首页与文章详情可访问
- 关键 API 返回 200
- 日志无持续异常堆栈

## 5. 常见问题

### Q1：增量发布很慢

- 可能是镜像重建、网络拉取、远端 IO 导致
- 可先确认是否真的需要全量重建

### Q2：前端改动未生效

- 检查是否上传了最新 dist
- 清理浏览器缓存后再验证

### Q3：后端健康检查失败

- 检查环境变量是否齐全
- 检查数据库与缓存可达性
