# 📋 版本迭代快速指南

> 代码改完了，如何快速部署到服务器？这份指南给你答案！

---

## 🚀 推荐方式：一键部署

### 前提条件（仅需配置一次）

```bash
# 配置SSH密钥（5分钟）
# 详细步骤: deploy/SSH-SETUP.md

ssh-copy-id root@49.235.139.118
```

### 日常更新流程

```bash
# 修改代码后...

cd /Users/xuran/Dev/myblog
./deploy-update.sh

# ✅ 就这一条命令！
# 脚本会自动：构建 → 上传 → 部署 → 验证
# 耗时：3-5分钟
```

---

## 🛠️ 备用方式：手动部署

如果没有配置SSH密钥，可以手动操作：

### 步骤1：本地构建

```bash
cd /Users/xuran/Dev/myblog
./build-local.sh

# 输出产物：
# ✅ myblog-backend/target/*.jar
# ✅ myblog-frontend/dist/
```

### 步骤2：上传到服务器

**通过宝塔面板**（推荐新手）：
1. 登录宝塔面板 → 文件管理
2. 上传 `myblog-backend/target/*.jar` 到 `/app/myblog/myblog-backend/target/`
3. 上传 `myblog-frontend/dist/` 所有文件到 `/app/myblog/myblog-frontend/dist/`

**通过命令行**（需要输入密码）：
```bash
# 上传后端JAR
scp myblog-backend/target/*.jar root@49.235.139.118:/app/myblog/myblog-backend/target/

# 上传前端dist
ssh root@49.235.139.118 "rm -rf /app/myblog/myblog-frontend/dist/*"
scp -r myblog-frontend/dist/* root@49.235.139.118:/app/myblog/myblog-frontend/dist/
```

### 步骤3：服务器部署

```bash
ssh root@49.235.139.118
cd /app/myblog/deploy
./quick-deploy.sh
```

### 步骤4：验证部署

```bash
# 检查服务状态
docker ps | grep myblog

# 访问应用
# 前端: http://49.235.139.118:3000
# 后端: http://49.235.139.118:8081
```

---

## 🔧 特殊情况

### 只修改了前端代码

```bash
# 本地构建前端
cd myblog-frontend
npm run build

# 上传dist目录
scp -r dist/* root@49.235.139.118:/app/myblog/myblog-frontend/dist/

# 重启前端容器
ssh root@49.235.139.118 "cd /app/myblog && docker-compose -f docker-compose.prod.yml restart frontend"
```

### 只修改了后端代码

```bash
# 本地构建后端
cd myblog-backend
mvn clean package -DskipTests

# 上传JAR
scp target/*.jar root@49.235.139.118:/app/myblog/myblog-backend/target/

# 重启后端容器
ssh root@49.235.139.118 "cd /app/myblog && docker-compose -f docker-compose.prod.yml restart backend"
```

### 修改了配置文件

如果修改了 `.env.prod` 或 `application-prod.yml`：

```bash
# 1. 如果只是修改 .env.prod
ssh root@49.235.139.118
vim /app/myblog/.env.prod
cd /app/myblog/deploy
./quick-deploy.sh  # 会自动同步配置

# 2. 如果修改了 application-prod.yml
# 需要重新打包后端
cd myblog-backend
mvn clean package -DskipTests
# 然后上传jar并部署
```

### 有数据库迁移

如果添加了新的数据库迁移脚本：

```bash
# 1. 上传迁移脚本
scp myblog-backend/database/migrations/*.sql \
    root@49.235.139.118:/app/myblog/myblog-backend/database/migrations/

# 2. 执行迁移
ssh root@49.235.139.118
cd /app/myblog/deploy
./init-database.sh

# 3. 部署新代码
./quick-deploy.sh
```

---

## 📊 方式对比

| 特性 | 一键部署 | 手动部署 | 只重启容器 |
|------|---------|---------|-----------|
| **配置要求** | SSH密钥 | 无 | SSH密钥 |
| **命令数量** | 1条 | 5-8条 | 1条 |
| **耗时** | 3-5分钟 | 5-10分钟 | 30秒 |
| **自动化** | 全自动 | 半自动 | 手动 |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## 🎯 最佳实践

### 版本号管理

每次重要更新修改版本号：

```xml
<!-- myblog-backend/pom.xml -->
<version>1.1.0</version>
```

```json
// myblog-frontend/package.json
"version": "1.1.0"
```

并打Git标签：

```bash
git tag -a v1.1.0 -m "新增功能：XXX"
git push origin v1.1.0
```

### 部署前检查清单

- [ ] 本地测试通过
- [ ] 代码已提交到Git
- [ ] 版本号已更新（重要更新）
- [ ] 数据库迁移已测试（如果有）
- [ ] 配置文件已更新（如果有）
- [ ] 服务器空间充足（`df -h`）

### 部署后验证清单

- [ ] 前端页面能正常访问
- [ ] 后端API能正常响应
- [ ] 登录功能正常
- [ ] 新功能工作正常
- [ ] 查看日志无ERROR
- [ ] 数据库数据正确

---

## 🆘 遇到问题？

### 部署失败自动回滚

`quick-deploy.sh` 会自动回滚，不用担心！

### 手动回滚

```bash
# 查看备份
ls -lh /app/myblog/backups/

# 恢复备份
cd /app/myblog/backups/backup-YYYYMMDD-HHMMSS/
cp myblog-backend/target/*.jar /app/myblog/myblog-backend/target/
cp -r myblog-frontend/dist/* /app/myblog/myblog-frontend/dist/
cd /app/myblog/deploy
./quick-deploy.sh
```

### 查看详细日志

```bash
# 后端日志
docker logs -f myblog-backend --tail 200

# 前端日志
docker logs -f myblog-frontend

# 应用日志
tail -f /app/myblog/data/backend/logs/myblog.log
```

---

## 📖 更多文档

- 📘 [完整部署文档](deploy/README.md)
- 🔑 [SSH密钥配置](deploy/SSH-SETUP.md)
- ⚙️ [配置管理指南](deploy/README.md#-核心配置)
- 🐛 [故障排查手册](deploy/README.md#-故障排查)

---

**记住：配置SSH密钥后，以后更新只需要一条命令！** 🚀

```bash
./deploy-update.sh
```

