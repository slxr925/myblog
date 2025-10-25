# MyBlog - 现代化全栈博客系统

<div align="center">

![MyBlog Logo](https://img.shields.io/badge/MyBlog-2.0-blue?style=for-the-badge)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-green?style=for-the-badge&logo=spring-boot)
![React](https://img.shields.io/badge/React-19.1.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue?style=for-the-badge&logo=typescript)

[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Java Version](https://img.shields.io/badge/Java-21+-orange?style=for-the-badge&logo=java)](https://openjdk.java.net/)
[![Node Version](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)

**一个功能完整、技术先进的现代化全栈博客系统**

[功能特性](#-功能特性) • [技术栈](#-技术栈) • [快速开始](#-快速开始) • [项目结构](#-项目结构) • [贡献指南](#-贡献指南)

</div>

## 📖 项目简介

MyBlog 是一个采用前后端分离架构的现代化博客系统，集成了用户管理、内容发布、评论互动、数据分析、全文搜索等完整功能。项目使用最新的技术栈，提供优秀的用户体验和开发者体验。

### 🎯 设计理念

- **现代化架构**: 前后端分离，微服务设计思想
- **用户体验优先**: 响应式设计，流畅的交互体验
- **开发者友好**: 完整的API文档，清晰的代码结构
- **性能优化**: 多层缓存，数据库优化，搜索引擎集成
- **安全可靠**: JWT认证，权限控制，安全防护机制

## ✨ 功能特性

### 👤 用户系统
- ✅ **注册登录**: 邮箱验证注册，JWT安全认证
- ✅ **个人资料**: 头像上传，个人信息管理
- ✅ **权限控制**: 普通用户与管理员权限分离
- ✅ **密码安全**: 强度验证，安全修改流程

### 📝 内容管理
- ✅ **文章编辑**: Markdown编辑器，实时预览
- ✅ **富文本支持**: 代码高亮，图片上传
- ✅ **分类标签**: 多级分类，彩色标签系统
- ✅ **文章特色**: 置顶，精选，草稿功能
- ✅ **浏览统计**: 实时浏览量，用户行为跟踪

### 💬 互动功能
- ✅ **评论系统**: 多级嵌套评论，富文本支持
- ✅ **点赞互动**: 文章点赞，评论点赞
- ✅ **评论审核**: 管理员审核，垃圾评论过滤
- ✅ **通知系统**: 评论回复通知

### 🔍 搜索功能
- ✅ **全文搜索**: Elasticsearch全文检索
- ✅ **搜索高亮**: 关键词高亮显示
- ✅ **智能建议**: 搜索关键词自动补全
- ✅ **高级搜索**: 分类、标签、时间范围过滤
- ✅ **排序算法**: BM25算法，多因子综合排序

### 📊 数据分析
- ✅ **统计面板**: 用户数，文章数，评论数，点赞数
- ✅ **趋势图表**: 访问趋势，用户活跃度分析
- ✅ **管理中心**: 用户管理，内容审核，系统设置

### 🎨 界面特性
- ✅ **响应式设计**: 移动端友好界面
- ✅ **现代化UI**: Tailwind CSS + Radix UI组件
- ✅ **动画效果**: Framer Motion流畅动画
- ✅ **主题支持**: 准备支持明暗主题切换

## 🛠️ 技术栈

### 后端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **Java** | 21 | 核心编程语言 |
| **Spring Boot** | 3.5.5 | 应用框架 |
| **Spring Security** | 6.x | 安全框架 |
| **MyBatis Plus** | 3.5.9 | ORM框架 |
| **MySQL** | 8.4+ | 主数据库 |
| **Redis** | 7.0+ | 缓存数据库 |
| **Elasticsearch** | 8.x | 搜索引擎 |
| **JWT** | 0.12+ | 认证机制 |
| **Knife4j** | 4.x | API文档 |

### 前端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | 19.1.1 | 前端框架 |
| **TypeScript** | 5.5.3 | 类型系统 |
| **Vite** | 7.1.7 | 构建工具 |
| **Tailwind CSS** | 4.1.13 | CSS框架 |
| **Radix UI** | Latest | 组件库 |
| **Framer Motion** | Latest | 动画库 |
| **React Router** | 7.9.3 | 路由管理 |
| **Axios** | 1.12.2 | HTTP客户端 |

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.0+
- **Java**: 21+
- **Maven**: 3.6+
- **MySQL**: 8.0+
- **Redis**: 7.0+

### 本地开发

#### 1. 克隆项目
```bash
git clone https://github.com/yourname/myblog.git
cd myblog
```

#### 2. 数据库配置
```sql
-- 创建数据库
CREATE DATABASE myblog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'myblog'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON myblog.* TO 'myblog'@'localhost';
FLUSH PRIVILEGES;
```

#### 3. 后端启动
```bash
cd myblog-backend

# 配置数据库连接（编辑 application-local.yml）
vim src/main/resources/application-local.yml

# 启动后端服务
./mvnw spring-boot:run
```

#### 4. 前端启动
```bash
cd myblog-frontend

# 安装依赖
npm install

# 启动前端服务
npm run dev
```

#### 5. 访问应用

- **前端地址**: http://localhost:5173
- **后端API**: http://localhost:8081/api
- **API文档**: http://localhost:8081/doc.html
- **健康检查**: http://localhost:8081/actuator/health

## 📁 项目结构

```
myblog/
├── myblog-backend/                 # 🎯 Spring Boot后端
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/ryan/myblog/
│   │   │   │   ├── controller/     # REST API控制器
│   │   │   │   ├── service/        # 业务逻辑层
│   │   │   │   ├── model/          # 数据模型（entity/dto/vo）
│   │   │   │   ├── config/         # 配置类
│   │   │   │   ├── utils/          # 工具类
│   │   │   │   └── MyBlogApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml           # 主配置文件
│   │   │       ├── application-local.yml    # 本地开发配置
│   │   │       └── mapper/                # MyBatis映射文件
│   ├── pom.xml                          # Maven依赖配置
│   └── mvnw                             # Maven Wrapper
├── myblog-frontend/                # ⚛️ React前端
│   ├── src/
│   │   ├── components/              # 可复用组件
│   │   │   ├── common/          # 通用组件
│   │   │   ├── blog/            # 博客相关组件
│   │   │   ├── admin/           # 管理后台组件
│   │   │   ├── auth/            # 认证组件
│   │   │   └── ui/              # UI基础组件
│   │   ├── pages/               # 页面组件
│   │   │   ├── Dashboard.tsx    # 仪表板
│   │   │   ├── BlogDetail.tsx   # 博客详情
│   │   │   ├── Search.tsx        # 搜索页面
│   │   │   └── Admin.tsx        # 管理后台
│   │   ├── contexts/           # React Context
│   │   ├── utils/              # 工具函数
│   │   ├── types/              # TypeScript类型
│   │   ├── styles/             # 样式文件
│   │   ├── App.tsx             # 应用根组件
│   │   └── main.tsx            # 应用入口
│   ├── public/                 # 静态资源
│   ├── package.json            # 依赖配置
│   ├── vite.config.ts          # Vite配置
│   └── tailwind.config.js     # Tailwind配置
└── README.md                  # 项目说明文档
```

## 🔧 配置说明

### 后端配置示例

```yaml
# application-local.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myblog?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: myblog
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver

  data:
    redis:
      host: localhost
      port: 6379
      timeout: 3000ms

elasticsearch:
  enabled: true
  uris: http://localhost:9200
```

### 前端配置示例

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

## 🔧 开发指南

### 数据库管理
- **自动建表**: 首次启动时根据实体类自动创建表结构
- **数据迁移**: 支持数据库版本管理和升级脚本

### API开发
- **文档生成**: 启动后访问 `/doc.html` 查看API文档
- **在线测试**: Knife4j提供界面直接测试API

### 缓存策略
- **会话存储**: 用户登录状态存储在Redis中
- **热点数据**: 频繁访问的文章、用户信息缓存
- **查询缓存**: 复杂查询结果缓存，提升响应速度

## 🚨 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查MySQL服务状态
brew services list | grep mysql  # macOS
sudo systemctl status mysql      # Linux

# 测试连接
mysql -u myblog -p -e "SELECT 1"
```

#### 2. Redis连接问题
```bash
# 检查Redis服务
redis-cli ping  # 应返回PONG

# 检查端口占用
lsof -i :6379
```

#### 3. 前端启动问题
```bash
# 清理缓存和依赖
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 4. 端口冲突
```bash
# 查找占用端口的进程
lsof -i :8081  # 后端端口
lsof -i :5173  # 前端端口

# 终止进程
kill -9 <PID>
```

### 性能优化

- **后端优化**: 调整JVM参数，优化数据库连接池
- **前端优化**: 启用代码分割，图片懒加载
- **缓存优化**: 合理设置缓存过期时间

## 📊 技术亮点

### 🔍 搜索技术
- **BM25算法**: 优化搜索相关性
- **多字段权重**: 标题、内容、摘要权重配置
- **中文支持**: 中文分词和检测
- **重试机制**: Spring Retry确保搜索服务稳定性

### 🚀 性能优化
- **多层缓存**: Redis热点数据缓存
- **数据库优化**: MyBatis Plus查询优化
- **前端优化**: Vite构建优化，组件懒加载

### 🔒 安全机制
- **JWT认证**: 无状态token认证
- **文件安全**: 路径遍历防护
- **SQL注入防护**: MyBatis参数化查询
- **XSS防护**: 前端输入验证和后端过滤

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **报告问题**: 在 [Issues](https://github.com/yourname/myblog/issues) 中报告bug
2. **功能建议**: 提出新功能建议和改进意见
3. **代码贡献**: 提交Pull Request
4. **文档改进**: 完善项目文档和说明

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- **后端**: 遵循阿里巴巴Java开发手册
- **前端**: 使用ESLint和Prettier进行代码格式化
- **提交信息**: 使用 Conventional Commits 规范

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

感谢以下开源项目和贡献者：

- [Spring Boot](https://spring.io/projects/spring-boot) - 后端框架
- [React](https://reactjs.org/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Elasticsearch](https://www.elastic.co/) - 搜索引擎
- [MyBatis Plus](https://baomidou.com/) - 数据库增强工具

## 📞 联系我们

- **项目地址**: https://github.com/yourname/myblog
- **问题反馈**: https://github.com/yourname/myblog/issues
- **邮箱**: your.email@example.com

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐️**

Made with ❤️ by MyBlog Team

</div>