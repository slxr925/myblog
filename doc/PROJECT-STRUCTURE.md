# 🏗️ MyBlog 项目结构说明

> 详细的项目结构和代码组织说明

## 📂 整体结构

```
myblog/
├── README.md                      # 项目主文档
├── docker-compose.yml             # 本地开发 Docker 配置
├── docker-compose.prod.yml        # 生产环境 Docker 配置
├── .env.example                   # 环境变量模板
├── .env.prod                      # 生产环境配置（不提交到Git）
├── .gitignore                     # Git 忽略文件
├── .dockerignore                  # Docker 忽略文件
│
├── doc/                           # 📚 文档中心
│   ├── README.md                 # 文档索引
│   ├── DEPLOYMENT.md             # 部署手册
│   ├── QUICK-ITERATION.md        # 快速迭代
│   ├── SSH-SETUP.md              # SSH 配置
│   └── PROJECT-STRUCTURE.md      # 本文档
│
├── deploy/                        # 🚀 部署脚本
│   ├── deploy-update.sh          # 一键部署（本地→服务器）
│   ├── build-local.sh            # 本地构建
│   ├── quick-deploy.sh           # 服务器部署
│   ├── init-database.sh          # 数据库初始化
│   ├── backup.sh                 # 数据备份
│   ├── logs.sh                   # 日志查看
│   └── stop.sh                   # 停止服务
│
├── myblog-backend/               # 后端 Spring Boot 应用
│   ├── src/                      # 源代码
│   ├── database/                 # 数据库脚本
│   ├── target/                   # 构建产物（不提交）
│   ├── pom.xml                   # Maven 配置
│   ├── Dockerfile                # 开发环境 Dockerfile
│   ├── Dockerfile.prod           # 生产环境 Dockerfile
│   └── .gitignore               # 后端 Git 忽略
│
├── myblog-frontend/              # 前端 React 应用
│   ├── src/                      # 源代码
│   ├── public/                   # 静态资源
│   ├── dist/                     # 构建产物（不提交）
│   ├── node_modules/             # NPM 依赖（不提交）
│   ├── package.json              # NPM 配置
│   ├── vite.config.ts            # Vite 配置
│   ├── tsconfig.json             # TypeScript 配置
│   ├── Dockerfile                # 开发环境 Dockerfile
│   ├── Dockerfile.prod           # 生产环境 Dockerfile
│   └── .gitignore               # 前端 Git 忽略
│
├── nginx/                         # Nginx 配置
│   ├── nginx.conf                # Nginx 主配置
│   └── health.html               # 健康检查页面
│
├── data/                          # 运行时数据目录（不提交）
│   ├── backend/
│   │   ├── logs/                 # 后端日志
│   │   └── uploads/              # 上传文件
│   └── nginx/
│       └── logs/                 # Nginx 日志
│
└── backups/                       # 备份目录（不提交）
    └── backup-*/                  # 按时间命名的备份
```

---

## 🔙 后端结构（myblog-backend）

### 目录结构

```
myblog-backend/
├── src/
│   ├── main/
│   │   ├── java/com/ryan/myblog/
│   │   │   ├── MyblogApplication.java    # 主入口
│   │   │   │
│   │   │   ├── annotation/               # 自定义注解
│   │   │   │   ├── RateLimit.java       # 限流注解
│   │   │   │   └── AuditLog.java        # 审计日志注解
│   │   │   │
│   │   │   ├── aspect/                   # AOP 切面
│   │   │   │   ├── RateLimitAspect.java # 限流切面
│   │   │   │   └── AuditLogAspect.java  # 审计日志切面
│   │   │   │
│   │   │   ├── config/                   # 配置类
│   │   │   │   ├── SecurityConfig.java  # Spring Security
│   │   │   │   ├── RedisConfig.java     # Redis
│   │   │   │   ├── CorsConfig.java      # 跨域
│   │   │   │   ├── JwtConfig.java       # JWT
│   │   │   │   └── SwaggerConfig.java   # Swagger/Knife4j
│   │   │   │
│   │   │   ├── controller/               # 控制器层
│   │   │   │   ├── AuthController.java  # 认证接口
│   │   │   │   ├── BlogController.java  # 博客接口
│   │   │   │   ├── UserController.java  # 用户接口
│   │   │   │   ├── CommentController.java # 评论接口
│   │   │   │   ├── CategoryController.java # 分类接口
│   │   │   │   ├── TagController.java   # 标签接口
│   │   │   │   └── UploadController.java # 上传接口
│   │   │   │
│   │   │   ├── service/                  # 服务层接口
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── BlogService.java
│   │   │   │   ├── UserService.java
│   │   │   │   ├── CommentService.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── service/impl/             # 服务层实现
│   │   │   │   ├── AuthServiceImpl.java
│   │   │   │   ├── BlogServiceImpl.java
│   │   │   │   ├── UserServiceImpl.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── mapper/                   # MyBatis Mapper
│   │   │   │   ├── BlogMapper.java
│   │   │   │   ├── UserMapper.java
│   │   │   │   ├── CommentMapper.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── model/                    # 数据模型
│   │   │   │   ├── entity/              # 实体类（对应数据库表）
│   │   │   │   │   ├── Blog.java
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Comment.java
│   │   │   │   │   └── ...
│   │   │   │   ├── dto/                 # 数据传输对象（请求参数）
│   │   │   │   │   ├── BlogCreateDTO.java
│   │   │   │   │   ├── LoginDTO.java
│   │   │   │   │   └── ...
│   │   │   │   └── vo/                  # 视图对象（响应数据）
│   │   │   │       ├── BlogVO.java
│   │   │   │       ├── UserVO.java
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── utils/                    # 工具类
│   │   │   │   ├── JwtUtils.java       # JWT 工具
│   │   │   │   ├── RedisUtils.java     # Redis 工具
│   │   │   │   ├── SecurityUtils.java  # 安全工具
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── exception/                # 异常处理
│   │   │   │   ├── GlobalExceptionHandler.java # 全局异常处理
│   │   │   │   ├── BusinessException.java # 业务异常
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── common/                   # 公共类
│   │   │   │   ├── Result.java         # 统一响应格式
│   │   │   │   ├── PageResult.java     # 分页响应
│   │   │   │   └── Constants.java      # 常量
│   │   │   │
│   │   │   └── filter/                   # 过滤器
│   │   │       └── JwtAuthenticationFilter.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml          # 主配置文件
│   │       ├── application-local.yml    # 本地开发配置
│   │       ├── application-prod.yml     # 生产环境配置
│   │       ├── mapper/                  # MyBatis XML 映射文件
│   │       │   ├── BlogMapper.xml
│   │       │   ├── UserMapper.xml
│   │       │   └── ...
│   │       ├── static/                  # 静态资源
│   │       └── templates/               # 模板文件
│   │
│   └── test/                             # 测试代码
│       └── java/com/ryan/myblog/
│           └── ...
│
├── database/                             # 数据库脚本
│   ├── init.sql                         # 初始化脚本（表结构）
│   ├── seed_articles.sql                # 测试数据
│   └── migrations/                      # 数据库迁移脚本
│       └── 2025-12-07-add-performance-indexes.sql
│
├── target/                               # Maven 构建产物
│   └── myblog-0.0.1-SNAPSHOT.jar        # 可执行 JAR 包
│
├── pom.xml                               # Maven 配置
├── Dockerfile                            # 开发环境 Dockerfile
└── Dockerfile.prod                       # 生产环境 Dockerfile
```

### 核心技术栈

- **Spring Boot 3.5.5** - 主框架
- **Spring Security** - 安全认证
- **MyBatis Plus** - ORM 框架
- **MySQL 8.0** - 数据库
- **Redis 7.x** - 缓存
- **JWT** - 无状态认证
- **Knife4j** - API 文档

---

## 🎨 前端结构（myblog-frontend）

### 目录结构

```
myblog-frontend/
├── src/
│   ├── main.tsx                         # 入口文件
│   ├── App.tsx                          # 根组件
│   │
│   ├── pages/                           # 页面组件
│   │   ├── Home.tsx                    # 首页
│   │   ├── BlogDetail.tsx              # 博客详情
│   │   ├── Profile.tsx                 # 个人中心
│   │   ├── Login.tsx                   # 登录页
│   │   ├── Register.tsx                # 注册页
│   │   ├── CreateBlog.tsx              # 创建博客
│   │   ├── EditBlog.tsx                # 编辑博客
│   │   └── Admin/                      # 管理后台
│   │       ├── Dashboard.tsx
│   │       ├── UserManagement.tsx
│   │       └── ...
│   │
│   ├── components/                      # 通用组件
│   │   ├── layout/                     # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── blog/                       # 博客相关组件
│   │   │   ├── BlogCard.tsx
│   │   │   ├── BlogList.tsx
│   │   │   └── MarkdownEditor.tsx
│   │   ├── comment/                    # 评论组件
│   │   │   ├── CommentList.tsx
│   │   │   └── CommentForm.tsx
│   │   ├── profile/                    # 个人中心组件
│   │   │   ├── MyBlogs.tsx
│   │   │   ├── MyComments.tsx
│   │   │   ├── MyLikes.tsx
│   │   │   └── MyFollowers.tsx
│   │   └── ui/                         # UI 组件
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       └── ...
│   │
│   ├── contexts/                        # React Context
│   │   ├── AuthContext.tsx             # 认证上下文
│   │   └── ThemeContext.tsx            # 主题上下文
│   │
│   ├── hooks/                           # 自定义 Hooks
│   │   ├── useAuth.ts                  # 认证 Hook
│   │   ├── useBlog.ts                  # 博客 Hook
│   │   └── useComment.ts               # 评论 Hook
│   │
│   ├── utils/                           # 工具函数
│   │   ├── request.ts                  # axios 封装
│   │   ├── auth.ts                     # 认证工具
│   │   └── format.ts                   # 格式化工具
│   │
│   ├── types/                           # TypeScript 类型定义
│   │   ├── blog.ts
│   │   ├── user.ts
│   │   ├── comment.ts
│   │   └── api.ts
│   │
│   ├── api/                             # API 接口
│   │   ├── auth.ts
│   │   ├── blog.ts
│   │   ├── user.ts
│   │   ├── comment.ts
│   │   └── upload.ts
│   │
│   ├── styles/                          # 样式文件
│   │   ├── index.css                   # 全局样式
│   │   └── variables.css               # CSS 变量
│   │
│   └── assets/                          # 静态资源
│       └── images/
│
├── public/                               # 公共静态文件
│   └── favicon.ico
│
├── dist/                                 # 构建产物
│   ├── index.html
│   ├── assets/
│   └── ...
│
├── node_modules/                         # NPM 依赖
│
├── index.html                            # HTML 模板
├── package.json                          # NPM 配置
├── package-lock.json                     # NPM 锁文件
├── vite.config.ts                        # Vite 配置
├── tsconfig.json                         # TypeScript 配置
├── tsconfig.node.json                    # Node TypeScript 配置
├── Dockerfile                            # 开发环境 Dockerfile
└── Dockerfile.prod                       # 生产环境 Dockerfile
```

### 核心技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型系统
- **Vite** - 构建工具
- **Tailwind CSS** - CSS 框架
- **Radix UI** - 组件库
- **Axios** - HTTP 客户端
- **React Router** - 路由

---

## 🚀 部署脚本（deploy/）

### 脚本说明

| 脚本 | 用途 | 执行位置 | 使用场景 |
|------|------|---------|---------|
| `deploy-update.sh` | 一键部署 | 本地 | 日常迭代部署 ⭐⭐⭐ |
| `build-local.sh` | 本地构建 | 本地 | 手动部署第一步 |
| `quick-deploy.sh` | 服务器部署 | 服务器 | 手动部署第二步 |
| `init-database.sh` | 数据库初始化 | 服务器 | 首次部署 |
| `backup.sh` | 数据备份 | 服务器 | 定期备份 |
| `logs.sh` | 查看日志 | 服务器 | 故障排查 |
| `stop.sh` | 停止服务 | 服务器 | 维护停机 |

### 脚本依赖关系

```
本地开发者
    ↓
deploy-update.sh（一键部署）
    ├── build-local.sh（本地构建）
    │   ├── mvn clean package
    │   └── npm run build
    │
    ├── scp（上传文件）
    │   ├── jar → 服务器
    │   └── dist → 服务器
    │
    └── ssh（远程执行）
        └── quick-deploy.sh（服务器部署）
            ├── 停止旧容器
            ├── 构建新镜像
            ├── 启动新容器
            └── 健康检查
```

---

## 🐳 Docker 配置

### docker-compose.yml（本地开发）

```yaml
services:
  mysql:      # MySQL 8.0
  redis:      # Redis 7.x
  backend:    # Spring Boot 后端
  frontend:   # React 前端
```

### docker-compose.prod.yml（生产环境）

```yaml
services:
  nginx:      # Nginx 反向代理
  backend:    # Spring Boot 后端
  frontend:   # React 前端（静态文件）
```

**区别：**
- 本地：包含 MySQL、Redis，方便开发
- 生产：使用外部 MySQL、Redis（宝塔面板部署）

---

## 📄 配置文件

### 环境变量文件

```
.env.example           # 环境变量模板（提交到 Git）
.env                   # 本地开发配置（不提交）
.env.prod              # 生产环境配置（不提交）
```

### 重要配置项

```bash
# 数据库配置
MYSQL_HOST=172.17.0.1
MYSQL_PORT=13306
MYSQL_DATABASE=myblog
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_password

# Redis 配置
REDIS_HOST=172.17.0.1
REDIS_PORT=26739
REDIS_PASSWORD=your_password

# JWT 配置
JWT_SECRET=your_jwt_secret_key_at_least_32_characters

# Elasticsearch（可选）
ELASTICSEARCH_ENABLED=false
```

---

## 🗃️ 数据库结构

### 主要数据表

```
tb_user                # 用户表
tb_blog                # 博客表
tb_comment             # 评论表
tb_category            # 分类表
tb_tag                 # 标签表
tb_blog_tag            # 博客-标签关联表
tb_user_like           # 用户点赞表
tb_user_follow         # 用户关注表
```

### 数据库脚本

```
database/
├── init.sql                              # 数据库初始化（表结构）
├── seed_articles.sql                     # 测试数据
└── migrations/                           # 数据库迁移
    └── 2025-12-07-add-performance-indexes.sql
```

---

## 📦 构建产物

### 后端构建产物

```
myblog-backend/target/
└── myblog-0.0.1-SNAPSHOT.jar            # 可执行 JAR 包（85MB 左右）
```

### 前端构建产物

```
myblog-frontend/dist/
├── index.html                            # HTML 入口
├── assets/
│   ├── index-[hash].js                  # JavaScript 主文件
│   ├── index-[hash].css                 # CSS 主文件
│   └── ...                              # 其他资源文件
└── favicon.ico
```

---

## 🚫 不提交到 Git 的文件

### .gitignore 配置

```
# 构建产物
target/
dist/
node_modules/

# 运行时数据
data/
backups/
*.log
*.rdb

# 配置文件
.env.prod
.env

# IDE
.idea/
.vscode/
*.iml

# 系统文件
.DS_Store
Thumbs.db
```

---

## 🔄 数据流向

### 用户请求流程

```
用户浏览器
    ↓
Nginx (80端口)
    ↓
前端 React (容器内3000端口)
    ↓ (API 请求)
后端 Spring Boot (容器内8081端口)
    ↓
MySQL / Redis / Elasticsearch
```

### 文件上传流程

```
前端上传
    ↓
后端接收 (/api/upload)
    ↓
保存到 /app/uploads
    ↓
返回访问 URL
```

---

## 📝 命名规范

### Java 命名

-** 类名**：大驼峰（PascalCase）- `UserController`
- **方法名**：小驼峰（camelCase）- `getUserById`
- **常量**：全大写下划线（UPPER_CASE）- `MAX_PAGE_SIZE`
- **包名**：全小写（lowercase）- `com.ryan.myblog.controller`

### TypeScript / React 命名

- **组件**：大驼峰（PascalCase）- `BlogCard.tsx`
- **函数**：小驼峰（camelCase）- `getUserInfo`
- **常量**：全大写下划线（UPPER_CASE）- `API_BASE_URL`
- **接口/类型**：大驼峰（PascalCase）- `interface User {}`

### 数据库命名

- **表名**：小写下划线（snake_case）- `tb_user`、`tb_blog`
- **字段名**：小写下划线（snake_case）- `user_id`、`create_time`

---

## 🎯 代码组织原则

### 1. 单一职责

每个类/组件只负责一个功能。

### 2. 分层架构

```
Controller → Service → Mapper → Database
```

### 3. 依赖注入

使用 Spring 依赖注入，避免 `new` 创建对象。

### 4. 统一响应格式

```java
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

---

**了解项目结构，开发更高效！** 🚀

**最后更新：** 2025-12-18
