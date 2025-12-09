# 安全功能部署指南

## v1.1.0 - 安全增强版本

### 部署前准备

1. **备份当前数据**
   ```bash
   cd /app/myblog/deploy
   ./backup.sh
   ```

2. **检查环境变量**
   确保服务器上的`.env.prod`包含以下配置：
   ```bash
   # JWT配置（必须）
   JWT_SECRET=你的安全密钥至少32字符
   
   # 数据库配置
   MYSQL_HOST=172.17.0.1
   MYSQL_PORT=13306
   MYSQL_PASSWORD=你的数据库密码
   
   # Redis配置
   REDIS_HOST=172.17.0.1
   REDIS_PORT=26739
   REDIS_PASSWORD=你的redis密码（如果有）
   
   # Elasticsearch（可选）
   ELASTICSEARCH_ENABLED=false
   ```

### 部署步骤

#### 1. 本地构建

```bash
cd /Users/xuran/Dev/myblog
./build-local.sh
```

#### 2. 上传并部署

```bash
./deploy-update.sh
```

或者手动上传：

```bash
# 上传后端jar
scp myblog-backend/target/myblog-*.jar root@49.235.139.118:/app/myblog/myblog-backend/target/

# 上传前端dist
scp -r myblog-frontend/dist root@49.235.139.118:/app/myblog/myblog-frontend/

# 上传nginx配置
scp nginx/nginx.conf root@49.235.139.118:/app/myblog/nginx/

# 上传docker-compose
scp docker-compose.prod.yml root@49.235.139.118:/app/myblog/

# 登录服务器并部署
ssh root@49.235.139.118
cd /app/myblog/deploy
./quick-deploy.sh
```

#### 3. 执行数据库迁移

```bash
ssh root@49.235.139.118
cd /app/myblog

# 执行审计日志表创建
mysql -h172.17.0.1 -P13306 -uroot -p你的密码 myblog < myblog-backend/database/migrations/2025-12-05-add-audit-log.sql
```

### 部署后验证

#### 1. 检查服务状态

```bash
docker ps
# 应该看到：myblog-nginx, myblog-backend, myblog-frontend 都在运行

docker logs myblog-backend --tail 50
docker logs myblog-frontend --tail 50
docker logs myblog-nginx --tail 50
```

#### 2. 验证Nginx代理

```bash
# 测试健康检查
curl http://49.235.139.118/health

# 测试API代理（应该返回401）
curl http://49.235.139.118/api/user/info

# 直接访问8081应该失败（端口未暴露）
curl http://49.235.139.118:8081/api/health
# 预期：Connection refused
```

#### 3. 验证JWT双Token机制

使用Postman或curl测试登录：

```bash
# 登录获取token
curl -X POST http://49.235.139.118/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"你的密码"}'

# 响应应该包含accessToken和refreshToken
{
  "code": 200,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "tokenType": "Bearer",
    "expiresIn": 1800
  }
}
```

#### 4. 验证IP绑定（管理员）

1. 使用管理员账号登录，获取token
2. 从不同IP使用该token访问管理员接口
3. 应该被拒绝（403 Forbidden）

#### 5. 验证限流功能

```bash
# 连续5次错误登录
for i in {1..6}; do
  curl -X POST http://49.235.139.118/api/user/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}';
  echo "";
done

# 第6次应该返回429或423状态码
```

#### 6. 验证登录失败锁定

连续5次使用错误密码登录后：
- 应该提示"账号已被锁定，请X分钟后再试"
- 在Redis中可以看到锁定key：
  ```bash
  redis-cli KEYS "login:locked:*"
  ```

#### 7. 检查审计日志表

```bash
mysql -h172.17.0.1 -P13306 -uroot -p你的密码 myblog

SHOW TABLES LIKE 'audit_log';
DESC audit_log;
```

### 安全验证清单

- [ ] 后端8081端口不能直接从外部访问
- [ ] 所有API请求通过Nginx（80端口）
- [ ] 未授权访问返回401
- [ ] 无权限访问返回403
- [ ] 限流生效，返回429
- [ ] 管理员token IP验证生效
- [ ] 登录失败5次后锁定
- [ ] 审计日志表创建成功
- [ ] Token刷新接口正常工作

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看Redis连接
redis-cli INFO clients

# 查看Nginx访问日志
docker logs myblog-nginx --tail 100

# 查看限流触发次数
redis-cli KEYS "rate_limit:*" | wc -l
```

### 回滚方案

如果部署出现问题：

```bash
cd /app/myblog/deploy

# 查看可用备份
ls -lh backups/

# 恢复到指定备份
./rollback.sh backup-20251205-123456
```

### 故障排查

#### 问题1：Nginx容器启动失败

```bash
docker logs myblog-nginx

# 检查配置文件语法
docker run --rm -v /app/myblog/nginx/nginx.conf:/etc/nginx/conf.d/default.conf nginx:1.27-alpine nginx -t
```

#### 问题2：后端无法连接Redis

```bash
# 检查Redis是否运行
docker ps | grep redis

# 测试Redis连接
redis-cli -h 172.17.0.1 -p 26739 -a 你的密码 PING
```

#### 问题3：前端API调用失败

1. 检查浏览器Console
2. 确认请求是发送到 `/api` 而不是 `http://ip:8081/api`
3. 检查Nginx日志

### 监控建议

1. **设置告警**
   - Redis连接失败
   - 登录失败次数异常
   - 限流触发频繁

2. **定期检查**
   - 每天查看审计日志
   - 每周检查失败登录统计
   - 每月review安全配置

3. **日志保留**
   - Nginx日志保留30天
   - 审计日志保留90天
   - 备份文件保留7天

## 数据库迁移

### 修复评论功能（2025-12-09）

如果是从旧版本升级，可能需要执行以下SQL修复评论功能：

```bash
# 方法1：使用迁移脚本
mysql -h172.17.0.1 -P13306 -uroot -p你的密码 myblog < myblog-backend/database/migrations/2025-12-09-fix-comment-parent-id.sql

# 方法2：手动执行
mysql -h172.17.0.1 -P13306 -uroot -p你的密码 myblog
ALTER TABLE tb_comment DROP FOREIGN KEY tb_comment_ibfk_3;
ALTER TABLE tb_comment MODIFY COLUMN parent_id BIGINT DEFAULT NULL;
UPDATE tb_comment SET parent_id = NULL WHERE parent_id = 0;
```

### 迁移检查

执行迁移后，验证结果：

```sql
-- 检查评论表结构
SHOW CREATE TABLE tb_comment;

-- 统计评论数据
SELECT
    COUNT(*) as total_comments,
    COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as top_level_comments
FROM tb_comment;
```

## 联系支持

如有问题，请查看：
- [SECURITY.md](SECURITY.md) - 安全配置详细说明
- [VERSION-UPDATE-GUIDE.md](VERSION-UPDATE-GUIDE.md) - 版本更新指南
- [deploy/README.md](deploy/README.md) - 部署文档

