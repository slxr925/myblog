# MyBlog 博客系统

基于 Spring Boot 3、React 19 和现代技术栈构建的全功能博客管理平台，支持用户管理、内容发布、评论互动、数据分析等完整功能。

## ✨ 核心功能

### 🎨 用户系统
- **用户注册登录**：邮箱验证注册，JWT 安全认证
- **个人资料管理**：头像上传、昵称、个人简介等完整资料
- **角色权限控制**：普通用户与管理员权限分离
- **安全密码管理**：密码强度验证、安全修改密码

### 📝 博客内容管理
- **完整的 CRUD 操作**：创建、编辑、发布、删除文章
- **富文本支持**：Markdown 编辑器，语法高亮
- **文章状态管理**：草稿、已发布、下线状态
- **内容分类**：多级分类体系，支持分类管理
- **标签系统**：多标签关联，彩色标签展示
- **文章特色**：置顶文章、精选文章功能
- **浏览统计**：实时浏览量统计与展示

### 💬 评论系统
- **多级评论**：支持嵌套回复结构
- **评论审核**：待审核、已通过、已拒绝状态管理
- **评论互动**：点赞功能，用户互动增强
- **评论管理**：管理员可审核、删除评论

### 📊 数据分析后台
- **综合统计面板**：
  - 总用户数、总文章数、总评论数、总点赞数
  - 今日数据：新增用户、新增文章、新增评论、今日浏览
- **可视化图表**：
  - 近7天、30天活动趋势图
  - 用户增长、文章发布趋势分析
- **访问日志分析**：
  - 页面访问跟踪
  - 用户会话记录
  - IP 地址和用户代理统计
- **管理中心**：
  - 用户管理（查看、编辑、删除）
  - 文章管理（批量操作、状态修改）
  - 评论管理（审核、删除）
  - 分类标签管理

### 🔍 搜索与发现
- **Elasticsearch 全文搜索**：
  - 关键词全文检索
  - 高级搜索过滤（分类、标签）
  - 搜索结果高亮显示
- **内容发现**：
  - 首页精选文章展示
  - 分类浏览导航
  - 标签云展示

### 🖼️ 文件上传
- **头像上传**：用户自定义头像功能
- **图片上传**：文章配图上传
- **安全处理**：
  - 文件类型验证
  - 路径安全检查
  - 安全存储与URL生成

### 🎯 界面特性
- **响应式设计**：移动端友好界面
- **现代化UI**：Tailwind CSS + Radix UI 组件
- **动画效果**：Framer Motion 流畅动画
- **玻璃拟态效果**：现代化视觉效果
- **主题支持**：准备支持明暗主题切换

## 🚀 技术栈

### 后端技术
- **核心框架**：Java 21 + Spring Boot 3.5.5
- **数据持久化**：MyBatis Plus 3.5.9 + MySQL 8.4+
- **缓存系统**：Redis 7.0+ （会话管理、热点数据缓存）
- **搜索引擎**：Elasticsearch 8.x （全文搜索）
- **安全框架**：Spring Security + JWT 认证
- **API文档**：SpringDoc OpenAPI / Knife4j
- **日志管理**：Logback 日志框架

### 前端技术
- **核心框架**：React 19.1.1 + TypeScript
- **构建工具**：Vite 7.1.7
- **UI组件库**：Tailwind CSS 4.1.13 + Radix UI
- **动画库**：Framer Motion
- **图表库**：Recharts 数据可视化
- **Markdown**：React Markdown 语法高亮
- **状态管理**：React Context API

## 📋 环境要求

### 系统要求
- **操作系统**：Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **内存**：推荐 8GB+ RAM
- **存储空间**：至少 5GB 可用空间

### 必需软件
1. **JDK 21+** - Java 开发环境
2. **Maven 3.8+** - 项目构建工具
3. **MySQL 8.4+** - 主数据库
4. **Redis 7.0+** - 缓存和会话存储
5. **Elasticsearch 8.x** - 全文搜索引擎
6. **Node.js 18+** - 前端开发环境

## 🛠️ 环境配置

### 数据库初始化

#### 1. MySQL 配置
```sql
-- 创建数据库
CREATE DATABASE myblog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（推荐）
CREATE USER 'myblog'@'localhost' IDENTIFIED BY 'myblog123';
GRANT ALL PRIVILEGES ON myblog.* TO 'myblog'@'localhost';
FLUSH PRIVILEGES;

-- 测试连接
mysql -u myblog -p myblog
```

#### 2. Redis 配置
确保 Redis 服务在默认端口 6379 运行：

**macOS (使用 Homebrew):**
```bash
brew install redis
brew services start redis
redis-cli ping  # 应该返回 PONG
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
redis-cli ping
```

**Windows:**
```bash
# 下载 Redis for Windows 或使用 WSL
# 启动 Redis 服务
redis-server
```

#### 3. Elasticsearch 配置
确保 Elasticsearch 服务在端口 9200 运行：

**macOS (使用 Homebrew):**
```bash
brew install elasticsearch
brew services start elasticsearch
curl http://localhost:9200  # 验证服务状态
```

**Ubuntu/Debian:**
```bash
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list
sudo apt-get update && sudo apt-get install elasticsearch
sudo systemctl start elasticsearch
sudo systemctl enable elasticsearch
```

### 应用配置

修改 `src/main/resources/application.yml` 中的数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myblog?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username:        # 您的MySQL用户名
    password:      # 您的MySQL密码

  redis:
    host: localhost
    port: 6379
    password:               # 如果有密码则填写

  elasticsearch:
    uris: http://localhost:9200
```

## 🚀 快速启动

### 1. 获取项目代码
```bash
git clone <repository-url>
cd myblog
```

### 2. 验证环境
确保所有必需服务已启动：
```bash
# 检查 MySQL
mysql -u myblog -p -e "SELECT 1"

# 检查 Redis
redis-cli ping

# 检查 Elasticsearch
curl http://localhost:9200
```

### 3. 启动后端服务
```bash
# 方式一：使用 Maven 直接启动
./mvnw spring-boot:run

# 方式二：编译后运行 JAR
./mvnw clean package -DskipTests
java -jar target/myblog-0.0.1-SNAPSHOT.jar

# 方式三：使用 IDE 运行 MyBlogApplication.java
```

**首次启动验证：**
- 检查控制台输出确认无错误
- 访问 http://localhost:9999/actuator/health 确认服务健康
- 查看数据库确认表结构已自动创建

### 4. 启动前端服务
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或使用生产构建
npm run build
npm run preview
```

### 5. 访问应用
- **前端用户界面**: http://localhost:5173
- **后端 API**: http://localhost:9999
- **API 文档**: http://localhost:9999/doc.html
- **健康检查**: http://localhost:9999/actuator/health

## 📱 应用访问

### 主要入口
- **博客前台**: http://localhost:5173 （用户访问界面）
- **管理后台**: http://localhost:5173/admin （管理员控制台）
- **API 基础路径**: http://localhost:9999/api

### 开发工具
- **API 文档**: http://localhost:9999/doc.html (Knife4j 界面)
- **健康检查**: http://localhost:9999/actuator/health
- **应用信息**: http://localhost:9999/actuator/info

### 默认账户
系统启动后可创建第一个管理员账户：
- **邮箱**: admin@example.com
- **密码**: admin123
（首次使用请立即修改默认密码）

## 📁 项目结构

```
myblog/
├── 📂 后端项目 (Spring Boot)
│   ├── src/main/java/com/ryan/myblog/
│   │   ├── controller/          # REST API 控制器
│   │   │   ├── admin/          # 管理员相关接口
│   │   │   ├── user/           # 用户相关接口
│   │   │   ├── blog/           # 博客文章接口
│   │   │   ├── comment/        # 评论相关接口
│   │   │   └── upload/         # 文件上传接口
│   │   ├── service/            # 业务逻辑层
│   │   │   ├── impl/           # 业务实现类
│   │   │   └── *Service.java   # 业务接口
│   │   ├── mapper/             # MyBatis 数据访问层
│   │   ├── entity/             # JPA 实体类
│   │   ├── dto/                # 数据传输对象
│   │   ├── vo/                 # 视图对象
│   │   ├── config/             # 配置类
│   │   │   ├── SecurityConfig.java
│   │   │   ├── RedisConfig.java
│   │   │   └── ElasticsearchConfig.java
│   │   ├── utils/              # 工具类
│   │   ├── exception/          # 异常处理
│   │   └── MyBlogApplication.java  # 启动类
│   ├── src/main/resources/
│   │   ├── mapper/             # MyBatis XML 映射文件
│   │   ├── static/             # 静态资源
│   │   ├── templates/          # 模板文件
│   │   ├── sql/                # 数据库初始化脚本
│   │   └── application.yml     # 应用配置文件
│   └── pom.xml                 # Maven 依赖配置
│
├── 📂 前端项目 (React + Vite)
│   ├── src/
│   │   ├── components/         # 可复用组件
│   │   │   ├── common/         # 通用组件
│   │   │   ├── blog/           # 博客相关组件
│   │   │   └── admin/          # 管理后台组件
│   │   ├── pages/              # 页面组件
│   │   │   ├── Home/           # 首页
│   │   │   ├── Blog/           # 博客详情页
│   │   │   ├── Admin/          # 管理后台
│   │   │   └── User/           # 用户相关页面
│   │   ├── hooks/              # 自定义 React Hooks
│   │   ├── services/           # API 服务层
│   │   ├── utils/              # 工具函数
│   │   ├── styles/             # 样式文件
│   │   ├── types/              # TypeScript 类型定义
│   │   └── main.tsx            # 应用入口
│   ├── public/                 # 公共静态资源
│   ├── package.json            # 依赖配置
│   ├── vite.config.ts          # Vite 配置
│   └── tailwind.config.js      # Tailwind CSS 配置
│
├── 📂 其他文件
│   ├── README.md               # 项目说明文档
│   ├── .gitignore              # Git 忽略文件
│   └── docs/                   # 项目文档
│
└── 📂 上传目录
    └── uploads/                # 用户上传的文件存储
        ├── avatars/            # 用户头像
        └── images/             # 博客图片
```

## 🔧 开发指南

### 数据库管理
- **自动建表**: 首次启动时，应用会根据实体类自动创建数据表结构
- **数据初始化**: 可执行 `src/main/resources/sql/` 目录下的 SQL 脚本初始化测试数据
- **数据迁移**: 使用 Flyway 进行数据库版本管理（如需要）

### API 开发与测试
- **API 文档**: 启动后访问 http://localhost:9999/doc.html 查看完整的 API 文档
- **在线测试**: Knife4j 提供的界面可直接测试所有 API 接口
- **Postman 集合**: 可导出 Postman 集合文件用于团队协作

### 缓存策略
- **会话存储**: 用户登录状态存储在 Redis 中
- **热点数据**: 频繁访问的文章、用户信息缓存
- **查询缓存**: 复杂查询结果缓存，提升响应速度

### 搜索功能
- **索引同步**: 文章发布/更新时自动同步到 Elasticsearch
- **中文分词**: 支持中文全文搜索和分词
- **搜索建议**: 提供搜索关键词自动补全功能

### 开发最佳实践
```bash
# 后端开发
./mvnw clean compile    # 编译项目
./mvnw test            # 运行测试
./mvnw spring-boot:run -Dspring.profiles.active=dev  # 开发环境启动

# 前端开发
npm run dev            # 开发服务器
npm run build          # 生产构建
npm run preview        # 预览生产构建
npm run lint           # 代码检查
```

### 日志管理
- **日志级别**: 可通过 `application.yml` 调整日志输出级别
- **日志文件**: 日志文件存储在 `logs/` 目录下
- **监控集成**: 支持 Micrometer + Prometheus 监控集成

## 🚨 故障排除

### 常见问题及解决方案

#### 1. 数据库连接问题
**症状**: 启动时报数据库连接错误
```bash
# 解决步骤
# 1. 检查 MySQL 服务状态
brew services list | grep mysql  # macOS
sudo systemctl status mysql      # Linux

# 2. 验证数据库存在
mysql -u root -p -e "SHOW DATABASES;"

# 3. 测试用户连接
mysql -u myblog -p -e "SELECT 1;"

# 4. 检查配置文件
cat src/main/resources/application.yml
```

#### 2. Redis 连接问题
**症状**: 缓存相关功能异常，登录失败
```bash
# 解决步骤
# 1. 检查 Redis 服务
redis-cli ping  # 应返回 PONG

# 2. 检查端口占用
lsof -i :6379

# 3. 重启 Redis 服务
brew services restart redis     # macOS
sudo systemctl restart redis    # Linux
```

#### 3. Elasticsearch 问题
**症状**: 搜索功能不可用
```bash
# 解决步骤
# 1. 检查 ES 服务状态
curl http://localhost:9200/_cluster/health

# 2. 检查索引状态
curl http://localhost:9200/_cat/indices

# 3. 重启 ES 服务
brew services restart elasticsearch     # macOS
sudo systemctl restart elasticsearch    # Linux
```

#### 4. 前端启动问题
**症状**: npm install 失败或 dev 服务器无法启动
```bash
# 解决步骤
# 1. 清理缓存和依赖
rm -rf node_modules package-lock.json
npm cache clean --force

# 2. 重新安装依赖
npm install

# 3. 检查 Node.js 版本
node --version  # 应该 >= 18.x

# 4. 检查端口占用
lsof -i :5173
```

#### 5. 端口冲突问题
**症状**: 端口已被占用错误
```bash
# 查找占用端口的进程
lsof -i :9999  # 后端端口
lsof -i :5173  # 前端端口

# 终止进程
kill -9 <PID>

# 或修改配置文件中的端口
```

#### 6. 权限问题
**症状**: 文件上传失败，日志写入错误
```bash
# 解决步骤
# 1. 检查上传目录权限
ls -la uploads/

# 2. 修改目录权限
chmod 755 uploads/
chmod 644 uploads/*

# 3. 检查应用运行用户
ps aux | grep java
```

### 性能优化建议

#### 后端优化
- **JVM 参数调整**: `-Xms2g -Xmx4g` 根据服务器配置调整
- **数据库连接池**: 优化 HikariCP 配置
- **Redis 缓存**: 合理设置缓存过期时间

#### 前端优化
- **构建优化**: 启用代码分割和压缩
- **资源优化**: 图片懒加载，CDN 加速
- **缓存策略**: 合理设置浏览器缓存

### 监控和维护
```bash
# 查看应用日志
tail -f logs/myblog.log

# 监控系统资源
top -p $(pgrep java)

# 数据库性能监控
mysql -u root -p -e "SHOW PROCESSLIST;"
```

### 获取帮助
- **项目 Issues**: 在 GitHub 仓库提交问题
- **日志分析**: 提供详细的错误日志
- **环境信息**: 包含操作系统、Java 版本等环境信息

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献指南

欢迎为项目做出贡献！请遵循以下步骤：

### 贡献流程
1. **Fork** 项目到您的 GitHub 账户
2. **创建** 功能分支 (`git checkout -b feature/AmazingFeature`)
3. **提交** 您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. **推送** 到分支 (`git push origin feature/AmazingFeature`)
5. **创建** Pull Request

### 开发规范
- **代码风格**: 遵循项目现有的代码风格
- **提交信息**: 使用清晰的提交信息描述更改
- **测试**: 确保新功能有相应的测试
- **文档**: 更新相关文档和注释

### 问题反馈
- **Bug 报告**: 提供详细的复现步骤和环境信息
- **功能建议**: 描述期望的功能和使用场景
- **安全问题**: 请私下联系维护者

## 🌟 致谢

感谢所有为这个项目做出贡献的开发者和用户！

### 技术栈鸣谢
- [Spring Boot](https://spring.io/projects/spring-boot) - 强大的 Java 后端框架
- [React](https://reactjs.org/) - 现代化的前端库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [MyBatis Plus](https://baomidou.com/) - 强大的 MyBatis 增强工具
- [Redis](https://redis.io/) - 高性能内存数据库
- [Elasticsearch](https://www.elastic.co/) - 分布式搜索引擎

---

**如果这个项目对您有帮助，请给我们一个 ⭐️！**