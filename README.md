# MyBlog - 现代化全栈博客系统

<div align="center">

![MyBlog](https://img.shields.io/badge/MyBlog-v2.0-blue?style=for-the-badge)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-green?style=for-the-badge&logo=spring-boot)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

**功能完整、开箱即用的现代化博客系统**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [在线演示](http://49.235.139.118:3000) • [技术栈](#-技术栈) • [面试文档](doc/interview/INTERVIEW-GUIDE.md)

</div>

---

## 📖 项目简介

MyBlog 是一个基于 Spring Boot + React 构建的现代化博客系统，采用前后端分离架构。提供完整的博客管理、用户系统、评论互动、全文搜索、实时通知等功能，支持 Docker 一键部署。

**在线体验**：http://49.235.139.118:3000  
**默认账号**：`admin` / `admin123`

### ✨ 核心亮点

- 🎨 **现代化设计** - 响应式布局，完美适配移动端，支持暗黑模式
- 🚀 **高性能架构** - Redis缓存 + Elasticsearch全文搜索 + 前后端分离
- 🔒 **企业级安全** - 分布式锁 + 接口限流 + Spring Security + JWT认证
- 🤖 **AI智能助手** - Spring AI集成，支持智能问答和内容优化
- 📊 **性能优化** - 读写分离 + 雪花算法 + 异步处理 + 缓存预热
- 🐳 **一键部署** - Docker容器化，3分钟完成部署更新
- 📱 **移动优先** - 针对320px-375px小屏幕优化，完美适配各种设备
- 🎯 **开发友好** - TypeScript类型安全 + 完整API文档 + 自动化脚本

## 🎯 功能特性

### 用户功能
- ✅ 用户注册、登录、个人资料管理
- ✅ Markdown编辑器，支持实时预览
- ✅ 文章发布、草稿保存、分类标签
- ✅ 评论互动、点赞、关注功能
- ✅ 全文搜索、高级筛选
- ✅ 实时通知系统（点赞、评论、关注提醒）
- ✅ WebSocket实时推送 + Kafka消息队列
- ✅ 个人文章管理面板
- ✅ AI智能助手（问答、内容优化）
- ✅ 实时搜索建议

### 管理功能
- ✅ 用户管理（查看、编辑、禁用）
- ✅ 文章管理（审核、编辑、删除）
- ✅ 评论管理（审核、删除）
- ✅ 分类标签管理
- ✅ 数据统计分析
- ✅ **监控系统Dashboard** - 系统指标、性能指标、业务指标实时监控 ⭐
- ✅ AI辅助写作（标题生成、内容润色、关键词提取）

### 后端增强功能 ⭐
- ✅ **Redis分布式锁** - 防止并发操作导致数据不一致
- ✅ **全局接口限流** - 滑动窗口算法，防止恶意攻击
- ✅ **雪花算法ID** - 分布式ID生成，支持分库分表
- ✅ **读写分离架构** - 高频操作写Redis，异步同步MySQL
- ✅ **异步事件驱动** - Kafka消息队列 + Spring Event
- ✅ **多种设计模式** - 工厂、观察者、代理、策略、门面等

## 🚀 快速开始

### 方式一：Docker 一键启动（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd myblog

# 2. 启动所有服务
docker-compose up -d

# 3. 访问应用
open http://localhost:3000
```

就这么简单！所有服务（MySQL、Redis、Elasticsearch、后端、前端）都会自动启动。

**默认账号**：
- 用户名：`admin`
- 密码：`admin123`

### 方式二：本地开发

#### 环境要求
- Node.js 18+
- Java 21+
- MySQL 8.0+
- Redis 7.0+

#### 启动步骤

**1. 数据库初始化**
```bash
mysql -u root -p < myblog-backend/database/init.sql
```

**2. 启动后端**
```bash
cd myblog-backend
./mvnw spring-boot:run
```

**3. 启动前端**
```bash
cd myblog-frontend
npm install
npm run dev
```

**4. 访问应用**
- 前端：http://localhost:5173
- 后端：http://localhost:8081
- API文档：http://localhost:8081/doc.html

## 🌐 服务器部署

### 部署方式

MyBlog 支持两种部署方式：

#### 方式一：Docker 部署（推荐）⭐

**适用场景**：生产环境，已有Docker环境

**特点**：
- ✅ 本地构建，服务器运行
- ✅ 资源占用小，部署快速
- ✅ 支持一键迭代更新

**部署步骤**：

```bash
# === 本地操作 ===
# 1. 构建项目
cd /path/to/myblog
./build-local.sh

# 2. 上传到服务器（通过宝塔面板或scp）
# - myblog-backend/target/*.jar → /app/myblog/myblog-backend/target/
# - myblog-frontend/dist/ → /app/myblog/myblog-frontend/dist/
# - deploy/, docker-compose.prod.yml, .env.prod 等文件

# === 服务器操作 ===
# 3. 配置环境变量
ssh root@your-server
vim /app/myblog/.env.prod  # 配置MySQL、Redis等

# 4. 初始化数据库
cd /app/myblog/deploy
./init-database.sh

# 5. 部署应用
./quick-deploy.sh
```

部署完成！访问 `http://your-server-ip:3000` 查看效果。

---

#### 方式二：一键迭代部署（推荐日常使用）⭐⭐⭐

**适用场景**：配置SSH密钥后的日常开发迭代

**特点**：
- 🚀 一条命令完成构建+上传+部署
- ⏱️ 3-5分钟完成更新
- 🔄 适合频繁迭代

**使用方法**：

```bash
# 1. 配置SSH密钥（只需一次，5分钟）
# 查看: deploy/SSH-SETUP.md

# 2. 以后每次更新只需一条命令
cd /path/to/myblog
./deploy-update.sh
```

---

### 📚 文档中心

**完整文档请查看：** [doc/README.md](doc/README.md)

#### 部署相关文档

| 文档 | 说明 | 适用场景 |
|------|------|-------|
| 📦 [doc/deploy/DEPLOYMENT.md](doc/deploy/DEPLOYMENT.md) | **完整部署手册** | 首次部署必读 ⭐ |
| 🚀 [doc/deploy/QUICK-ITERATION.md](doc/deploy/QUICK-ITERATION.md) | **快速迭代部署** | 日常开发最常用 ⭐⭐⭐ |
| 🔐 [doc/deploy/SSH-SETUP.md](doc/deploy/SSH-SETUP.md) | **SSH密钥配置** | 实现一键部署 |

#### 技术文档（面试必备）⭐⭐⭐

| 文档 | 说明 | 用途 |
|------|------|------|
| 🎯 [doc/interview/INTERVIEW-GUIDE.md](doc/interview/INTERVIEW-GUIDE.md) | **综合面试指南** | 项目介绍+技术栈+难点解析+Q&A |
| 🏛️ [doc/interview/DESIGN-PATTERNS.md](doc/interview/DESIGN-PATTERNS.md) | **设计模式应用** | 8种设计模式实战案例 |
| ⚡ [doc/interview/PERFORMANCE-GUIDE.md](doc/interview/PERFORMANCE-GUIDE.md) | **性能优化实践** | 缓存+并发+数据库优化 |
| ❄️ [doc/interview/SNOWFLAKE-MIGRATION.md](doc/interview/SNOWFLAKE-MIGRATION.md) | **雪花算法迁移** | 分布式ID生成策略 |
| 📊 [doc/interview/PROJECT-SUMMARY.md](doc/interview/PROJECT-SUMMARY.md) | **项目完整总结** | 功能+技术+指标全览 |

**快速开始：**
- 🆕 首次部署 → [DEPLOYMENT.md](doc/deploy/DEPLOYMENT.md)
- 🔄 日常更新 → [QUICK-ITERATION.md](doc/deploy/QUICK-ITERATION.md)
- 💼 准备面试 → [INTERVIEW-GUIDE.md](doc/interview/INTERVIEW-GUIDE.md) ⭐
- 💻 本地开发 → 参考项目结构文档

### 常用运维命令

```bash
cd /app/myblog

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker logs -f myblog-backend
docker logs -f myblog-frontend

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
cd deploy && ./stop.sh

# 数据备份
cd deploy && ./backup.sh
```

## 🛠️ 技术栈

### 后端技术
- **Spring Boot 3.5.5** - 企业级Java应用框架
- **Spring Security** - 安全认证与授权
- **Spring Data JPA** - 数据持久化
- **MyBatis Plus 3.5.9** - 增强型ORM框架
- **MySQL 8.0** - 关系型数据库
- **Redis 7.x** - 高性能缓存系统
- **Elasticsearch 8.11** - 全文搜索引擎
- **Apache Kafka 3.9** - 分布式消息队列（通知系统）
- **WebSocket** - 实时双向通信（实时通知推送）
- **Spring AI 1.1.2** - AI集成框架（支持智能助手功能）
- **JWT 0.12.3** - 无状态身份认证
- **Knife4j 4.3.0** - API文档工具

### 前端技术
- **React 19.1** - 最新版UI框架
- **TypeScript 5.8** - 类型安全的JavaScript
- **Vite 7.1** - 新一代前端构建工具
- **Tailwind CSS 4.1** - 原子化CSS框架
- **Radix UI** - 无障碍组件库
- **Framer Motion 12** - 流畅动画库
- **React Router 7.9** - 路由管理
- **Axios 1.12** - HTTP客户端
- **React Markdown** - Markdown渲染
- **Recharts** - 数据可视化

### 基础设施
- **Docker** - 容器化部署
- **Docker Compose** - 服务编排
- **Nginx 1.27** - 反向代理与负载均衡
- **Java 21** - LTS版本运行时
- **Node.js 18+** - 前端开发环境

### 开发工具
- **Maven** - 后端依赖管理
- **npm** - 前端包管理
- **Git** - 版本控制
- **Shell Script** - 自动化部署脚本

## 📸 界面预览

### 首页
现代化的博客首页，响应式设计，支持暗黑模式。

### 文章详情
Markdown渲染，代码高亮，目录导航，评论互动。

### 管理后台
数据统计、用户管理、内容管理一应俱全。

## 🗂️ 项目结构

### 整体目录

```
myblog/
├── README.md                      # 项目主文档
├── docker-compose.yml             # 本地开发 Docker 配置
├── docker-compose.prod.yml        # 生产环境 Docker 配置
├── .env.prod                      # 生产环境配置（不提交）
│
├── doc/                           # 📚 文档中心
│   ├── README.md                  # 文档索引
│   ├── DEPLOYMENT.md              # 部署手册
│   ├── QUICK-ITERATION.md         # 快速迭代
│   └── ...                        # 其他文档
│
├── deploy/                        # 🚀 部署脚本
│   ├── deploy-update.sh           # 一键部署
│   ├── build-local.sh             # 本地构建
│   ├── quick-deploy.sh            # 服务器部署
│   ├── init-database.sh           # 数据库初始化
│   ├── backup.sh                  # 数据备份
│   ├── logs.sh                    # 日志查看
│   └── stop.sh                    # 停止服务
│
├── myblog-backend/                # 后端 Spring Boot
│   ├── src/main/java/             # Java 源代码
│   │   └── com/ryan/myblog/
│   │       ├── annotation/        # 自定义注解（限流、分布式锁）
│   │       ├── aspect/            # AOP 切面
│   │       ├── config/            # 配置类
│   │       ├── controller/        # REST API 控制器
│   │       ├── service/           # 业务逻辑层
│   │       ├── mapper/            # 数据访问层
│   │       ├── model/             # 数据模型（entity/dto/vo）
│   │       ├── utils/             # 工具类
│   │       ├── exception/         # 异常处理
│   │       └── common/            # 公共类
│   ├── src/main/resources/        # 配置文件
│   ├── database/                  # 数据库脚本
│   ├── target/                    # 构建产物
│   └── pom.xml                    # Maven 配置
│
├── myblog-frontend/               # 前端 React
│   ├── src/
│   │   ├── pages/                 # 页面组件
│   │   ├── components/            # 通用组件
│   │   ├── contexts/              # React Context
│   │   ├── hooks/                 # 自定义 Hooks
│   │   ├── utils/                 # 工具函数
│   │   ├── types/                 # TypeScript 类型
│   │   └── api/                   # API 接口
│   ├── dist/                      # 构建产物
│   └── package.json               # NPM 配置
│
└── nginx/                         # Nginx 配置
    ├── nginx.conf                 # 主配置
    └── health.html                # 健康检查页面
```

### 后端核心目录说明

| 目录 | 说明 |
|------|------|
| `annotation/` | 自定义注解：`@RateLimit`、`@DistributedLock`、`@GlobalRateLimit` |
| `aspect/` | AOP切面：限流、分布式锁、审计日志 |
| `config/` | 配置类：Security、Redis、JWT、Kafka、WebSocket |
| `controller/` | REST API控制器层 |
| `service/` | 业务逻辑层接口和实现 |
| `mapper/` | MyBatis Mapper（数据访问层）|
| `model/entity/` | 实体类（对应数据库表）|
| `model/dto/` | 数据传输对象（请求参数）|
| `model/vo/` | 视图对象（响应数据）|

### 前端核心目录说明

| 目录 | 说明 |
|------|------|
| `pages/` | 页面级组件：Home、BlogDetail、Profile 等 |
| `components/` | 可复用组件：Header、BlogCard、CommentList 等 |
| `contexts/` | React Context：AuthContext、ThemeContext |
| `hooks/` | 自定义 Hooks：useAuth、useBlog |
| `api/` | API 接口封装：auth.ts、blog.ts |
| `types/` | TypeScript 类型定义 |

## ❓ 常见问题

### 1. 如何修改管理员密码？
登录后访问个人中心，在"账户安全"中修改密码。

### 2. 如何上传图片？
在Markdown编辑器中点击"上传图片"按钮，或使用拖拽上传。

### 3. 如何备份数据？
```bash
cd /app/myblog/deploy
./backup.sh
```
备份文件位于 `/app/myblog/backups/`

### 4. 忘记密码怎么办？
目前需要直接修改数据库。后续版本会增加邮箱找回功能。

### 5. 如何自定义配置？
- 本地开发：修改 `application-local.yml`
- 生产环境：修改 `.env.prod` 环境变量

## 🔄 更新应用

```bash
# 拉取最新代码
cd /app/myblog
git pull

# 重新部署
cd deploy
./deploy.sh
```

## 📝 开发计划

### 即将到来
- [ ] 邮箱通知功能
- [ ] 文章协作编辑
- [ ] 移动端PWA支持
- [ ] 社交媒体分享
- [ ] 多语言支持

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 项目
2. 创建分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 💬 联系方式

- 问题反馈：[GitHub Issues](https://github.com/yourname/myblog/issues)
- 邮箱：your.email@example.com

## 📂 项目结构

```
myblog/
├── README.md                      # 项目介绍和快速开始
├── docker-compose.prod.yml        # 生产环境Docker配置
│
├── myblog-backend/                # 后端Spring Boot应用
│   ├── src/main/java/            # Java源代码
│   │   ├── controller/           # REST API控制器
│   │   ├── service/              # 业务逻辑层
│   │   ├── mapper/               # 数据访问层
│   │   ├── model/                # 数据模型（entity, dto, vo）
│   │   ├── config/               # 配置类（Security, JWT, Redis等）
│   │   ├── utils/                # 工具类
│   │   ├── exception/            # 异常处理
│   │   ├── aspect/               # AOP切面（限流、审计日志）
│   │   └── annotation/           # 自定义注解
│   ├── src/main/resources/       # 资源文件
│   ├── database/                 # 数据库脚本
│   ├── target/                   # 构建产物（JAR包）
│   └── Dockerfile.prod           # 生产环境Dockerfile
│
├── myblog-frontend/               # 前端React应用
│   ├── src/                      # 源代码
│   │   ├── components/           # React组件
│   │   ├── pages/                # 页面组件
│   │   ├── contexts/             # React Context（状态管理）
│   │   ├── utils/                # 工具函数
│   │   ├── types/                # TypeScript类型定义
│   │   └── hooks/                # 自定义React Hooks
│   ├── dist/                     # 构建产物（静态文件）
│   └── Dockerfile.prod           # 生产环境Dockerfile
│
├── nginx/                         # Nginx配置
│   ├── nginx.conf                # Nginx主配置
│   └── health.html               # 健康检查页面
│
├── deploy/                        # 🚀 部署脚本
│   ├── README.md                 # 脚本使用说明
│   ├── build-local.sh            # 本地构建
│   ├── deploy-update.sh          # 一键部署
│   ├── quick-deploy.sh           # 服务器部署
│   ├── init-database.sh          # 数据库初始化
│   ├── backup.sh                 # 数据备份
│   ├── logs.sh                   # 日志查看
│   └── stop.sh                   # 服务停止
│
└── docs/                          # 📚 文档中心
    ├── README.md                  # 文档索引
    ├── releases/                  # 版本发布文档
    ├── security/                  # 安全文档
    └── deployment/                # 部署文档
```

### 核心技术栈

**后端**：Spring Boot 3.5.5 + MyBatis Plus + Spring Security + Redis + Kafka  
**前端**：React 19 + TypeScript + Vite + Tailwind CSS  
**数据库**：MySQL 8.0 + Redis 7.x + Elasticsearch 8.x  
**部署**：Docker + Docker Compose + Nginx

### 快速导航

- 📖 **项目文档**：[doc/README.md](doc/README.md)
- 🚀 **部署指南**：[doc/deploy/DEPLOYMENT.md](doc/deploy/DEPLOYMENT.md)
- 💼 **面试准备**：[doc/interview/INTERVIEW-GUIDE.md](doc/interview/INTERVIEW-GUIDE.md) ⭐

---

## 💼 面试准备

如果你想用这个项目准备面试，我们提供了完整的面试材料：

| 文档 | 说明 |
|------|------|
| [🎯 综合面试指南](doc/interview/INTERVIEW-GUIDE.md) | 1分钟演讲 + 技术栈解析 + 17个常见问题 |
| [🏛️ 设计模式应用](doc/interview/DESIGN-PATTERNS.md) | 8种设计模式实战案例 + 面试话术 |
| [⚡ 性能优化实践](doc/interview/PERFORMANCE-GUIDE.md) | 缓存 + 并发 + 数据库优化证明 |
| [📊 项目完成总结](doc/interview/PROJECT-SUMMARY.md) | 完成度 + 技术深度 + 踩坑经验 |

**面试亮点**：
- ✅ 分布式锁（Redis + Lua脚本）
- ✅ 滑动窗口限流（防恶意攻击）
- ✅ 雪花算法ID（分库分表准备）
- ✅ Kafka消息队列（事件驱动）
- ✅ WebSocket实时通知
- ✅ 读写分离架构（Redis + MySQL）

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️**

Made with ❤️ by Ryan Xu

</div>
