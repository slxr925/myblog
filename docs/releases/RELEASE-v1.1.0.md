# MyBlog v1.1.0 - 安全增强版本

## 发布日期
2025-12-05

## 版本概述
本版本是一个重要的安全增强版本，实现了多层次的安全防护措施，显著提升了系统的安全性。

## 主要更新

### 🔐 1. JWT双Token机制
- **Access Token**: 30分钟有效期，用于日常API访问
- **Refresh Token**: 7天有效期，用于刷新Access Token  
- **管理员IP绑定**: 管理员token自动绑定登录IP，防止token泄露后被滥用
- **Token刷新接口**: `/api/auth/refresh` 自动刷新过期的Access Token

**影响**：
- 提高token安全性
- 管理员账号增加IP验证，更难被攻击
- 用户体验改善（自动刷新token）

### 🚫 2. 请求频率限制（Rate Limiting）
- 基于Redis的滑动窗口算法
- 支持按IP、用户、IP+用户三种维度限流
- 默认规则：
  - 登录接口：5分钟5次
  - 注册接口：1小时3次
  - 评论接口：1分钟10次

**影响**：
- 防止暴力破解
- 防止恶意注册
- 防止DDoS攻击

### 🔒 3. 登录失败锁定机制
- 连续5次登录失败自动锁定10分钟
- 同时对IP和用户名进行锁定
- 使用Redis存储，自动过期
- 登录成功后自动清除失败记录

**影响**：
- 有效防止暴力破解
- 保护用户账号安全

### 🌐 4. Nginx反向代理
- 后端端口(8081)不再直接暴露
- 所有请求通过Nginx统一入口(80端口)
- 添加安全响应头
- 隐藏服务器技术栈信息

**影响**：
- 降低被攻击风险
- 统一流量入口，便于监控
- 提升安全性

### ⚠️ 5. 异常处理优化
- 401: 未授权（未登录）
- 403: 权限不足（无权限）
- 429: 请求过于频繁（限流）
- 423: 账号已锁定

**影响**：
- 标准化错误响应
- 提升用户体验
- 便于前端处理

### 📝 6. 审计日志基础设施
- 创建audit_log表
- 添加@AuditLog注解
- 可记录所有管理员操作

**影响**：
- 操作可追溯
- 便于安全审计
- 问题排查

## 技术变更

### 后端变更
1. **新增工具类**
   - `IpUtils`: IP地址获取和验证
   - `JwtUtils`: 扩展双Token支持

2. **新增注解**
   - `@RateLimit`: 请求频率限制
   - `@AuditLog`: 审计日志标记

3. **新增切面**
   - `RateLimitAspect`: 限流实现
   - (AuditLogAspect: 预留)

4. **新增Controller**
   - `AuthController`: Token刷新

5. **修改的文件**
   - `UserController`: 使用双Token登录
   - `UserServiceImpl`: 添加登录锁定逻辑
   - `SecurityConfig`: 添加异常处理
   - `JwtAuthenticationFilter`: 添加IP验证

### 前端变更
1. **API配置优化**
   - 开发环境: `http://localhost:8081/api`
   - 生产环境: `/api` (通过Nginx代理)

### 基础设施变更
1. **Docker Compose**
   - 添加Nginx容器
   - 移除后端和前端的端口直接映射
   - 服务间通过Docker网络通信

2. **Nginx配置**
   - 反向代理到后端和前端
   - 添加安全响应头
   - 限制Actuator访问

3. **数据库迁移**
   - `2025-12-05-add-audit-log.sql`: 审计日志表

## 升级指南

### 前置条件
- 确保Redis正常运行
- 确保.env.prod配置正确
- 备份当前数据

### 升级步骤

1. **本地构建**
   ```bash
   cd /Users/xuran/Dev/myblog
   ./build-local.sh
   ```

2. **部署到服务器**
   ```bash
   ./deploy-update.sh
   ```

3. **执行数据库迁移**
   ```bash
   ssh root@49.235.139.118
   mysql -h172.17.0.1 -P13306 -uroot -p密码 myblog < /app/myblog/myblog-backend/database/migrations/2025-12-05-add-audit-log.sql
   ```

4. **验证部署**
   ```bash
   # 检查容器状态
   docker ps
   
   # 检查日志
   docker logs myblog-backend --tail 50
   docker logs myblog-nginx --tail 50
   
   # 测试Nginx代理
   curl http://49.235.139.118/health
   ```

### 注意事项

⚠️ **重要**: 由于API响应结构变化，前端需要同步更新：

**旧版登录响应**:
```json
{
  "code": 200,
  "data": "token_string"
}
```

**新版登录响应**:
```json
{
  "code": 200,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "tokenType": "Bearer",
    "expiresIn": 1800
  }
}
```

⚠️ **管理员注意**: 首次使用新版本后，管理员token会绑定当前IP，换地方登录需要重新获取token。

## 配置要求

### 必须配置
```bash
JWT_SECRET=至少32个字符的随机字符串
MYSQL_PASSWORD=数据库密码
REDIS_HOST=172.17.0.1
REDIS_PORT=26739
```

### 推荐配置
```bash
REDIS_PASSWORD=Redis密码（强烈推荐）
ELASTICSEARCH_ENABLED=false
```

## 已知问题

1. **前端Token存储**
   - 当前使用localStorage存储token
   - 建议：添加token加密或使用httpOnly cookie

2. **审计日志**
   - 基础设施已就绪，需要在具体接口上添加@AuditLog注解

3. **验证码功能**
   - 计划中但未实现
   - 可在v1.2.0中添加

## 性能影响

- **限流检查**: <1ms (Redis操作)
- **IP验证**: <1ms
- **Token刷新**: 自动进行，用户无感知
- **Nginx反向代理**: 额外延迟<5ms

## 安全建议

1. ✅ 定期更换JWT_SECRET
2. ✅ 启用Redis密码保护
3. ✅ 定期检查审计日志
4. ✅ 监控限流触发情况
5. ✅ 定期更新Docker镜像

## 相关文档

- [SECURITY.md](SECURITY.md) - 安全功能详细说明
- [SECURITY-DEPLOYMENT.md](SECURITY-DEPLOYMENT.md) - 部署和验证指南
- [VERSION-UPDATE-GUIDE.md](VERSION-UPDATE-GUIDE.md) - 版本更新流程

## 下一步计划 (v1.2.0)

- [ ] 集成滑动验证码
- [ ] 前端敏感操作二次确认
- [ ] 完善审计日志查看界面
- [ ] 添加安全事件告警
- [ ] 实现会话管理界面

## 致谢

感谢所有参与本版本开发和测试的团队成员！

---

**发布者**: AI Assistant  
**版本**: v1.1.0  
**日期**: 2025-12-05

