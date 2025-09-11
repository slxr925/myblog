# MyBlog 博客系统

基于 Spring Boot 3、React 18 和本地数据库构建的现代化博客管理系统。

## 🚀 技术栈

### 后端
- **Java 21**
- **Spring Boot 3.5.5**
- **MyBatis Plus 3.5.9** 
- **MySQL 8.4+**
- **Redis 7.0+**
- **Elasticsearch 8.x**
- **Spring Security + JWT**

### 前端
- **React 18**
- **Ant Design Pro 6**
- **Umi 4**
- **TypeScript**

## 📋 环境要求

### 必需软件
1. **JDK 21+**
2. **Maven 3.8+**
3. **MySQL 8.4+**
4. **Redis 7.0+**
5. **Elasticsearch 8.x**
6. **Node.js 18+**

### 数据库配置

#### 1. MySQL 配置
```sql
-- 创建数据库
CREATE DATABASE myblog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'myblog'@'localhost' IDENTIFIED BY 'myblog123';
GRANT ALL PRIVILEGES ON myblog.* TO 'myblog'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. Redis 配置
确保 Redis 服务在默认端口 6379 运行：
```bash
# macOS (使用 Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# 验证 Redis 是否运行
redis-cli ping
```

#### 3. Elasticsearch 配置
确保 Elasticsearch 服务在端口 9200 运行：
```bash
# macOS (使用 Homebrew)
brew install elasticsearch
brew services start elasticsearch

# 验证 ES 是否运行
curl http://localhost:9200
```

## 🎯 快速启动

### 1. 克隆项目
```bash
git clone <repository-url>
cd myblog
```

### 2. 配置数据库连接
根据您的本地环境修改 `src/main/resources/application.yml`：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myblog?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root  # 修改为您的MySQL用户名
    password: root123  # 修改为您的MySQL密码
```

### 3. 启动后端服务
```bash
# 使用Maven启动
./mvnw spring-boot:run

# 或者编译后运行
./mvnw clean package
java -jar target/myblog-0.0.1-SNAPSHOT.jar
```

### 4. 启动前端服务
```bash
cd frontend
npm install
npm run dev
```

## 🔗 访问地址

- **后端API**: http://localhost:9999
- **前端管理后台**: http://localhost:3000
- **API文档**: http://localhost:9999/swagger-ui.html
- **接口健康检查**: http://localhost:9999/actuator/health

## 📁 项目结构

```
myblog/
├── src/main/java/com/ryan/myblog/
│   ├── controller/     # 控制器层
│   ├── service/        # 业务逻辑层
│   ├── mapper/         # 数据访问层
│   ├── entity/         # 实体类
│   ├── dto/           # 数据传输对象
│   ├── vo/            # 视图对象
│   ├── config/        # 配置类
│   └── utils/         # 工具类
├── src/main/resources/
│   ├── mapper/        # MyBatis XML映射文件
│   ├── sql/          # SQL初始化脚本
│   └── application.yml # 应用配置
└── frontend/         # React前端项目
    ├── src/
    ├── package.json
    └── .umirc.ts
```

## 🔧 开发说明

### 数据库初始化
首次启动时，应用会自动创建数据表结构。如需初始化测试数据，可以执行 `src/main/resources/sql/` 目录下的SQL脚本。

### API测试
项目集成了Swagger UI，启动后访问 http://localhost:9999/swagger-ui.html 查看和测试所有API接口。

### 缓存配置
Redis用于缓存热点数据和会话存储，确保Redis服务正常运行以获得最佳性能。

### 搜索功能
Elasticsearch用于全文搜索功能，确保ES服务正常运行以使用搜索相关功能。

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否启动
   - 验证数据库用户名密码
   - 确认数据库myblog已创建

2. **Redis连接失败**
   - 检查Redis服务是否在6379端口运行
   - 使用 `redis-cli ping` 测试连接

3. **Elasticsearch连接失败**
   - 检查ES服务是否在9200端口运行
   - 使用 `curl http://localhost:9200` 测试连接

4. **前端启动失败**
   - 确保Node.js版本 >= 18
   - 删除node_modules后重新安装: `rm -rf node_modules && npm install`

## 📄 许可证

[MIT License](LICENSE)

## 🤝 贡献

欢迎提交Issue和Pull Request!