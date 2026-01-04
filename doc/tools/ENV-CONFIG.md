# 环境变量配置说明

## 📝 配置文件说明

### 本地开发环境

```bash
myblog/
├── .env.example          # ✅ 配置模板（提交到Git，仅供参考）
└── docker-compose.yml    # ✅ 本地开发配置（硬编码，直接修改这里）
```

**重要说明：**
- ❌ **本地开发不需要 `.env` 文件**
- ✅ 所有配置已硬编码在 `docker-compose.yml` 中
- ✅ 需要修改配置时，直接编辑 `docker-compose.yml`

**Docker 网络配置：**
```yaml
# docker-compose.yml 中的配置
services:
  mysql:
    ports:
      - "3307:3306"    # 宿主机访问用 localhost:3307
    environment:
      MYSQL_ROOT_PASSWORD: xr123321
  
  backend:
    environment:
      MYSQL_HOST: mysql   # 容器间通信用服务名
      MYSQL_PORT: 3306    # 容器内部端口（不是3307）
```

**访问方式：**
- **容器间通信**：Backend → MySQL 用 `mysql:3306`
- **宿主机访问**：Navicat → MySQL 用 `localhost:3307`

### 生产环境（服务器）

```bash
/app/myblog/
├── .env.prod             # ⚠️ 生产环境配置（手动创建，不在Git中）
└── .env                  # 🤖 由部署脚本自动生成（从.env.prod复制）
```

**使用方法：**
```bash
# 1. 在服务器手动创建配置文件
vim /app/myblog/.env.prod

# 2. 填写生产环境配置
# MySQL、Redis、JWT_SECRET等

# 3. 部署时脚本会自动处理
# quick-deploy.sh 会自动复制 .env.prod 为 .env
```

## ⚙️ 配置项说明

### 数据库配置
```bash
MYSQL_HOST=172.17.0.1        # MySQL主机（Docker用host.docker.internal）
MYSQL_PORT=13306             # MySQL端口
MYSQL_DATABASE=myblog        # 数据库名
MYSQL_USERNAME=root          # 用户名
MYSQL_PASSWORD=your_password # 密码（必填，敏感信息）
```

### Redis配置
```bash
REDIS_HOST=172.17.0.1        # Redis主机
REDIS_PORT=26739             # Redis端口
REDIS_PASSWORD=your_password # Redis密码（如果有）
```

### JWT配置
```bash
# 生成方法：openssl rand -base64 32
JWT_SECRET=your_random_32_char_secret
```

### Elasticsearch配置（可选）
```bash
ELASTICSEARCH_ENABLED=false  # 本地开发可关闭
ELASTICSEARCH_HOST=172.17.0.1
ELASTICSEARCH_PORT=9200
```

### AI配置（可选）
```bash
AI_ENABLED=false             # 是否启用AI功能
OPENAI_API_KEY=sk-xxx        # OpenAI API密钥
```

## 🔐 安全注意事项

### ❌ 禁止提交到Git
- `.env`
- `.env.local`
- `.env.prod`
- `.env.production`
- 任何包含敏感信息的文件

### ✅ 可以提交到Git
- `.env.example` - 配置模板（不含真实密码）
- `.gitignore` - 确保正确配置

## 🚀 部署脚本逻辑

### quick-deploy.sh 的配置加载逻辑：

```bash
# 1. 优先查找 .env.prod
if [ -f ".env.prod" ]; then
    ENV_FILE=".env.prod"
# 2. 如果没有，使用 .env
elif [ -f ".env" ]; then
    ENV_FILE=".env"
else
    echo "错误：未找到配置文件"
    exit 1
fi

# 3. 加载配置
source "$ENV_FILE"

# 4. 复制给docker-compose使用（docker-compose默认读取.env）
if [ "$ENV_FILE" != ".env" ]; then
    cp "$ENV_FILE" .env
fi
```

## 📋 配置检查清单

### 本地开发环境
- [ ] 复制 `.env.example` 为 `.env.local`
- [ ] 修改数据库密码
- [ ] 修改 JWT_SECRET
- [ ] 确认 `.gitignore` 包含 `.env*`
- [ ] **不要提交** `.env.local` 到Git

### 生产环境
- [ ] 在服务器创建 `.env.prod`
- [ ] 使用强密码（MySQL、Redis、JWT）
- [ ] 确认端口配置正确
- [ ] 测试数据库连接
- [ ] **不要上传** `.env.prod` 到Git

## 🛠️ 常见问题

### Q1: 为什么我本地有 `.env.prod`？
**A:** 这是错误的！应该重命名为 `.env.local`。`.env.prod` 应该只存在于生产服务器。

### Q2: 部署时提示找不到配置文件？
**A:** 在服务器上手动创建 `/app/myblog/.env.prod` 文件。

### Q3: Docker容器连接不上MySQL？
**A:** 检查：
- `MYSQL_HOST` 是否正确（容器内用 `172.17.0.1` 或 `host.docker.internal`）
- 端口是否正确
- 密码是否正确

### Q4: 更新配置后不生效？
**A:** 重启服务：
```bash
cd /app/myblog
docker-compose -f docker-compose.prod.yml restart
```

## 📞 获取帮助

如有问题，查看：
- [部署文档](../deploy/DEPLOYMENT.md)
- [安全指南](SECURITY.md)
