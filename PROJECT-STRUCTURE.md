# MyBlog 项目结构说明

## 📂 目录结构总览

```
myblog/
├── README.md                      # 项目介绍和快速开始
├── PROJECT-STRUCTURE.md           # 本文档：项目结构说明
├── docker-compose.prod.yml        # 生产环境Docker编排配置
├── package.json                   # 根目录npm配置（可选）
│
├── myblog-backend/                # 后端Spring Boot应用
│   ├── src/                       # 源代码
│   ├── target/                    # 构建产物（JAR包）
│   ├── database/                  # 数据库脚本
│   ├── pom.xml                    # Maven配置
│   └── Dockerfile.prod            # 生产环境Dockerfile
│
├── myblog-frontend/               # 前端React应用
│   ├── src/                       # 源代码
│   ├── dist/                      # 构建产物（静态文件）
│   ├── package.json               # npm配置
│   └── Dockerfile.prod            # 生产环境Dockerfile
│
├── nginx/                         # Nginx配置
│   ├── nginx.conf                 # Nginx主配置文件
│   └── health.html                # 健康检查页面
│
├── deploy/                        # 🚀 部署脚本目录
│   ├── README.md                  # 脚本使用说明
│   ├── build-local.sh             # 本地构建脚本
│   ├── deploy-update.sh           # 一键部署脚本
│   ├── quick-deploy.sh            # 服务器端部署脚本
│   ├── init-database.sh           # 数据库初始化
│   ├── backup.sh                  # 数据备份
│   ├── logs.sh                    # 日志查看
│   └── stop.sh                    # 服务停止
│
└── docs/                          # 📚 文档目录
    ├── README.md                  # 文档索引
    ├── releases/                  # 版本发布文档
    │   ├── VERSION-SUMMARY-v1.1.0.md
    │   ├── CHANGELOG-v1.1.0.md
    │   ├── RELEASE-v1.1.0.md
    │   └── VERSION-UPDATE-GUIDE.md
    ├── security/                  # 安全文档
    │   ├── SECURITY.md
    │   └── SECURITY-DEPLOYMENT.md
    └── deployment/                # 部署文档
        ├── DEPLOY-GUIDE.md
        ├── SSH-SETUP.md
        └── DEPLOYMENT-SUCCESS.md
```

## 📁 核心目录说明

### 1. myblog-backend/ - 后端应用
Spring Boot 3.5.5 + MyBatis Plus + Spring Security

**关键目录**：
- `src/main/java/` - Java源代码
  - `controller/` - REST API控制器
  - `service/` - 业务逻辑层
  - `mapper/` - 数据访问层
  - `model/` - 数据模型（entity, dto, vo）
  - `config/` - 配置类（Security, JWT, Redis等）
  - `utils/` - 工具类
  - `exception/` - 异常处理
  - `aspect/` - AOP切面（限流、审计日志）
  - `annotation/` - 自定义注解

- `src/main/resources/` - 资源文件
  - `application.yml` - 主配置文件
  - `application-dev.yml` - 开发环境配置
  - `application-prod.yml` - 生产环境配置

- `database/` - 数据库脚本
  - `schema/` - 表结构SQL
  - `migrations/` - 数据库迁移脚本

- `target/` - Maven构建产物
  - `*.jar` - 可执行JAR包

### 2. myblog-frontend/ - 前端应用
React 18 + TypeScript + Vite + TailwindCSS

**关键目录**：
- `src/` - 源代码
  - `components/` - React组件
  - `pages/` - 页面组件
  - `contexts/` - React Context（状态管理）
  - `utils/` - 工具函数
  - `types/` - TypeScript类型定义
  - `hooks/` - 自定义React Hooks

- `dist/` - Vite构建产物
  - `index.html` - 入口HTML
  - `assets/` - 静态资源（JS, CSS, 图片）

### 3. nginx/ - Nginx配置
反向代理和静态文件服务

- `nginx.conf` - 主配置文件
  - 前端静态文件服务（/）
  - 后端API代理（/api）
  - 文件上传代理（/uploads）
  - 安全响应头配置

### 4. deploy/ - 部署脚本 🚀
所有部署相关的Shell脚本

**核心脚本**：
1. `build-local.sh` - 本地构建前后端应用
2. `deploy-update.sh` - 一键部署到服务器
3. `quick-deploy.sh` - 服务器端快速部署

**辅助脚本**：
4. `init-database.sh` - 初始化数据库
5. `backup.sh` - 备份数据库和文件
6. `logs.sh` - 查看服务日志
7. `stop.sh` - 停止所有服务

详见：[deploy/README.md](deploy/README.md)

### 5. docs/ - 项目文档 📚
所有项目文档的归档目录

**文档分类**：
- `releases/` - 版本发布相关文档
- `security/` - 安全特性和配置文档
- `deployment/` - 部署和运维文档

详见：[docs/README.md](docs/README.md)

## 🔄 工作流程

### 开发流程
```
1. 修改代码
   ├── 后端：myblog-backend/src/
   └── 前端：myblog-frontend/src/

2. 本地测试
   ├── 后端：mvn spring-boot:run
   └── 前端：npm run dev

3. 提交代码
   └── git commit -m "..."
```

### 部署流程
```
1. 本地构建
   └── ./deploy/build-local.sh

2. 一键部署
   └── ./deploy/deploy-update.sh

3. 验证部署
   ├── 访问：http://49.235.139.118
   └── 查看日志：./deploy/logs.sh backend
```

### 版本发布流程
```
1. 更新版本号
   ├── pom.xml (后端)
   └── package.json (前端)

2. 创建版本文档
   ├── docs/releases/CHANGELOG-vX.Y.Z.md
   ├── docs/releases/RELEASE-vX.Y.Z.md
   └── docs/releases/VERSION-SUMMARY-vX.Y.Z.md

3. Git提交和打标签
   ├── git commit -m "Release vX.Y.Z"
   └── git tag -a vX.Y.Z -m "..."

4. 部署到生产
   └── ./deploy/deploy-update.sh
```

## 📦 构建产物

### 后端构建产物
```
myblog-backend/target/
└── myblog-0.0.1-SNAPSHOT.jar    # 可执行JAR包（约96MB）
```

### 前端构建产物
```
myblog-frontend/dist/
├── index.html                    # 入口HTML
└── assets/
    ├── index-*.js                # 打包后的JS（约2MB）
    └── index-*.css               # 打包后的CSS（约100KB）
```

## 🐳 Docker部署

### Docker镜像
```
myblog-backend          # 后端镜像（基于eclipse-temurin:21-jre-alpine）
myblog-frontend         # 前端镜像（基于nginx:1.27-alpine）
nginx:1.27-alpine       # Nginx镜像（官方）
```

### Docker容器
```
myblog-backend          # 后端服务（端口8081，内部）
myblog-frontend         # 前端服务（端口8080，内部）
myblog-nginx            # Nginx代理（端口80，对外）
```

### Docker网络
```
myblog_myblog-network   # 桥接网络，容器间通信
```

## 🗂️ 配置文件

### 环境配置
```
服务器端：
/app/myblog/.env.prod   # 生产环境变量（MySQL, Redis, ES, JWT等）

本地开发：
myblog-backend/src/main/resources/application-dev.yml
myblog-frontend/.env.development
```

### 关键配置项
```
# MySQL
MYSQL_HOST=172.17.0.1
MYSQL_PORT=13306
MYSQL_DATABASE=myblog
MYSQL_USERNAME=root
MYSQL_PASSWORD=***

# Redis
REDIS_HOST=172.17.0.1
REDIS_PORT=26739
REDIS_PASSWORD=***

# Elasticsearch
ELASTICSEARCH_ENABLED=false
ELASTICSEARCH_HOST=172.17.0.1
ELASTICSEARCH_PORT=9200

# JWT
JWT_SECRET=***
```

## 📊 数据存储

### 数据库
```
MySQL 8.0 (端口13306)
├── myblog              # 主数据库
│   ├── tb_user         # 用户表
│   ├── tb_blog         # 博客表
│   ├── tb_comment      # 评论表
│   ├── tb_category     # 分类表
│   ├── tb_tag          # 标签表
│   └── tb_audit_log    # 审计日志表
```

### 缓存
```
Redis 7.x (端口26739)
├── session:*           # 用户会话
├── rate_limit:*        # 限流计数
├── login:*             # 登录锁定
└── cache:*             # 业务缓存
```

### 文件存储
```
服务器端：
/app/myblog/data/
├── uploads/            # 用户上传文件
├── logs/               # 应用日志
└── backups/            # 数据备份
```

## 🔗 端口映射

### 开发环境
```
后端：localhost:8081
前端：localhost:3000
```

### 生产环境
```
对外：
- 80端口 → Nginx（统一入口）

内部：
- 8081端口 → 后端服务
- 8080端口 → 前端服务
- 13306端口 → MySQL
- 26739端口 → Redis
- 9200端口 → Elasticsearch（可选）
```

## 📝 日志位置

### 应用日志
```
容器内：
/app/logs/              # 后端应用日志

服务器端：
/app/myblog/data/logs/  # 持久化日志
```

### Docker日志
```
docker logs myblog-backend
docker logs myblog-frontend
docker logs myblog-nginx
```

## 🔍 快速查找

### 找文档
```
所有文档：docs/README.md
部署文档：docs/deployment/DEPLOY-GUIDE.md
安全文档：docs/security/SECURITY.md
版本文档：docs/releases/
```

### 找脚本
```
所有脚本：deploy/README.md
构建脚本：deploy/build-local.sh
部署脚本：deploy/deploy-update.sh
```

### 找配置
```
后端配置：myblog-backend/src/main/resources/application-*.yml
前端配置：myblog-frontend/src/utils/api.ts
Nginx配置：nginx/nginx.conf
Docker配置：docker-compose.prod.yml
```

### 找代码
```
后端API：myblog-backend/src/main/java/com/ryan/myblog/controller/
前端页面：myblog-frontend/src/pages/
前端组件：myblog-frontend/src/components/
```

---

**维护者**：Ryan Xu  
**最后更新**：2025-12-05  
**当前版本**：v1.1.0

