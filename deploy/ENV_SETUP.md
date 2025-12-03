# 环境变量配置指南

由于 `.env.prod` 文件包含敏感信息，不应提交到版本控制。请在服务器上手动创建此文件。

## 在服务器上创建 .env.prod

### 方式一：使用命令直接创建（推荐）

```bash
cd /app/myblog

# 生成JWT密钥
JWT_SECRET=$(openssl rand -base64 32)

# 创建 .env.prod 文件
cat > .env.prod << EOF
# MySQL配置 (宿主机端口: 13306)
MYSQL_USERNAME=myblog_user
MYSQL_PASSWORD=请替换为您的MySQL密码

# Redis配置 (宿主机端口: 26739)
REDIS_PASSWORD=

# Elasticsearch配置 (宿主机端口: 9200)
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_ENABLED=true

# JWT配置
JWT_SECRET=${JWT_SECRET}

# 服务器配置
SERVER_IP=49.235.139.118
EOF

# 设置文件权限（仅所有者可读写）
chmod 600 .env.prod

echo "环境变量文件已创建！"
echo "请编辑 .env.prod 并设置您的 MySQL 密码："
echo "  vi .env.prod"
```

### 方式二：手动创建

```bash
cd /app/myblog
vi .env.prod
```

然后复制以下内容并修改相应的值：

```env
# MySQL配置 (宿主机端口: 13306)
MYSQL_USERNAME=myblog_user
MYSQL_PASSWORD=YourActualMysqlPassword

# Redis配置 (宿主机端口: 26739)  
REDIS_PASSWORD=

# Elasticsearch配置 (宿主机端口: 9200)
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_ENABLED=true

# JWT配置 (至少32位随机字符串)
JWT_SECRET=your_randomly_generated_32_char_secret

# 服务器配置
SERVER_IP=49.235.139.118
```

## 配置说明

### MySQL密码
- 从容器管理界面或配置文件中获取您的MySQL容器密码
- 确保使用的是 `myblog_user` 用户的密码（会在数据库初始化脚本中创建）

### JWT密钥
- 必须至少32个字符
- 建议使用随机生成的字符串
- **生成命令**: `openssl rand -base64 32`

### Redis密码
- 如果您的Redis没有设置密码，保持为空即可
- 如果设置了密码，填写实际密码

### Elasticsearch认证
- 从图片看ES似乎没有启用安全认证
- 保持用户名和密码为空即可

## 验证配置

创建完成后，验证配置文件：

```bash
# 检查文件是否存在
ls -la .env.prod

# 查看文件内容（确保密码已填写）
cat .env.prod

# 检查文件权限（应该是 -rw-------）
ls -l .env.prod
```

## 安全提示

1. **.env.prod 文件权限**
   ```bash
   chmod 600 .env.prod  # 仅所有者可读写
   ```

2. **不要提交到Git**
   - 此文件已在 .gitignore 中
   - 永远不要 `git add .env.prod`

3. **使用强密码**
   - MySQL密码: 至少12位，包含大小写字母、数字、特殊字符
   - JWT密钥: 使用 `openssl rand -base64 32` 生成

4. **定期更换密钥**
   - 建议每6个月更换一次JWT密钥
   - 更换后需要重新部署应用

## 下一步

配置完成后，继续执行部署：

```bash
cd /app/myblog/deploy
./quick-deploy.sh
```

或参考 `SETUP_GUIDE.md` 进行手动部署。

