# 部署检查清单

使用此清单确保所有步骤正确完成。

## 部署前检查

### 服务器环境
- [ ] 服务器可以SSH访问 (49.235.139.118)
- [ ] MySQL容器运行中 (端口13306)
- [ ] Redis容器运行中 (端口26739)
- [ ] Elasticsearch运行中 (端口9200)
- [ ] Nginx已安装
- [ ] 有root或sudo权限

### 本地准备
- [ ] 项目代码已更新到最新版本
- [ ] 已测试本地开发环境正常运行
- [ ] 已准备MySQL密码
- [ ] 已准备Redis密码（如果有）

## 部署步骤检查

### 1. 上传项目
- [ ] 项目文件已上传到 `/app/myblog/`
- [ ] 所有必需文件都存在:
  - [ ] myblog-backend/
  - [ ] myblog-frontend/
  - [ ] deploy/
  - [ ] nginx/
  - [ ] docker-compose.prod.yml

### 2. 环境配置
- [ ] 已创建 `.env.prod` 文件
- [ ] MYSQL_PASSWORD 已填写
- [ ] JWT_SECRET 已填写（至少32位）
- [ ] 文件权限设置为 600
- [ ] 所有脚本有执行权限 (`chmod +x deploy/*.sh`)

### 3. 服务器初始化
- [ ] 运行 `sudo ./server-setup.sh`
- [ ] Docker 安装成功
- [ ] Docker Compose 安装成功
- [ ] 防火墙规则已添加
- [ ] 应用目录已创建

### 4. 数据库初始化
- [ ] 运行 `./init-database.sh`
- [ ] myblog 数据库已创建
- [ ] myblog_user 用户已创建
- [ ] 数据表已创建（至少7个表）
- [ ] 默认数据已插入

验证命令:
```bash
mysql -h127.0.0.1 -P13306 -umyblog_user -p myblog -e "SHOW TABLES;"
```

### 5. 应用部署
- [ ] 运行 `./deploy.sh`
- [ ] 后端镜像构建成功
- [ ] 前端镜像构建成功
- [ ] 容器启动成功
- [ ] 健康检查通过

验证命令:
```bash
docker ps | grep myblog
curl http://localhost:8081/actuator/health
curl http://localhost:3000/health
```

### 6. Nginx配置
- [ ] 配置文件已复制到 `/etc/nginx/conf.d/`
- [ ] Nginx配置测试通过 (`nginx -t`)
- [ ] Nginx已重载 (`systemctl reload nginx`)

### 7. 访问测试
- [ ] 前端可访问: http://49.235.139.118
- [ ] API可访问: http://49.235.139.118/api/actuator/health
- [ ] 可以注册新用户
- [ ] 可以登录（admin/admin123）
- [ ] 可以发布文章
- [ ] 可以评论

## 部署后配置

### 安全配置
- [ ] 修改admin默认密码
- [ ] 配置云服务器安全组（开放80端口）
- [ ] 关闭不必要的端口（8081, 3000应只在内网访问）
- [ ] 设置防火墙规则
- [ ] 配置自动备份

### 优化配置
- [ ] 配置自动备份cron任务
- [ ] 设置日志轮转
- [ ] 配置监控告警（可选）
- [ ] 优化JVM参数（根据服务器内存）

### 域名配置（可选）
- [ ] 域名DNS已解析到服务器IP
- [ ] 更新Nginx配置中的server_name
- [ ] 申请SSL证书
- [ ] 配置HTTPS重定向

## 常见问题自查

### 后端无法启动
```bash
# 检查项：
1. .env.prod 中的 MYSQL_PASSWORD 是否正确
2. MySQL 是否运行: docker ps | grep mysql
3. 端口 13306 是否正确
4. 查看详细错误: docker logs myblog-backend
```

### 前端404
```bash
# 检查项：
1. 前端容器是否运行: docker ps | grep frontend
2. Nginx配置是否正确: nginx -t
3. 查看Nginx日志: tail -f /var/log/nginx/myblog_error.log
```

### API调用失败
```bash
# 检查项：
1. 后端是否健康: curl http://localhost:8081/actuator/health
2. Nginx代理配置是否正确
3. 浏览器控制台网络请求状态
```

## 回滚方案

如果部署失败需要回滚：

```bash
cd /app/myblog/deploy
./stop.sh

# 如果需要恢复数据
cd /app/myblog/backups
# 找到最近的备份并恢复
```

## 成功标志

✅ 所有检查项都已完成
✅ 可以通过 http://49.235.139.118 访问博客
✅ 可以正常登录和使用所有功能
✅ 日志中没有错误信息

## 下一步

- [ ] 配置域名和HTTPS
- [ ] 设置自动备份
- [ ] 配置监控
- [ ] 性能调优
- [ ] 编写内容开始使用博客

恭喜！您的博客系统已成功部署！🎉

