# MyBlog - 现代化全栈博客系统

<div align="center">

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

### 可部署、可扩展、可维护的内容社区工程模板

[功能概览](#功能概览) • [快速开始](#快速开始) • [部署说明](#部署说明) • [文档导航](#文档导航)

</div>

---

一个基于 **Spring Boot + React + Docker** 的全栈博客系统，支持内容管理、互动、搜索、通知与 AI 辅助能力。

## 发布页亮点

- 🚀 **全栈一体交付**：后端服务、前端应用、搜索与缓存组件开箱即用
- 🧱 **工程化优先**：类型约束、脚本化部署、迁移流程与健康检查完整
- 🔍 **业务链路完整**：内容发布、互动、搜索、通知与 AI 辅助闭环

## 项目目标

- 提供可长期演进的博客业务基座（前后端分离、可观测、可部署）
- 覆盖典型内容社区能力（发布、评论、点赞、收藏、关注、搜索）
- 保持工程可维护性（类型约束、脚本化部署、文档化流程）

## 功能概览

- 用户体系：注册、登录、资料管理、关注关系
- 内容体系：文章发布、编辑、分类标签、草稿
- 互动体系：评论、点赞、收藏、通知
- 搜索体系：关键词检索、实时建议、结果页筛选
- AI 能力：摘要、关键词提取等内容辅助
- 管理后台：文章/评论/用户治理与基础监控

## 技术栈

### 后端

- Java 21
- Spring Boot 3.x
- Spring Security + JWT
- MyBatis / MyBatis Plus
- MySQL 8.x
- Redis 7.x
- Elasticsearch 8.x
- Kafka 3.x

### 前端

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- React Router

### 运维与部署

- Docker / Docker Compose
- 本地与生产分层部署脚本

## 目录结构

```text
myblog/
├── myblog-backend/              # 后端服务
├── myblog-frontend/             # 前端应用
├── deploy/
│   ├── local/                   # 本地 Docker 部署脚本
│   └── prod/                    # 生产部署脚本
├── scripts/                     # 统一入口脚本（本地/生产）
├── doc/                         # 项目文档
├── docker-compose.yml           # 本地环境编排
├── docker-compose.prod.yml      # 生产环境编排
└── README.md
```

## 快速开始

### 方式一：本地 Docker（推荐）

```bash
# 1) 启动本地环境
./deploy/local/quick-deploy.sh

# 2) 访问
# Frontend: http://localhost:3000
# Backend:  http://localhost:8081
```

### 方式二：本地前后端分开运行

```bash
# 后端
cd myblog-backend
./mvnw spring-boot:run

# 前端
cd myblog-frontend
npm install
npm run dev
```

## 部署说明

### 本地增量部署

```bash
./deploy/local/deploy-update.sh
```

### 生产增量部署

```bash
./scripts/deploy-prod.sh deploy
```

> 生产脚本默认执行：本地构建 -> 上传产物 -> 远端部署 -> 健康检查。

## 数据库迁移

- 迁移脚本目录：`myblog-backend/database/migrations/`
- 本地执行：`./deploy/local/apply-migrations.sh`
- 生产执行：`./deploy/prod/apply-migrations.sh .env`

## 文档导航

- 文档入口：`doc/README.md`
- 部署文档：`doc/deploy/`
- 面试与架构说明：`doc/interview/`
- 工程工具与安全：`doc/tools/`

## 安全说明

- 仓库中不应提交任何真实环境凭据（数据库密码、API Key、Token、私钥等）
- 环境变量请通过本地/服务器安全文件注入（例如 `.env.local`、`.env`）
- 示例配置仅展示字段名，不展示真实值

## 常用命令

```bash
# 查看本地容器状态
docker compose ps

# 查看本地后端日志
docker logs -f myblog-backend

# 前端构建校验
cd myblog-frontend && npm run build

# 后端构建校验
cd myblog-backend && ./mvnw clean package -DskipTests
```

## License

仅用于学习与工程实践参考。
