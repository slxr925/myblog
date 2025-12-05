# Deploy 部署脚本目录

本目录包含所有部署相关的脚本工具。

## 📂 目录结构

```
deploy/
├── README.md              # 本说明文档
├── build-local.sh         # 本地构建脚本
├── deploy-update.sh       # 一键部署更新脚本
├── quick-deploy.sh        # 服务器端快速部署脚本
├── init-database.sh       # 数据库初始化脚本
├── backup.sh              # 数据备份脚本
├── logs.sh                # 日志查看脚本
└── stop.sh                # 服务停止脚本
```

## 🚀 核心脚本

### 1. build-local.sh - 本地构建
**用途**：在本地构建前后端应用

**使用方法**：
```bash
cd /Users/xuran/Dev/myblog
./deploy/build-local.sh
```

**功能**：
- 构建后端JAR包（Maven）
- 构建前端静态文件（npm）
- 生成版本信息文件

### 2. deploy-update.sh - 一键部署
**用途**：从本地一键部署到服务器

**使用方法**：
```bash
cd /Users/xuran/Dev/myblog
./deploy/deploy-update.sh
```

**功能**：
- 检查SSH连接
- 本地构建应用
- 上传构建产物到服务器
- 远程执行部署脚本
- 自动验证部署结果

**前置条件**：
- 已配置SSH密钥（见 [SSH配置](../docs/deployment/SSH-SETUP.md)）

### 3. quick-deploy.sh - 服务器端部署
**用途**：在服务器上执行部署

**使用方法**：
```bash
# 通常由deploy-update.sh自动调用
# 也可以在服务器上手动执行
cd /app/myblog/deploy
./quick-deploy.sh
```

**功能**：
- 检查环境和构建产物
- 备份当前版本
- 停止旧容器
- 构建Docker镜像
- 启动服务
- 健康检查

## 🔧 辅助脚本

### 4. init-database.sh - 数据库初始化
**用途**：初始化数据库和执行迁移

**使用方法**：
```bash
cd /app/myblog/deploy
./init-database.sh
```

**功能**：
- 检查MySQL连接
- 创建数据库
- 执行初始化SQL
- 运行迁移脚本

### 5. backup.sh - 数据备份
**用途**：备份数据库和上传文件

**使用方法**：
```bash
cd /app/myblog/deploy
./backup.sh
```

**功能**：
- 导出MySQL数据库
- 打包上传文件目录
- 保存到backups目录
- 自动清理30天前的备份

### 6. logs.sh - 日志查看
**用途**：查看服务日志

**使用方法**：
```bash
cd /app/myblog/deploy

# 查看后端日志
./logs.sh backend

# 查看前端日志
./logs.sh frontend

# 查看所有日志
./logs.sh all

# 实时查看后端日志
./logs.sh backend -f
```

### 7. stop.sh - 停止服务
**用途**：停止所有Docker服务

**使用方法**：
```bash
cd /app/myblog/deploy

# 停止服务（保留数据）
./stop.sh

# 停止服务并删除数据卷
./stop.sh --remove-volumes
```

## 📋 使用流程

### 首次部署
```bash
# 1. 服务器端：初始化数据库
ssh root@49.235.139.118
cd /app/myblog/deploy
./init-database.sh

# 2. 本地：一键部署
cd /Users/xuran/Dev/myblog
./deploy/deploy-update.sh
```

### 日常更新
```bash
# 本地一键部署
cd /Users/xuran/Dev/myblog
./deploy/deploy-update.sh
```

### 故障排查
```bash
# 查看日志
./deploy/logs.sh backend -f

# 重启服务
./deploy/stop.sh
./deploy/quick-deploy.sh

# 数据备份
./deploy/backup.sh
```

## 🔐 权限要求

所有脚本需要执行权限：
```bash
chmod +x deploy/*.sh
```

## 📚 相关文档

- [部署完整指南](../docs/deployment/DEPLOY-GUIDE.md)
- [SSH配置指南](../docs/deployment/SSH-SETUP.md)
- [版本更新指南](../docs/releases/VERSION-UPDATE-GUIDE.md)

## ⚠️ 注意事项

1. **环境变量**：确保服务器上存在 `/app/myblog/.env.prod` 文件
2. **SSH密钥**：本地部署需要配置SSH密钥认证
3. **备份习惯**：重要更新前先执行 `backup.sh`
4. **日志监控**：部署后使用 `logs.sh` 检查运行状态

## 🆘 常见问题

### Q: deploy-update.sh报SSH连接失败
**A**: 检查SSH密钥配置，执行 `ssh root@49.235.139.118` 测试连接

### Q: quick-deploy.sh报找不到JAR文件
**A**: 先执行 `build-local.sh` 构建应用

### Q: 容器启动失败
**A**: 执行 `logs.sh backend` 查看详细错误日志

### Q: 如何回滚版本
**A**: 
```bash
cd /app/myblog/backups
ls -la  # 查看备份
# 手动恢复对应版本的文件
```

---

**维护者**：Ryan Xu  
**最后更新**：2025-12-05

