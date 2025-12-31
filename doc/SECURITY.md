# 敏感信息安全指南

## 📋 概述

本文档列出项目中所有包含敏感信息的文件，以及如何确保这些文件不会被错误提交到 Git 仓库。

## 🔐 敏感文件清单

### 1. 环境配置文件

#### `.env.prod` (生产环境配置)
**位置**: `/Users/xuran/Dev/myblog/.env.prod`

**包含内容**:
- MySQL 数据库密码
- Redis 密码
- JWT 密钥
- OpenAI API Key（如果启用）

**状态**: ✅ 已在 `.gitignore` 中配置
```gitignore
.env.prod
.env.production
```

#### `application-local.yml` (本地开发配置)
**位置**: `myblog-backend/src/main/resources/application-local.yml`

**包含内容**:
- 本地数据库配置
- 本地 Redis 配置
- 本地 API 密钥

**状态**: ✅ 已在 `.gitignore` 中配置
```gitignore
**/application-local.yml
**/application-local.yaml
```

### 2. 数据文件

#### Redis 数据文件
- `dump.rdb` - Redis 持久化数据
- `*.aof` - Redis AOF 日志

**状态**: ✅ 已在 `.gitignore` 中配置

#### 日志文件
所有 `*.log` 文件可能包含：
- 用户操作记录
- 数据库查询
- API 调用详情

**状态**: ✅ 已在 `.gitignore` 中配置

### 3. 构建产物

#### `build-info.txt`
包含构建时间、版本信息等

**状态**: ✅ 已在 `.gitignore` 中配置

## ✅ 安全检查清单

在每次提交代码前，请执行以下检查：

### 1. 检查 Git 状态
```bash
# 查看将要提交的文件
git status

# 查看所有被忽略的文件
git status --ignored
```

### 2. 验证敏感文件已被忽略
```bash
# 检查 .env.prod 是否被忽略
git check-ignore .env.prod
# 应该输出: .env.prod

# 检查本地配置是否被忽略
git check-ignore myblog-backend/src/main/resources/application-local.yml
# 应该输出: myblog-backend/src/main/resources/application-local.yml
```

### 3. 搜索可能的密码泄露
```bash
# 在代码中搜索硬编码的密码（不应该有结果）
grep -r "password.*=" --include="*.java" --include="*.ts" --include="*.tsx" myblog-backend/src myblog-frontend/src | grep -v "// TODO"

# 在配置文件中搜索密码引用
grep -r "password" myblog-backend/src/main/resources/*.yml | grep -v "local"
```

### 4. 检查提交历史
```bash
# 查看最近的提交
git log --oneline -5

# 查看某个提交的详细改动
git show <commit-hash>
```

## 🚫 绝对不能提交的文件

### 文件列表
- ❌ `.env.prod` - 生产环境配置
- ❌ `.env.local` - 本地环境配置  
- ❌ `application-local.yml` - 本地数据库配置
- ❌ `dump.rdb` - Redis 数据快照
- ❌ `*.log` - 所有日志文件
- ❌ `build-info.txt` - 构建信息
- ❌ 包含真实 API Key 的任何文件

### 如何验证
```bash
# 运行清理脚本
./deploy/local/cleanup.sh

# 检查 git 状态
git status

# 确认没有敏感文件出现在 "Changes to be committed" 或 "Untracked files" 中
```

## ✅ 可以安全提交的配置文件

### 模板文件（不包含真实密码）
- ✅ `docker-compose.yml` - 本地开发模板
- ✅ `docker-compose.prod.yml` - 生产环境模板（使用环境变量占位符）
- ✅ `application.yml` - 默认配置（不包含敏感信息）
- ✅ `application-prod.yml` - 生产配置模板（引用环境变量）

### 验证配置文件安全
在提交前检查这些文件：
```bash
# 1. docker-compose.prod.yml 应该使用环境变量
grep -E "MYSQL_PASSWORD|JWT_SECRET" docker-compose.prod.yml
# 应该输出如: ${MYSQL_PASSWORD} 而不是真实密码

# 2. application-prod.yml 应该使用占位符
grep "password" myblog-backend/src/main/resources/application-prod.yml
# 应该输出如: password: ${MYSQL_PASSWORD} 而不是真实密码
```

## 🔧 .gitignore 配置说明

### 当前配置（位于 `/Users/xuran/Dev/myblog/.gitignore`）

```gitignore
# ==================== 本地配置文件（敏感信息，禁止上传）====================
# 后端本地配置
**/application-local.yml
**/application-local.yaml

# 环境变量文件
.env
.env.local
.env.*.local
.env.prod
.env.production

# ==================== 数据库和缓存 ====================
*.rdb
*.aof
dump.rdb
*.log
*.sql.gz

# ==================== 临时文件和日志 ====================
logs/
*.log
log/
temp/
tmp/
*.tmp
*.bak

# ==================== 构建信息 ====================
build-info.txt
```

## 🆘 紧急情况处理

### 如果不小心提交了敏感信息

#### 1. 还没有 push 到远程
```bash
# 撤销最后一次提交（保留改动）
git reset --soft HEAD^

# 从暂存区移除敏感文件
git reset HEAD <sensitive-file>

# 确认文件在 .gitignore 中
echo "<sensitive-file>" >> .gitignore

# 重新提交
git add .gitignore
git commit -m "Add sensitive file to gitignore"
```

#### 2. 已经 push 到远程
```bash
# ⚠️ 警告：这会改变提交历史，需要强制推送

# 1. 从历史中完全删除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch <sensitive-file>" \
  --prune-empty --tag-name-filter cat -- --all

# 2. 确认文件在 .gitignore 中
echo "<sensitive-file>" >> .gitignore
git add .gitignore
git commit -m "Add sensitive file to gitignore"

# 3. 强制推送
git push origin --force --all

# 4. 立即更改泄露的密码！
```

#### 3. 立即更改密码
如果泄露了密码或密钥：
1. 立即登录服务器更改密码
2. 重新生成 JWT 密钥
3. 如果是 API Key，在对应平台上重新生成
4. 更新 `.env.prod` 文件
5. 重新部署应用

## 📋 部署前检查清单

在每次部署生产环境前：

- [ ] 运行清理脚本: `./deploy/local/cleanup.sh`
- [ ] 检查 git 状态: `git status`
- [ ] 验证没有敏感文件: `git status --ignored`
- [ ] 确认 `.env.prod` 不在提交列表中
- [ ] 确认没有真实密码在代码中
- [ ] 查看提交差异: `git diff`
- [ ] 提交并推送
- [ ] 部署到生产环境

## 💡 最佳实践

### 1. 使用环境变量
在所有配置文件中使用环境变量占位符：
```yaml
# ✅ Good
spring:
  datasource:
    password: ${MYSQL_PASSWORD}

# ❌ Bad  
spring:
  datasource:
    password: Kpiass123.
```

### 2. 维护 .gitignore
定期检查和更新 `.gitignore`：
```bash
# 查看当前被忽略的文件
git ls-files --others --ignored --exclude-standard

# 测试文件是否会被忽略
git check-ignore -v <file-path>
```

### 3. 定期审计
每月检查一次：
```bash
# 在整个仓库历史中搜索密码（谨慎使用）
git log -S "password" --all

# 检查最近的提交
git log --all --full-history --source -- .env.prod
```

### 4. 使用密钥管理工具
考虑使用：
- Git-crypt - 加密敏感文件
- Vault - 集中式密钥管理
- AWS Secrets Manager - 云端密钥管理

## 📞 问题报告

如果发现安全问题或敏感信息泄露：
1. 立即停止使用泄露的密钥
2. 在私下联系项目维护者（不要公开讨论）
3. 按照上述"紧急情况处理"步骤操作
4. 更改所有相关密码和密钥
