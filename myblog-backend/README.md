# MyBlog 博客系统后端

一个基于 Spring Boot 3.5.5 构建的现代化博客系统后端，提供完整的博客管理、用户认证、内容发布等功能。

## 🚀 项目简介

MyBlog 是一个功能完善的博客系统后端，采用前后端分离架构，提供 RESTful API 接口。系统支持用户管理、博客发布、评论互动、文件上传、全文搜索等核心功能，适用于个人博客、企业官网、内容管理等场景。

## 🏗️ 技术架构

### 核心技术栈
- **框架**: Spring Boot 3.5.5 + JDK 21
- **安全框架**: Spring Security + JWT
- **数据持久层**: MyBatis Plus 3.5.9 + JPA
- **数据库**: MySQL 8.4
- **缓存**: Redis 7
- **搜索引擎**: Elasticsearch 8.11.0 (可选)
- **文档**: SpringDoc OpenAPI 3.0 (Swagger)
- **构建工具**: Maven 3.8+

### 开发环境
- **IDE**: IntelliJ IDEA / VS Code
- **Java版本**: JDK 21
- **数据库**: MySQL 8.4
- **缓存**: Redis 7
- **搜索**: Elasticsearch 8.11.0 (可选)

## 📋 功能特性

### ✅ 已实现功能

#### 用户管理模块
- **用户注册/登录**: 支持用户名、邮箱注册，JWT无状态认证
- **用户信息管理**: 头像、昵称、个人简介等个人信息维护
- **权限控制**: 基于角色的访问控制（普通用户、管理员）
- **密码安全**: BCrypt加密存储，密码强度验证

#### 博客内容模块
- **博客CRUD**: 完整的博客增删改查功能
- **状态管理**: 草稿、已发布、已下线三种状态
- **富文本编辑**: 支持HTML内容，图片上传
- **分类标签**: 博客分类和多标签管理
- **置顶功能**: 支持博客置顶展示
- **阅读量统计**: 自动统计博客阅读量
- **点赞功能**: 用户点赞/取消点赞

#### 评论系统模块
- **树形评论**: 支持多级评论回复
- **评论审核**: 待审核、已通过、已拒绝三种状态
- **评论点赞**: 支持评论点赞功能
- **评论统计**: 博客评论数量统计

#### 搜索功能模块
- **全文搜索**: 基于Elasticsearch的全文检索
- **高级搜索**: 按关键词、分类、标签组合搜索
- **搜索建议**: 提供搜索关键词自动补全
- **索引管理**: 支持索引重建和状态监控

#### 文件管理模块
- **图片上传**: 支持封面图、内容图片上传
- **文件上传**: 支持附件上传（管理员）
- **类型验证**: 文件类型和大小验证
- **富文本适配**: 支持wangEditor等富文本编辑器

#### 系统功能模块
- **缓存管理**: Redis分布式缓存，支持缓存预热
- **健康检查**: 系统健康状态监控
- **API文档**: Swagger在线文档和测试界面
- **异常处理**: 统一的异常处理和响应封装

### ❌ 未开发功能（待开发）

#### 用户系统扩展
- **密码重置**: 忘记密码重置功能
- **邮箱验证**: 注册邮箱验证激活
- **第三方登录**: 微信、QQ、GitHub等第三方登录
- **用户等级**: 用户等级和积分系统
- **个人中心**: 更完善的个人空间

#### 社交功能
- **关注/粉丝**: 用户间关注关系
- **私信系统**: 用户间私信交流
- **收藏功能**: 博客收藏和个人收藏夹
- **分享功能**: 博客分享到社交平台

#### 统计分析
- **访问统计**: 详细的访问数据分析
- **用户行为**: 用户行为轨迹分析
- **内容分析**: 博客内容热度分析
- **数据报表**: 各类统计报表导出

#### 系统管理
- **后台管理**: 管理后台界面
- **系统配置**: 系统参数配置管理
- **日志管理**: 操作日志和异常日志
- **数据备份**: 数据备份和恢复

#### 其他功能
- **消息通知**: 系统消息和邮件通知
- **SEO优化**: 搜索引擎优化
- **多语言**: 国际化多语言支持
- **移动端**: 移动端API适配

## 🔧 快速开始

### 环境要求
- JDK 21+
- MySQL 8.4+
- Redis 7+
- Maven 3.8+
- Elasticsearch 8.11.0+ (可选)

### 数据库配置
1. 创建数据库
```sql
CREATE DATABASE myblog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 执行数据库脚本
```bash
# 数据库表结构
mysql -u root -p myblog < src/main/resources/sql/schema.sql

# 初始化数据（可选）
mysql -u root -p myblog < src/main/resources/sql/data.sql
```

### 配置文件
编辑 `src/main/resources/application.yml`：

```yaml
# 数据库配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myblog?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: your_username
    password: your_password

# Redis配置
  data:
    redis:
      host: localhost
      port: 6379
      password: your_redis_password

# JWT配置
jwt:
  secret: your_jwt_secret_key_here
  expiration: 604800  # 7天
```

### 编译运行
```bash
# 克隆项目
git clone https://github.com/your-username/myblog.git
cd myblog

# 编译项目
mvn clean compile

# 运行测试
mvn test

# 打包项目
mvn clean package

# 运行应用
java -jar target/myblog-0.0.1-SNAPSHOT.jar
```

### Docker部署（可选）
```bash
# 构建镜像
docker build -t myblog .

# 运行容器
docker run -d -p 9999:9999 --name myblog myblog
```

## 📖 API文档

启动应用后，访问 Swagger API 文档：
- Swagger UI: http://localhost:9999/swagger-ui.html
- OpenAPI JSON: http://localhost:9999/v3/api-docs

### 主要API分组
- **用户API**: `/api/user/*` - 用户注册、登录、信息管理
- **博客API**: `/api/blog/*` - 博客CRUD、搜索、统计
- **评论API**: `/api/comment/*` - 评论发布、管理、点赞
- **文件API**: `/api/upload/*` - 文件上传、管理
- **搜索API**: `/api/search/*` - 全文搜索、建议
- **缓存API**: `/api/cache/*` - 缓存管理、预热

## 🔒 安全考虑

### ⚠️ 已知安全问题
1. **JWT密钥硬编码**: 配置文件中的JWT密钥需要移至环境变量
2. **数据库密码明文**: 生产环境应使用环境变量或配置中心
3. **文件上传安全**: 需要加强文件类型验证和路径安全
4. **评论点赞防刷**: 缺少用户点赞记录防重复机制

### 安全建议
- 使用HTTPS协议
- 配置Web应用防火墙
- 定期更新依赖包
- 实施API限流策略
- 敏感操作添加验证码

## 🚧 开发计划

### 第一阶段（近期）
- [ ] 密码重置功能
- [ ] 邮箱验证激活
- [ ] 访问统计功能
- [ ] 安全漏洞修复

### 第二阶段（中期）
- [ ] 第三方登录
- [ ] 用户关注系统
- [ ] 收藏功能
- [ ] 消息通知

### 第三阶段（长期）
- [ ] 后台管理系统
- [ ] 数据统计分析
- [ ] SEO优化
- [ ] 多语言支持

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

### 开发规范
- 遵循 Spring Boot 最佳实践
- 代码注释清晰
- 编写单元测试
- 保持API兼容性

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

## 📄 许可证

本项目基于 MIT 许可证开源，详见 [LICENSE](LICENSE) 文件。

## 🆘 支持与联系

如遇到问题，请通过以下方式联系：
- 提交 Issue
- 发送邮件至: your-email@example.com
- 项目主页: https://github.com/your-username/myblog

---

**⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！**