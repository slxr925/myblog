# 快速开始 - 5分钟部署指南

## 前置条件

- ✅ 服务器: 49.235.139.118 (OpenCloudOS)
- ✅ MySQL 容器运行中 (端口13306)
- ✅ Redis 容器运行中 (端口26739)
- ✅ Elasticsearch 容器运行中 (端口9200)
- ✅ Nginx 已安装
- ✅ Java 21 已安装

## 三步部署

### 第一步：上传项目

```bash
# 在服务器上执行
ssh root@49.235.139.118
mkdir -p /app/myblog
cd /app/myblog

# 使用Git克隆（如果项目已推送到Git）
git clone <your-repo-url> .

# 或者从本地上传
# 本地执行: scp -r myblog-backend myblog-frontend nginx deploy docker-compose.prod.yml root@49.235.139.118:/app/myblog/
```

### 第二步：配置环境

```bash
cd /app/myblog

# 1. 生成JWT密钥并创建配置文件
JWT_SECRET=$(openssl rand -base64 32)
cat > .env.prod << EOF
MYSQL_USERNAME=myblog_user
MYSQL_PASSWORD=你的MySQL密码
REDIS_PASSWORD=
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_ENABLED=true
JWT_SECRET=${JWT_SECRET}
SERVER_IP=49.235.139.118
EOF

# 2. 设置权限
chmod 600 .env.prod

# 3. 编辑并确认MySQL密码
vi .env.prod
```

### 第三步：一键部署

```bash
cd /app/myblog/deploy
chmod +x *.sh

# 运行快速部署脚本
sudo ./quick-deploy.sh
```

脚本会自动：
1. ✓ 检查环境（Docker、Docker Compose）
2. ✓ 验证配置文件
3. ✓ 初始化数据库
4. ✓ 构建并启动容器
5. ✓ 配置Nginx反向代理
6. ✓ 执行健康检查

## 访问应用

部署完成后访问：

**🌐 博客首页**: http://49.235.139.118

**📚 API文档**: http://49.235.139.118/api/doc.html

**👤 管理员登录**:
- 用户名: `admin`
- 密码: `admin123` （请立即修改！）

## 常用命令

```bash
# 查看服务状态
cd /app/myblog
docker ps | grep myblog

# 查看日志
cd /app/myblog/deploy
./logs.sh

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
./stop.sh

# 备份数据
./backup.sh
```

## 如果遇到问题

1. **服务启动失败**
   ```bash
   docker logs myblog-backend
   docker logs myblog-frontend
   ```

2. **数据库连接失败**
   - 检查 `.env.prod` 中的 `MYSQL_PASSWORD` 是否正确
   - 确认MySQL容器运行: `docker ps | grep mysql`

3. **页面无法访问**
   - 检查防火墙: `firewall-cmd --list-ports`
   - 检查云服务器安全组是否开放80端口

4. **详细文档**
   - 完整部署指南: `DEPLOYMENT.md`
   - 详细步骤: `SETUP_GUIDE.md`
   - 脚本说明: `README.md`

## 成功标志

部署成功后应该看到：

```bash
$ docker ps | grep myblog
myblog-frontend   Up 2 minutes   8080/tcp, 0.0.0.0:3000->8080/tcp
myblog-backend    Up 2 minutes   0.0.0.0:8081->8081/tcp
```

访问 http://49.235.139.118 能看到博客首页，可以注册登录使用。

---

**预计部署时间**: 5-10分钟（首次）

**如有问题**: 查看详细文档或检查日志

