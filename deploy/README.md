# 部署脚本说明

## 脚本列表

### 1. server-setup.sh
**用途**: 初始化服务器环境

**功能**:
- 安装 Docker 和 Docker Compose
- 配置防火墙
- 创建应用目录
- 优化系统参数
- 配置Docker日志轮转

**使用方法**:
```bash
sudo ./server-setup.sh
```

**注意**: 需要root权限

---

### 2. init-database.sh
**用途**: 初始化MySQL数据库

**功能**:
- 创建数据库和用户
- 执行初始化SQL脚本
- 插入默认数据

**使用方法**:
```bash
./init-database.sh
```

**前置条件**: 
- MySQL服务运行中
- 已配置 .env.prod 文件

---

### 3. deploy.sh
**用途**: 部署应用

**功能**:
- 停止旧容器
- 构建Docker镜像
- 启动服务
- 健康检查

**使用方法**:
```bash
./deploy.sh
```

**前置条件**:
- Docker已安装
- 数据库已初始化
- .env.prod 已配置

---

### 4. stop.sh
**用途**: 停止服务

**功能**:
- 停止所有容器
- 可选择是否删除数据卷

**使用方法**:
```bash
./stop.sh
```

---

### 5. logs.sh
**用途**: 查看日志

**功能**:
- 查看后端/前端日志
- 实时跟踪日志

**使用方法**:
```bash
./logs.sh
```

---

### 6. backup.sh
**用途**: 数据备份

**功能**:
- 备份MySQL数据库
- 备份上传文件
- 清理旧备份（保留7天）

**使用方法**:
```bash
./backup.sh
```

**备份位置**: `/app/myblog/backups/`

---

## 部署流程

### 首次部署

```bash
# 1. 服务器环境准备
sudo ./server-setup.sh

# 2. 配置环境变量
cd /app/myblog
cp .env.prod.template .env.prod
vi .env.prod  # 编辑配置

# 3. 初始化数据库
cd deploy
./init-database.sh

# 4. 部署应用
./deploy.sh

# 5. 配置Nginx
sudo cp ../nginx/myblog.conf /etc/nginx/conf.d/
sudo nginx -t
sudo systemctl reload nginx

# 6. 访问测试
curl http://49.235.139.118
```

### 更新部署

```bash
# 1. 拉取最新代码
cd /app/myblog
git pull

# 2. 重新部署
cd deploy
./deploy.sh
```

## 快速命令参考

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
./logs.sh

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
./stop.sh

# 进入容器
docker exec -it myblog-backend sh
docker exec -it myblog-frontend sh

# 查看资源使用
docker stats

# 备份数据
./backup.sh
```

## 注意事项

1. **端口配置**
   - MySQL: 13306 (宿主机) → 3306 (容器)
   - Redis: 26739 (宿主机) → 6379 (容器)
   - Elasticsearch: 9200 (直接访问)

2. **网络配置**
   - 容器使用 `host.docker.internal` 访问宿主机服务
   - 需要在 docker-compose.prod.yml 中配置 `extra_hosts`

3. **安全建议**
   - 定期更新密码
   - 配置防火墙
   - 启用HTTPS
   - 定期备份数据

