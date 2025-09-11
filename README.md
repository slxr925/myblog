# MyBlog - 个人博客系统

基于 Spring Boot 3、JDK 21 和 MySQL 8.4 构建的现代化个人博客系统。

## 技术栈

### 后端
- **Java 21** - 最新的 LTS 版本
- **Spring Boot 3.5.5** - 主框架
- **Spring Security** - 安全认证
- **MyBatis Plus** - 数据访问层
- **MySQL 8.4** - 数据库
- **Redis** - 缓存和会话存储
- **JWT** - 身份认证
- **Maven** - 项目管理

### 数据库
- **MySQL 8.4** - 主数据库
- **Redis 7** - 缓存数据库

## 功能特性

- ✅ 用户注册、登录、权限管理
- ✅ 博客文章的增删改查
- ✅ 文章分类管理
- ✅ 标签系统
- ✅ 评论系统
- ✅ 文章点赞功能
- ✅ 文章阅读量统计
- ✅ JWT 身份认证
- ✅ Redis 缓存优化
- ✅ 分页查询支持
- ✅ 软删除机制

## 项目结构

```
src/main/java/com/ryan/myblog/
├── common/           # 通用类
├── config/           # 配置类
├── controller/       # 控制器层
├── dto/             # 数据传输对象
├── entity/          # 实体类
├── mapper/          # 数据访问层
├── service/         # 业务逻辑层
├── utils/           # 工具类
└── vo/              # 视图对象

src/main/resources/
├── mapper/          # MyBatis XML映射文件
├── sql/             # 数据库初始化脚本
└── application.yml  # 应用配置
```

## 快速开始

### 环境要求

- JDK 21+
- Maven 3.8+
- Docker & Docker Compose

### 1. 克隆项目

```bash
git clone <repository-url>
cd myblog
```

### 2. 启动数据库服务

使用 Docker Compose 启动 MySQL 和 Redis：

```bash
docker-compose up -d
```

这将启动以下服务：
- MySQL 8.4 (端口: 3306)
- Redis 7 (端口: 6379)
- phpMyAdmin (端口: 8081) - MySQL 管理界面
- Redis Commander (端口: 8082) - Redis 管理界面

### 3. 数据库初始化

数据库和表结构会在 MySQL 容器启动时自动创建和初始化。

初始用户：
- 管理员: `admin` / `admin123`
- 普通用户: `testuser` / `user123`

### 4. 启动应用

```bash
mvn spring-boot:run
```

应用将在 http://localhost:8080 启动

## API 接口

### 用户相关
- POST `/api/user/register` - 用户注册
- POST `/api/user/login` - 用户登录
- GET `/api/user/info` - 获取用户信息

### 博客相关
- GET `/api/blog/page` - 分页查询博客列表
- GET `/api/blog/{id}` - 查询博客详情
- POST `/api/blog` - 创建博客
- PUT `/api/blog/{id}` - 更新博客
- DELETE `/api/blog/{id}` - 删除博客
- POST `/api/blog/{id}/like` - 点赞/取消点赞
- POST `/api/blog/{id}/publish` - 发布博客
- POST `/api/blog/{id}/unpublish` - 下线博客

### 分类相关
- GET `/api/category/list` - 获取所有分类
- POST `/api/category` - 创建分类
- PUT `/api/category` - 更新分类
- DELETE `/api/category/{id}` - 删除分类

### 标签相关
- GET `/api/tag/list` - 获取所有标签
- POST `/api/tag` - 创建标签
- PUT `/api/tag` - 更新标签
- DELETE `/api/tag/{id}` - 删除标签

## 配置说明

### 数据库配置

修改 `application.yml` 中的数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myblog?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
```

### JWT 配置

```yaml
jwt:
  secret: myBlogSecretKeyForJWTTokenGeneration2024!@#$%
  expiration: 604800 # 7天，单位秒
```

### Redis 配置

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      database: 0
```

## 开发指南

### 添加新功能

1. 在 `entity` 包中创建实体类
2. 在 `mapper` 包中创建 Mapper 接口和 XML 文件
3. 在 `service` 包中创建服务接口和实现类
4. 在 `controller` 包中创建控制器
5. 添加相应的 DTO 和 VO 类

### 数据库迁移

数据库变更脚本放在 `src/main/resources/sql/` 目录下。

## 部署

### 构建镜像

```bash
mvn clean package
```

### 生产环境配置

创建 `application-prod.yml` 文件，配置生产环境的数据库、Redis 等信息。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！