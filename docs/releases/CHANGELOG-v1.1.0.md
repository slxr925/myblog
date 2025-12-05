# MyBlog v1.1.0 版本更新日志

发布日期：2025-12-05

## 🔒 安全增强

### 1. 认证机制优化
- **双Token机制**：实现Access Token和Refresh Token分离
  - Access Token：短期有效（30分钟），用于API请求
  - Refresh Token：长期有效（7天），用于刷新Access Token
  - 新增 `/api/auth/refresh` 端点用于Token刷新
  
- **管理员IP绑定**：管理员Token绑定登录IP地址
  - Token中包含IP信息
  - 每次请求验证IP是否匹配
  - 防止Token被盗用后从其他IP访问

### 2. 接口安全防护
- **请求频率限制**：基于Redis实现滑动窗口限流
  - 登录接口：5分钟内最多5次请求
  - 注册接口：1小时内最多3次请求
  - 支持按IP、用户ID等多种限流策略
  
- **登录失败锁定**：防止暴力破解
  - 连续5次登录失败后锁定10分钟
  - 支持IP级别和用户级别双重锁定
  - 登录成功自动清除失败计数

### 3. 审计日志系统
- 新增审计日志表 `tb_audit_log`
- 记录敏感操作的详细信息：
  - 操作用户、操作类型、操作资源
  - IP地址、User-Agent
  - 请求参数、操作状态、错误信息
- 支持通过注解 `@AuditLog` 标记需要审计的操作

### 4. 异常处理优化
- 修复Spring Security异常状态码问题
  - 未认证（401 Unauthorized）：需要登录
  - 权限不足（403 Forbidden）：无权访问
  - 限流（429 Too Many Requests）：请求过于频繁
- 统一返回JSON格式错误信息

## 🚀 部署架构优化

### 1. Nginx反向代理
- 新增Nginx服务作为统一入口
  - 隐藏后端8081端口，对外只暴露80端口
  - 前端静态文件直接由Nginx提供
  - 后端API通过 `/api` 路径代理
  - 上传文件通过 `/uploads` 路径代理
  
- 安全响应头配置
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security
  
- 性能优化
  - 静态资源缓存7天
  - Gzip压缩
  - Keep-Alive连接复用

### 2. Docker编排优化
- 修复前端容器端口配置（8080）
- 优化服务依赖关系和启动顺序
- 添加Nginx容器挂载前端dist目录
- 统一网络配置

### 3. 前端API配置优化
- 开发环境：直接访问 `http://localhost:8081/api`
- 生产环境：使用相对路径 `/api` 通过Nginx代理
- 自动根据环境切换API地址

## 📝 新增文件

### 后端代码
- `AuthController.java` - Token刷新接口
- `SecurityExceptionHandler.java` - 安全异常处理器
- `TokenResponse.java` - Token响应DTO
- `IpUtils.java` - IP地址工具类
- `RateLimit.java` - 限流注解
- `RateLimitAspect.java` - 限流切面
- `RateLimitException.java` - 限流异常
- `AuditLog.java` - 审计日志注解

### 数据库迁移
- `2025-12-05-add-audit-log.sql` - 审计日志表

### 部署配置
- `nginx/nginx.conf` - Nginx配置文件
- `nginx/health.html` - 健康检查页面
- `SECURITY.md` - 安全特性文档
- `SECURITY-DEPLOYMENT.md` - 安全功能部署指南
- `RELEASE-v1.1.0.md` - 版本发布说明

## 🔧 核心改动文件

### 后端
- `JwtUtils.java` - 支持双Token生成、IP绑定
- `JwtProperties.java` - 新增Token过期时间配置
- `JwtAuthenticationFilter.java` - 新增IP验证逻辑
- `SecurityConfig.java` - 配置异常处理器、开放健康检查端点
- `UserService.java` / `UserServiceImpl.java` - 返回双Token、登录锁定
- `UserController.java` - 支持TokenResponse返回
- `GlobalExceptionHandler.java` - 新增限流异常处理
- `application-prod.yml` - 禁用ES健康检查

### 前端
- `api.ts` - 动态API地址配置

### 部署
- `docker-compose.prod.yml` - 新增Nginx服务、修复端口配置

## 📊 影响范围

- **安全性**：大幅提升系统安全性，防护多种常见攻击
- **可维护性**：审计日志便于问题排查和合规审计
- **用户体验**：Token刷新机制减少频繁登录
- **部署架构**：Nginx反向代理提供更好的安全性和性能
- **向后兼容性**：完全兼容旧版，无需客户端改动（自动支持双Token）

## 🎯 部署说明

1. **数据库迁移**：执行 `2025-12-05-add-audit-log.sql`
2. **环境配置**：无需修改 `.env.prod`（使用默认配置）
3. **部署命令**：`./deploy-update.sh`
4. **验证方法**：参见 `SECURITY-DEPLOYMENT.md`

## 📌 注意事项

1. **Elasticsearch状态**：
   - 当前配置为可选（`ELASTICSEARCH_ENABLED=true`但容器未运行）
   - 搜索功能自动降级到MySQL
   - 如需启用ES：`docker start elasticsearch_xxx` 并重启backend

2. **Token机制变更**：
   - 前端需处理Token刷新逻辑（可选，token过期前自动刷新）
   - 管理员登录后IP变更会导致认证失败（安全特性）

3. **限流策略**：
   - 开发测试时注意限流配置
   - 可根据实际需求调整限流阈值

---

**版本**：v1.1.0  
**提交日期**：2025-12-05  
**提交者**：Ryan Xu

