# MyBlog - 现代化全栈博客系统

<div align="center">

![MyBlog](https://img.shields.io/badge/MyBlog-v2.0-blue?style=for-the-badge)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-green?style=for-the-badge&logo=spring-boot)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

**功能完整、开箱即用的现代化博客系统**

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [服务器部署](#-服务器部署) • [技术栈](#-技术栈)

</div>

---

## 📖 项目简介

MyBlog 是一个基于 Spring Boot + React 构建的现代化博客系统，采用前后端分离架构。提供完整的博客管理、用户系统、评论互动、全文搜索等功能，支持 Docker 一键部署。

### ✨ 核心亮点

- 🎨 **现代化设计** - 响应式布局，支持暗黑模式
- 🚀 **高性能** - Redis缓存 + Elasticsearch全文搜索
- 🔐 **安全可靠** - JWT认证 + Spring Security
- 🐳 **易于部署** - Docker容器化，一键部署
- 📱 **移动友好** - 完美适配各种设备

## 🎯 功能特性

### 用户功能
- ✅ 用户注册、登录、个人资料管理
- ✅ Markdown编辑器，支持实时预览
- ✅ 文章发布、草稿保存、分类标签
- ✅ 评论互动、点赞功能
- ✅ 全文搜索、高级筛选
- ✅ 个人文章管理面板

### 管理功能
- ✅ 用户管理（查看、编辑、禁用）
- ✅ 文章管理（审核、编辑、删除）
- ✅ 评论管理（审核、删除）
- ✅ 分类标签管理
- ✅ 数据统计分析

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

| 文档 | 说明 | 适用场景 |
|------|------|---------|
| 📖 [doc/DEPLOYMENT.md](doc/DEPLOYMENT.md) | **完整部署手册** | 首次部署必读 ⭐ |
| 🚀 [doc/QUICK-ITERATION.md](doc/QUICK-ITERATION.md) | **快速迭代部署** | 日常开发最常用 ⭐⭐⭐ |
| 🔐 [doc/SSH-SETUP.md](doc/SSH-SETUP.md) | **SSH密钥配置** | 实现一键部署 |
| 🏗️ [doc/PROJECT-STRUCTURE.md](doc/PROJECT-STRUCTURE.md) | **项目结构说明** | 了解项目架构 |

**快速开始：**
- 🆕 首次部署 → [DEPLOYMENT.md](doc/DEPLOYMENT.md)
- 🔄 日常更新 → [QUICK-ITERATION.md](doc/QUICK-ITERATION.md)
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

### 后端
- **Spring Boot 3.5** - Java应用框架
- **Spring Security** - 安全认证
- **MyBatis Plus** - 数据库ORM
- **MySQL** - 关系型数据库
- **Redis** - 缓存系统
- **Elasticsearch** - 全文搜索引擎

### 前端
- **React 19** - UI框架
- **TypeScript** - 类型系统
- **Vite** - 构建工具
- **Tailwind CSS** - CSS框架
- **Radix UI** - 组件库

### 部署
- **Docker** - 容器化
- **Docker Compose** - 服务编排
- **Nginx** - 反向代理

## 📸 界面预览

### 首页
现代化的博客首页，响应式设计，支持暗黑模式。

### 文章详情
Markdown渲染，代码高亮，目录导航，评论互动。

### 管理后台
数据统计、用户管理、内容管理一应俱全。

## 🗂️ 项目结构

```
myblog/
├── myblog-backend/          # Spring Boot 后端
│   ├── src/main/java/       # Java源代码
│   ├── src/main/resources/  # 配置文件
│   └── database/            # 数据库脚本
│
├── myblog-frontend/         # React 前端
│   ├── src/                 # 源代码
│   ├── public/              # 静态资源
│   └── Dockerfile           # 容器配置
│
├── deploy/                  # 部署脚本
│   ├── quick-deploy.sh      # 一键部署
│   ├── init-database.sh     # 数据库初始化
│   └── *.md                 # 部署文档
│
├── nginx/                   # Nginx配置
├── docker-compose.yml       # Docker编排（本地）
└── docker-compose.prod.yml  # Docker编排（生产）
```

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

**后端**：Spring Boot 3.5.5 + MyBatis Plus + Spring Security  
**前端**：React 18 + TypeScript + Vite + TailwindCSS  
**数据库**：MySQL 8.0 + Redis 7.x + Elasticsearch 8.x  
**部署**：Docker + Docker Compose + Nginx

### 快速导航

- 📖 **项目文档**：[docs/README.md](docs/README.md)
- 🚀 **部署脚本**：[deploy/README.md](deploy/README.md)
- 🔒 **安全特性**：[docs/security/SECURITY.md](docs/security/SECURITY.md)
- 📦 **最新版本**：[docs/releases/VERSION-SUMMARY-v1.1.0.md](docs/releases/VERSION-SUMMARY-v1.1.0.md)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️**

Made with ❤️ by Ryan Xu

</div>
