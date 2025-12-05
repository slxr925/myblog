# MyBlog 安全配置说明

## 安全功能概览

本系统实现了多层次的安全防护措施：

### 1. 认证和授权

#### JWT双Token机制
- **Access Token**: 短期有效(30分钟)，用于日常API访问
- **Refresh Token**: 长期有效(7天)，用于刷新Access Token
- **管理员IP绑定**: 管理员的Access Token绑定登录IP，防止token泄露后被滥用

#### 配置
```yaml
jwt:
  accessTokenExpiration: 1800  # 30分钟
  refreshTokenExpiration: 604800  # 7天
```

### 2. 请求频率限制（Rate Limiting）

使用Redis实现滑动窗口限流算法：

- **登录接口**: 5分钟5次
- **注册接口**: 1小时3次
- **评论接口**: 1分钟10次

#### 使用方式
```java
@RateLimit(key = "ip", limit = 5, window = 300, message = "操作过于频繁")
public Result login() { ... }
```

### 3. 登录失败锁定

- 连续5次登录失败后锁定账号10分钟
- 同时对IP和用户名进行锁定
- 登录成功后自动清除失败记录

### 4. Nginx反向代理

- 后端端口(8081)不直接暴露到公网
- 所有请求通过Nginx(80端口)统一入口
- 添加安全响应头

#### 安全响应头
```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### 5. 异常处理

- 401: 未授权（未登录）
- 403: 权限不足（无权限）
- 429: 请求过于频繁（限流）
- 423: 账号已锁定

## 部署安全检查清单

### 环境变量配置

确保`.env.prod`中配置了以下安全参数：

```bash
# JWT密钥（必须修改）
JWT_SECRET=your_secure_random_string_at_least_32_characters

# 数据库密码（必须修改）
MYSQL_PASSWORD=your_mysql_password

# Redis密码（如果启用）
REDIS_PASSWORD=your_redis_password

# Elasticsearch配置
ELASTICSEARCH_ENABLED=false  # 生产环境可选
```

### 网络配置

1. **端口映射检查**
   - ✅ 只开放80端口（Nginx）
   - ❌ 不要直接暴露8081端口（后端）
   - ❌ 不要直接暴露数据库端口

2. **防火墙规则**
   ```bash
   # 允许80端口
   sudo firewall-cmd --permanent --add-port=80/tcp
   
   # 禁止直接访问后端
   sudo firewall-cmd --permanent --remove-port=8081/tcp
   ```

### 管理员安全

1. **IP绑定**
   - 管理员登录时token自动绑定IP
   - 从不同IP使用token会被拒绝

2. **会话管理**
   - Access Token 30分钟自动过期
   - 需要使用Refresh Token刷新
   - 可以在Redis中查看/撤销会话

### 审计日志

所有管理员操作都会记录到`audit_log`表：
- 操作类型（CREATE/UPDATE/DELETE）
- 操作资源（BLOG/USER/CATEGORY）
- 操作时间、IP、参数

查询审计日志：
```sql
SELECT * FROM audit_log 
WHERE user_id = ? 
ORDER BY created_at DESC 
LIMIT 100;
```

## 安全最佳实践

1. **定期更换密钥**
   - 每季度更换JWT_SECRET
   - 定期更换数据库密码

2. **监控异常活动**
   - 定期检查audit_log
   - 监控失败登录次数
   - 监控限流触发频率

3. **备份策略**
   - 每天自动备份数据库
   - 保留最近7天的备份
   - 备份文件加密存储

4. **更新维护**
   - 及时更新Docker镜像
   - 定期更新依赖包
   - 关注安全公告

## 常见问题

### Q1: 管理员token在不同地方无法使用？
A: 这是正常的安全机制。管理员token绑定登录IP，只能在登录的IP地址使用。如果需要在多个地点管理，建议：
- 使用VPN保持IP一致
- 或者在每个地点重新登录

### Q2: 登录提示"账号已被锁定"？
A: 连续5次登录失败会触发锁定，等待10分钟或联系管理员清除锁定：
```bash
redis-cli DEL "login:locked:user:username"
redis-cli DEL "login:locked:ip:xxx.xxx.xxx.xxx"
```

### Q3: 如何查看当前活跃会话？
A: 在Redis中查询：
```bash
redis-cli KEYS "session:*"
```

### Q4: 如何手动撤销某个用户的会话？
A: 删除对应的session key：
```bash
redis-cli DEL "session:${token}"
```

## 紧急响应

### 发现异常访问

1. 立即锁定相关账号
2. 查看审计日志确认影响范围
3. 更换JWT_SECRET
4. 通知相关用户

### 数据泄露

1. 立即停止服务
2. 恢复最近的安全备份
3. 通知用户修改密码
4. 审查安全配置

## 联系方式

如有安全问题，请联系：security@yourdomain.com

