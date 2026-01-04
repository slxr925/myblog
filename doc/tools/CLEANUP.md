# 项目清理指南

## 📋 概述

本文档描述如何清理项目中的临时文件、日志文件和其他不需要提交到版本控制的文件。

## 🧹 自动清理

运行以下命令自动清理所有临时文件：

```bash
# 在项目根目录执行
./deploy/local/cleanup.sh
```

## 📝 手动清理清单

### 1. 日志文件
```bash
# 根目录日志
rm -f *.log dump.rdb

# 后端日志
rm -f myblog-backend/*.log

# 前端日志
rm -f myblog-frontend/*.log
```

### 2. 备份文件
```bash
# 删除所有 .bak 备份文件
find . -name "*.bak" -type f -delete

# 删除临时文件
find . -name "*.tmp" -type f -delete
find . -name "*~" -type f -delete
```

### 3. 系统文件
```bash
# macOS
find . -name ".DS_Store" -type f -delete

# Windows
find . -name "Thumbs.db" -type f -delete
find . -name "Desktop.ini" -type f -delete
```

### 4. 构建产物
```bash
# 后端构建产物（会被 .gitignore 忽略）
rm -rf myblog-backend/target/

# 前端构建产物（会被 .gitignore 忽略）
rm -rf myblog-frontend/dist/
rm -rf myblog-frontend/node_modules/
```

### 5. 临时数据
```bash
# Redis 数据文件
rm -f dump.rdb *.rdb

# 临时构建信息
rm -f build-info.txt
```

## ⚠️ 不应删除的文件

以下文件虽然包含配置信息，但需要保留（已在 .gitignore 中配置）：

### 保留但不提交
- `.env.prod` - 生产环境配置（包含敏感信息）
- `myblog-backend/src/main/resources/application-local.yml` - 本地开发配置
- `target/` - Maven构建目录
- `node_modules/` - npm依赖
- `dist/` - 前端构建产物

### 必须提交
- `docker-compose.yml` - 本地开发环境配置
- `docker-compose.prod.yml` - 生产环境模板
- `Dockerfile` 和 `Dockerfile.prod` - Docker镜像配置
- `nginx/nginx.conf` - Nginx配置
- 所有 `.sh` 脚本文件
- 所有 `.md` 文档文件

## 🔒 敏感信息检查

在提交代码前，请确保以下文件不被提交：

```bash
# 检查是否有敏感文件将被提交
git status

# 查看所有被忽略的文件
git status --ignored

# 检查 .gitignore 是否正确配置
cat .gitignore
```

### 敏感信息清单
- ❌ `.env.prod` - 包含数据库密码、JWT密钥等
- ❌ `application-local.yml` - 本地数据库配置
- ❌ `*.log` - 可能包含敏感运行信息
- ❌ `dump.rdb` - Redis数据快照
- ❌ `build-info.txt` - 构建信息

## 📊 清理前后对比

### 清理前
```
myblog/
├── dump.rdb (7.5MB)          ❌ 需清理
├── redis.log (2.2KB)         ❌ 需清理
├── server.log (1.9KB)        ❌ 需清理
├── build-info.txt            ❌ 需清理
├── deploy/.DS_Store          ❌ 需清理
├── myblog-backend/
│   ├── backend.log           ❌ 需清理
│   ├── backend_err.log       ❌ 需清理
│   └── *.bak                 ❌ 需清理
└── myblog-frontend/
    └── frontend.log          ❌ 需清理
```

### 清理后
```
myblog/
├── README.md                 ✅ 保留
├── docker-compose.yml        ✅ 保留
├── .gitignore               ✅ 保留
├── myblog-backend/          ✅ 保留
├── myblog-frontend/         ✅ 保留
├── deploy/                  ✅ 保留
├── doc/                     ✅ 保留
└── nginx/                   ✅ 保留
```

## 🔄 定期维护

建议每次部署前执行清理：

```bash
# 1. 清理临时文件
./deploy/local/cleanup.sh

# 2. 检查 git 状态
git status

# 3. 提交代码
git add .
git commit -m "your commit message"

# 4. 部署
./deploy/prod/deploy-update.sh
```

## 💡 提示

1. **清理不会影响运行**：所有清理的文件都是临时文件或可重新生成的文件
2. **保护敏感信息**：`.env.prod` 等敏感文件已在 `.gitignore` 中配置，不会被提交
3. **构建产物自动生成**：`target/` 和 `dist/` 在每次构建时会重新生成
4. **日志会重新创建**：应用运行时会自动创建新的日志文件

## 📞 问题反馈

如果清理后遇到问题，请检查：
1. 是否误删了必须的配置文件
2. `.gitignore` 是否正确配置
3. 环境变量是否正确设置
