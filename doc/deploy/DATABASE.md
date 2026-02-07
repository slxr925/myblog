# MyBlog 数据库部署指南

本文档详细说明 MyBlog 项目的数据库部署、初始化、升级和维护方法。

## 目录

- [环境要求](#环境要求)
- [数据库架构](#数据库架构)
- [初始化部署](#初始化部署)
- [增量升级](#增量升级)
- [数据库备份](#数据库备份)
- [故障恢复](#故障恢复)
- [性能优化](#性能优化)

## 环境要求

### MySQL 版本

- **最低版本**：MySQL 8.0+
- **推荐版本**：MySQL 8.3.0+
- **字符集**：utf8mb4
- **排序规则**：utf8mb4_unicode_ci

### 系统配置建议

```ini
# my.cnf 推荐配置
[mysqld]
# 字符集设置
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# 连接数
max_connections=500

# InnoDB 配置
innodb_buffer_pool_size=2G
innodb_log_file_size=512M
innodb_flush_log_at_trx_commit=2

# 查询缓存（MySQL 8.0+ 已移除）
# query_cache_type=1
# query_cache_size=128M

# 慢查询日志
slow_query_log=1
slow_query_log_file=/var/log/mysql/slow-query.log
long_query_time=2
```

## 数据库架构

### 核心业务表（14张）

| 表名 | 说明 | 关键特性 |
|------|------|----------|
| tb_user | 用户表 | JWT 认证 |
| tb_blog | 博客文章 | 支持草稿、置顶 |
| tb_category | 分类 | 多级分类 |
| tb_tag | 标签 | 文章标签 |
| tb_blog_tag | 文章-标签关联 | 多对多关系 |
| tb_comment | 评论 | 支持回复 |
| tb_collection_folder | 收藏夹 | 支持分享 |
| tb_user_collection | 用户收藏 | 逻辑删除 |
| tb_user_follow | 用户关注 | 关注关系 |
| tb_user_like | 用户点赞 | 点赞记录 |
| tb_browse_history | 浏览历史 | 用户行为追踪 |
| tb_visit_log | 访问日志 | PV/UV 统计 |
| tb_notification | 通知 | 系统通知 |
| tb_notification_setting | 通知设置 | 用户偏好 |

### 管理功能表（7张）

| 表名 | 说明 | 用途 |
|------|------|------|
| tb_ai_usage_daily | AI 使用统计 | Token 消耗追踪 |
| tb_audit_log | 审计日志 | 操作记录 |
| tb_blog_revision | 博客版本历史 | 内容版本控制 |
| tb_report | 举报管理 | 内容审核 |
| tb_search_log | 搜索日志 | 搜索行为分析 |
| tb_user_block | 用户屏蔽 | 内容过滤 |
| tb_user_session | 用户会话 | 多设备管理 |

### ER 关系图

```
tb_user (用户)
  ├── tb_blog (发布的博客)
  ├── tb_comment (发表的评论)
  ├── tb_collection_folder (收藏夹)
  ├── tb_user_collection (收藏记录)
  ├── tb_user_follow (关注关系)
  ├── tb_user_like (点赞记录)
  ├── tb_user_session (会话管理)
  └── tb_user_block (屏蔽关系)

tb_blog (博客)
  ├── tb_blog_tag (博客标签关联)
  ├── tb_comment (博客评论)
  ├── tb_blog_revision (版本历史)
  └── tb_category (所属分类)
```

## 初始化部署

### 方式一：使用 init.sql（推荐）

适用场景：首次部署、全新环境

#### 1. 准备数据库

```bash
# 登录 MySQL
mysql -uroot -p

# 创建数据库
CREATE DATABASE myblog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户并授权
CREATE USER 'myblog'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON myblog.* TO 'myblog'@'%';
FLUSH PRIVILEGES;

EXIT;
```

#### 2. 执行初始化脚本

```bash
# 方式 1：通过命令行
mysql -uroot -p myblog < myblog-backend/database/init.sql

# 方式 2：通过 Docker 容器
docker exec -i myblog-mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} myblog < myblog-backend/database/init.sql

# 方式 3：在生产服务器
ssh root@your-server "docker exec mysql_cns2-mysql_cNs2-1 mysql -uroot -p\${MYSQL_PASSWORD} myblog" < myblog-backend/database/init.sql
```

#### 3. 验证初始化

```sql
-- 查看所有表
USE myblog;
SHOW TABLES;

-- 验证表数量（应该是 24 张）
SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = 'myblog';

-- 验证核心表结构
DESC tb_user;
DESC tb_blog;
DESC tb_collection_folder;
```

### 方式二：使用 Docker Compose

适用场景：容器化部署、本地开发

#### docker-compose.yml 配置

```yaml
services:
  mysql:
    image: mysql:8.3.0
    container_name: myblog-mysql
    environment:
      MYSQL_ROOT_PASSWORD: xr123321
      MYSQL_DATABASE: myblog
      MYSQL_USER: myblog
      MYSQL_PASSWORD: myblog123
    ports:
      - "3307:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./myblog-backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:
```

#### 启动并初始化

```bash
# 启动容器（会自动执行 init.sql）
docker-compose up -d mysql

# 查看初始化日志
docker-compose logs -f mysql

# 等待健康检查通过
docker ps | grep myblog-mysql
```

### 方式三：手动执行脚本（分步部署）

适用场景：需要自定义初始化流程

```bash
#!/bin/bash
# manual-init.sh

set -e

DB_HOST="localhost"
DB_PORT="3307"
DB_ROOT_USER="root"
DB_ROOT_PASS="xr123321"
DB_NAME="myblog"

echo "=== 开始数据库初始化 ==="

# 1. 创建数据库
echo "步骤 1: 创建数据库"
mysql -h${DB_HOST} -P${DB_PORT} -u${DB_ROOT_USER} -p${DB_ROOT_PASS} << EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

# 2. 执行 init.sql
echo "步骤 2: 执行初始化脚本"
mysql -h${DB_HOST} -P${DB_PORT} -u${DB_ROOT_USER} -p${DB_ROOT_PASS} ${DB_NAME} < myblog-backend/database/init.sql

# 3. 验证
echo "步骤 3: 验证初始化结果"
TABLE_COUNT=$(mysql -h${DB_HOST} -P${DB_PORT} -u${DB_ROOT_USER} -p${DB_ROOT_PASS} -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}'")

echo "=== 初始化完成！共创建 ${TABLE_COUNT} 张表 ==="
```

## 增量升级

### 场景一：v1.0 升级到 v2.0

使用增量升级脚本，无需重新初始化数据库。

#### 1. 准备升级脚本

```bash
# 查看升级脚本
cat myblog-backend/database/upgrade_v1_to_v2.sql
```

#### 2. 执行升级

```bash
# 本地环境
docker exec myblog-mysql mysql -uroot -pxr123321 myblog < myblog-backend/database/upgrade_v1_to_v2.sql

# 生产环境
ssh root@49.235.139.118 "docker exec mysql_cns2-mysql_cNs2-1 mysql -uroot -p\${MYSQL_PASSWORD} myblog" < myblog-backend/database/upgrade_v1_to_v2.sql
```

#### 3. 验证升级

```sql
-- 检查新增字段
DESC tb_collection_folder;

-- 应该看到以下新字段：
-- is_public          tinyint(1)
-- share_code         varchar(32)
-- share_expire_time  datetime

-- 检查新增索引
SHOW INDEX FROM tb_collection_folder WHERE Key_name = 'idx_share_code';
```

### 场景二：添加管理功能表

这些表是可选的，不影响核心业务功能。

```bash
#!/bin/bash
# add-admin-tables.sh

# 本地执行
docker exec myblog-mysql mysql -uroot -pxr123321 myblog << 'EOF'
-- AI 使用统计表
CREATE TABLE IF NOT EXISTS tb_ai_usage_daily (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  usage_date date NOT NULL,
  request_count int DEFAULT 0,
  token_count int DEFAULT 0,
  create_time datetime DEFAULT CURRENT_TIMESTAMP,
  update_time datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_date (user_id, usage_date),
  KEY idx_usage_date (usage_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 审计日志表
CREATE TABLE IF NOT EXISTS tb_audit_log (
  id bigint NOT NULL AUTO_INCREMENT,
  operator_id bigint DEFAULT NULL,
  action varchar(100) DEFAULT NULL,
  target_type varchar(50) DEFAULT NULL,
  target_id bigint DEFAULT NULL,
  detail_json text,
  ip varchar(45) DEFAULT NULL,
  user_agent text,
  create_time datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_operator_id (operator_id),
  KEY idx_action (action),
  KEY idx_target_type (target_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 其他表参见 init.sql
EOF
```

### 场景三：自定义升级脚本

创建自己的升级脚本：

```sql
-- custom_upgrade.sql

START TRANSACTION;

-- 1. 添加新字段
ALTER TABLE tb_user
ADD COLUMN nickname VARCHAR(50) DEFAULT NULL COMMENT '昵称' AFTER username;

-- 2. 添加索引
CREATE INDEX idx_nickname ON tb_user(nickname);

-- 3. 更新数据
UPDATE tb_user SET nickname = username WHERE nickname IS NULL;

-- 4. 验证
SELECT COUNT(*) AS affected_rows FROM tb_user WHERE nickname IS NULL;

COMMIT;
```

执行自定义升级：

```bash
mysql -hlocalhost -P3307 -uroot -pxr123321 myblog < custom_upgrade.sql
```

## 数据库备份

### 逻辑备份（mysqldump）

#### 完整备份

```bash
# 本地备份
docker exec myblog-mysql mysqldump -uroot -pxr123321 \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  myblog > backup/myblog_full_$(date +%Y%m%d_%H%M%S).sql

# 生产环境备份
ssh root@49.235.139.118 "docker exec mysql_cns2-mysql_cNs2-1 mysqldump -uroot -p\${MYSQL_PASSWORD} \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  myblog" > backup/myblog_prod_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份
gzip backup/myblog_full_$(date +%Y%m%d_%H%M%S).sql
```

#### 仅结构备份

```bash
docker exec myblog-mysql mysqldump -uroot -pxr123321 \
  --no-data \
  myblog > backup/myblog_schema_$(date +%Y%m%d_%H%M%S).sql
```

#### 仅数据备份

```bash
docker exec myblog-mysql mysqldump -uroot -pxr123321 \
  --no-create-info \
  --skip-triggers \
  myblog > backup/myblog_data_$(date +%Y%m%d_%H%M%S).sql
```

#### 单表备份

```bash
docker exec myblog-mysql mysqldump -uroot -pxr123321 \
  myblog tb_user tb_blog > backup/myblog_core_tables_$(date +%Y%m%d_%H%M%S).sql
```

### 物理备份（文件复制）

```bash
# Docker 数据卷备份
docker run --rm \
  -v myblog_mysql_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/mysql_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# 生产环境数据卷备份
ssh root@49.235.139.118 "docker run --rm \
  -v mysql_cns2-mysql_cNs2-1_data:/data \
  -v /app/myblog/backups:/backup \
  alpine tar czf /backup/mysql_data_$(date +%Y%m%d_%H%M%S).tar.gz -C /data ."
```

### 自动备份脚本

```bash
#!/bin/bash
# auto-backup.sh

set -e

BACKUP_DIR="/app/myblog/backups/database"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MYSQL_CONTAINER="mysql_cns2-mysql_cNs2-1"
MYSQL_USER="root"
MYSQL_PASS="Kpiass123."
DATABASE="myblog"

# 创建备份目录
mkdir -p ${BACKUP_DIR}

echo "=== 开始数据库备份 ==="

# 逻辑备份
echo "步骤 1: 执行逻辑备份"
docker exec ${MYSQL_CONTAINER} mysqldump -u${MYSQL_USER} -p${MYSQL_PASS} \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  ${DATABASE} | gzip > ${BACKUP_DIR}/myblog_${TIMESTAMP}.sql.gz

# 清理旧备份
echo "步骤 2: 清理 ${RETENTION_DAYS} 天前的备份"
find ${BACKUP_DIR} -name "myblog_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# 显示备份文件大小
BACKUP_SIZE=$(du -h ${BACKUP_DIR}/myblog_${TIMESTAMP}.sql.gz | cut -f1)
echo "=== 备份完成！文件大小: ${BACKUP_SIZE} ==="
echo "备份文件: ${BACKUP_DIR}/myblog_${TIMESTAMP}.sql.gz"
```

添加到 crontab：

```bash
# 每天凌晨 2 点执行备份
0 2 * * * /app/myblog/scripts/auto-backup.sh >> /var/log/myblog-backup.log 2>&1
```

## 故障恢复

### 场景一：数据误删除恢复

```bash
# 1. 停止应用
docker-compose stop backend frontend

# 2. 找到最近的备份
ls -lh backup/ | grep myblog_full

# 3. 恢复数据
gunzip < backup/myblog_full_20250207_020000.sql.gz | \
  docker exec -i myblog-mysql mysql -uroot -pxr123321 myblog

# 4. 重启应用
docker-compose start backend frontend

# 5. 验证恢复
docker exec myblog-mysql mysql -uroot -pxr123321 -e "USE myblog; SELECT COUNT(*) FROM tb_blog;"
```

### 场景二：表损坏恢复

```sql
-- 1. 检查表
USE myblog;
CHECK TABLE tb_blog;

-- 2. 修复表
REPAIR TABLE tb_blog;

-- 3. 如果修复失败，从备份恢复单表
-- shell:
docker exec myblog-mysql mysqldump -uroot -pxr123321 \
  myblog tb_blog > backup/tb_blog_backup.sql

docker exec -i myblog-mysql mysql -uroot -pxr123321 myblog < backup/tb_blog_backup.sql
```

### 场景三：完全重建

```bash
#!/bin/bash
# full-rebuild.sh

echo "=== 警告：这将删除所有数据！==="
read -p "确认继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "取消操作"
  exit 1
fi

# 1. 停止所有服务
docker-compose down

# 2. 删除数据卷
docker volume rm myblog_mysql_data

# 3. 重新启动（会自动执行 init.sql）
docker-compose up -d mysql

# 4. 等待 MySQL 就绪
sleep 30

# 5. 启动其他服务
docker-compose up -d

echo "=== 重建完成 ==="
```

## 性能优化

### 索引优化

```sql
-- 1. 查看未使用的索引
SELECT
  object_schema,
  object_name,
  index_name
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE index_name IS NOT NULL
  AND count_star = 0
  AND object_schema = 'myblog'
ORDER BY object_schema, object_name;

-- 2. 分析慢查询
SELECT
  digest_text AS query,
  count_star AS exec_count,
  avg_timer_wait / 1000000000000 AS avg_time_sec
FROM performance_schema.events_statements_summary_by_digest
WHERE schema_name = 'myblog'
ORDER BY avg_time_sec DESC
LIMIT 10;

-- 3. 添加复合索引（示例）
CREATE INDEX idx_user_status_time ON tb_notification(user_id, is_read, create_time);
```

### 查询优化

```sql
-- 使用 EXPLAIN 分析查询
EXPLAIN SELECT * FROM tb_blog WHERE author_id = 1 AND deleted = 0 ORDER BY create_time DESC LIMIT 20;

-- 优化建议：
-- 1. 避免 SELECT *
-- 2. 使用索引字段
-- 3. 避免 LIKE '%keyword'
-- 4. 使用 LIMIT 限制结果集
```

### 配置优化

```sql
-- 1. 调整 InnoDB 缓冲池
SET GLOBAL innodb_buffer_pool_size = 2147483648; -- 2GB

-- 2. 调整连接数
SET GLOBAL max_connections = 500;

-- 3. 启用查询缓存（MySQL 5.7 及以下）
-- SET GLOBAL query_cache_type = 1;
-- SET GLOBAL query_cache_size = 134217728; -- 128MB

-- 持久化配置到 my.cnf
```

### 数据清理

```sql
-- 1. 清理过期数据（30天前）
DELETE FROM tb_visit_log WHERE create_time < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 2. 清理已删除的数据
DELETE FROM tb_blog WHERE deleted = 1 AND update_time < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 3. 优化表
OPTIMIZE TABLE tb_visit_log;
OPTIMIZE TABLE tb_blog;
```

## 监控和维护

### 健康检查

```sql
-- 1. 检查表状态
USE myblog;
SHOW TABLE STATUS;

-- 2. 检查索引
SHOW INDEX FROM tb_blog;

-- 3. 检查外键
SELECT
  CONSTRAINT_NAME,
  TABLE_NAME,
  REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'myblog'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### 定期维护任务

```bash
#!/bin/bash
# weekly-maintenance.sh

echo "=== 开始数据库维护 ==="

# 1. 分析表
docker exec myblog-mysql mysql -uroot -pxr123321 -e "ANALYZE TABLE myblog.tb_blog, myblog.tb_user, myblog.tb_comment;"

# 2. 优化表
docker exec myblog-mysql mysql -uroot -pxr123321 -e "OPTIMIZE TABLE myblog.tb_visit_log, myblog.tb_notification;"

# 3. 清理过期数据
docker exec myblog-mysql mysql -uroot -pxr123321 -e "DELETE FROM myblog.tb_visit_log WHERE create_time < DATE_SUB(NOW(), INTERVAL 30 DAY);"

# 4. 备份
./auto-backup.sh

echo "=== 维护完成 ==="
```

## 常见问题

### Q1: init.sql 执行失败

**问题**：外键约束错误

**解决**：
```sql
-- 先禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 执行 init.sql
SOURCE myblog-backend/database/init.sql;

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;
```

### Q2: 字符集问题

**问题**：中文乱码

**解决**：
```sql
-- 修改表字符集
ALTER TABLE tb_blog CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 修改数据库字符集
ALTER DATABASE myblog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Q3: 连接数不足

**问题**：Too many connections

**解决**：
```sql
-- 临时增加连接数
SET GLOBAL max_connections = 1000;

-- 持久化到 my.cnf
echo "max_connections = 1000" >> /etc/mysql/my.cnf
```

## 相关文档

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署指南
- [QUICK-ITERATION.md](./QUICK-ITERATION.md) - 快速迭代部署
- [SSH-SETUP.md](./SSH-SETUP.md) - SSH 配置指南

## 附录

### 完整的表结构

```sql
-- 查看所有表结构
USE myblog;
SELECT
  TABLE_NAME,
  TABLE_ROWS,
  DATA_LENGTH / 1024 / 1024 AS DATA_MB,
  INDEX_LENGTH / 1024 / 1024 AS INDEX_MB,
  (DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024 AS TOTAL_MB
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'myblog'
ORDER BY TOTAL_MB DESC;
```

### 数据库版本信息

```sql
-- 查看版本
SELECT VERSION();

-- 查看字符集
SHOW VARIABLES LIKE 'character%';

-- 查看引擎
SHOW ENGINES;
```

---

**最后更新**：2026-02-07
**维护者**：MyBlog 开发团队
