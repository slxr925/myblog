# 安全配置指南

本文档说明了如何安全地配置和部署 MyBlog 博客系统。

## 🔐 JWT 安全配置

### 1. 环境变量配置

生产环境必须通过环境变量设置 JWT 密钥：

```bash
# Linux/Mac
export JWT_SECRET="your_very_secure_jwt_secret_key_at_least_256_bits_long_1234567890!@#$%^&*()"
export JWT_EXPIRATION="604800"  # 可选，默认7天

# Windows
set JWT_SECRET=your_very_secure_jwt_secret_key_at_least_256_bits_long_1234567890!@#$%^&*()
set JWT_EXPIRATION=604800
```

### 2. Docker 环境配置

```bash
# docker run
docker run -d \
  -e JWT_SECRET="your_secure_jwt_secret_key" \
  -e JWT_EXPIRATION="604800" \
  -p 9999:9999 \
  --name myblog \
  myblog

# docker-compose.yml
version: '3.8'
services:
  myblog:
    image: myblog
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION=604800
    ports:
      - "9999:9999"
```

### 3. 密钥生成建议

生成强密钥的几种方法：

```bash
# 方法1: 使用 openssl
openssl rand -base64 64

# 方法2: 使用 date + md5
date | md5sum | head -c 64

# 方法3: 使用 /dev/urandom
head -c 64 /dev/urandom | base64

# 方法4: Python
python -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(48)).decode())"
```

### 4. 密钥管理最佳实践

1. **长度要求**: 至少32位字符，建议64位
2. **复杂度**: 包含大小写字母、数字、特殊字符
3. **唯一性**: 每个环境使用不同的密钥
4. **定期更换**: 建议每3-6个月更换一次
5. **安全存储**: 使用密钥管理服务（如AWS KMS、阿里云KMS）

## 🗃️ 数据库安全配置

### 1. 数据库连接安全

```bash
# 生产环境使用环境变量
export DB_USERNAME="myblog_user"
export DB_PASSWORD="your_secure_database_password"
export DB_HOST="localhost"
export DB_PORT="3306"
export DB_NAME="myblog"

# 连接字符串启用SSL
jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=true&requireSSL=true&verifyServerCertificate=true
```

### 2. 数据库用户权限

```sql
-- 创建专用数据库用户
CREATE USER 'myblog_user'@'localhost' IDENTIFIED BY 'secure_password';

-- 授予最小必要权限
GRANT SELECT, INSERT, UPDATE, DELETE ON myblog.* TO 'myblog_user'@'localhost';

-- 撤销危险权限
REVOKE ALL PRIVILEGES ON mysql.* FROM 'myblog_user'@'localhost';
REVOKE FILE ON *.* FROM 'myblog_user'@'localhost';
```

## 🔑 Redis 安全配置

### 1. Redis 密码配置

```bash
# 设置Redis密码
redis-cli CONFIG SET requirepass "your_secure_redis_password"

# 环境变量
export REDIS_PASSWORD="your_secure_redis_password"
```

### 2. Redis 网络安全

```bash
# 绑定特定IP
bind 127.0.0.1

# 禁用危险命令
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "CONFIG_4f5a8b9c"
```

## 🚀 部署安全建议

### 1. 环境变量文件

创建 `.env` 文件（不要提交到版本控制）：

```bash
# .env
JWT_SECRET=your_very_secure_jwt_secret_key_at_least_256_bits_long
DB_PASSWORD=your_secure_database_password
REDIS_PASSWORD=your_secure_redis_password

# 文件权限
chmod 600 .env
```

### 2. 应用配置

```yaml
# application-prod.yml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:myblog}?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=true&requireSSL=true
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD}

jwt:
  secret: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION:604800}
```

### 3. 系统安全

```bash
# 防火墙配置
ufw allow 9999/tcp
ufw deny 3306/tcp  # 数据库不对外开放
ufw deny 6379/tcp  # Redis不对外开放

# SSL证书
# 使用Let's Encrypt免费证书
# https://certbot.eff.org/
```

## 🛡️ 安全监控

### 1. 日志监控

```bash
# 监控异常登录
grep "登录失败" /app/logs/myblog.log | tail -20

# 监控JWT验证失败
grep "JWT" /app/logs/myblog.log | grep "error" | tail -20
```

### 2. 安全告警

- 监控登录失败次数
- 监控JWT验证失败频率
- 监控异常访问模式
- 监控数据库连接异常

## ⚠️ 安全检查清单

部署前请确认：

- [ ] JWT密钥已从环境变量读取
- [ ] 数据库密码已从环境变量读取
- [ ] Redis密码已配置
- [ ] 生产环境禁用了Swagger
- [ ] 已配置HTTPS
- [ ] 已配置防火墙规则
- [ ] 已配置日志监控
- [ ] 已备份数据库
- [ ] 已测试灾难恢复

## 🆘 安全事件处理

### JWT密钥泄露

1. 立即更换JWT密钥
2. 强制所有用户重新登录
3. 监控异常访问
4. 通知用户修改密码

### 数据库密码泄露

1. 立即修改数据库密码
2. 检查数据库访问日志
3. 更新应用配置
4. 重启应用服务

### 系统被入侵

1. 立即断开网络连接
2. 备份当前状态
3. 检查系统日志
4. 联系安全专家
5. 制定恢复计划

---

**重要提醒**：
- 定期更新依赖包
- 关注安全公告
- 定期进行安全审计
- 保持备份更新