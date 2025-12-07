#!/bin/bash

# 数据库初始化脚本
# 用途：在服务器上初始化MySQL数据库

set -e

echo "==================================="
echo "MyBlog 数据库初始化脚本"
echo "==================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# MySQL连接信息 - 默认配置
MYSQL_HOST="127.0.0.1"
MYSQL_PORT="13306"
MYSQL_ROOT_USER="root"
MYSQL_ROOT_PASSWORD="Kpiass123."
MYSQL_DATABASE="myblog"

# 读取环境变量（如果存在）
if [ -f ../.env.prod ]; then
    echo -e "${GREEN}检测到 .env.prod 文件，正在加载配置...${NC}"
    source ../.env.prod
    MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
    MYSQL_PORT="${MYSQL_PORT:-13306}"
    MYSQL_DATABASE="${MYSQL_DATABASE:-myblog}"
    MYSQL_ROOT_USER="${MYSQL_USERNAME:-root}"
    MYSQL_ROOT_PASSWORD="${MYSQL_PASSWORD}"
    echo "使用配置: ${MYSQL_ROOT_USER}@${MYSQL_HOST}:${MYSQL_PORT}"
else
    echo -e "${YELLOW}未找到 .env.prod 文件，使用默认配置${NC}"
    read -p "MySQL主机 (默认: ${MYSQL_HOST}): " INPUT_HOST
    MYSQL_HOST="${INPUT_HOST:-$MYSQL_HOST}"
    
    read -p "MySQL端口 (默认: ${MYSQL_PORT}): " INPUT_PORT
    MYSQL_PORT="${INPUT_PORT:-$MYSQL_PORT}"
    
    read -p "MySQL用户 (默认: ${MYSQL_ROOT_USER}): " INPUT_USER
    MYSQL_ROOT_USER="${INPUT_USER:-$MYSQL_ROOT_USER}"
    
    read -sp "MySQL密码 (默认: Kpiass123.): " INPUT_PASSWORD
    echo ""
    MYSQL_ROOT_PASSWORD="${INPUT_PASSWORD:-$MYSQL_ROOT_PASSWORD}"
fi

# 检查MySQL是否可访问
echo "正在检查 MySQL 连接..."
if ! mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1;" &>/dev/null; then
    echo -e "${RED}错误: 无法连接到 MySQL 服务器${NC}"
    echo "请检查:"
    echo "  1. MySQL 服务是否运行: docker ps | grep mysql"
    echo "  2. 端口 ${MYSQL_PORT} 是否正确"
    echo "  3. 用户密码是否正确"
    exit 1
fi

echo -e "${GREEN}MySQL 连接成功!${NC}"

# 创建数据库
echo "正在创建数据库 ${MYSQL_DATABASE}..."
mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

echo -e "${GREEN}数据库创建成功!${NC}"

# 执行初始化SQL脚本
echo "正在执行数据库初始化脚本..."
if [ -f "../myblog-backend/database/init.sql" ]; then
    mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < ../myblog-backend/database/init.sql
    echo -e "${GREEN}数据库结构初始化完成!${NC}"
else
    echo -e "${RED}错误: 找不到初始化脚本 myblog-backend/database/init.sql${NC}"
    exit 1
fi

# 执行数据库迁移脚本
if [ -d "../myblog-backend/database/migrations" ]; then
    echo "正在执行数据库迁移脚本..."
    for migration in ../myblog-backend/database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "  执行: $(basename $migration)"
            mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "$migration"
        fi
    done
    echo -e "${GREEN}数据库迁移完成!${NC}"
fi

# 执行性能优化索引脚本
echo "正在创建性能优化索引..."
if [ -f "../myblog-backend/database/migrations/2025-12-07-add-performance-indexes.sql" ]; then
    echo "  执行: 2025-12-07-add-performance-indexes.sql"
    mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < ../myblog-backend/database/migrations/2025-12-07-add-performance-indexes.sql
    echo -e "${GREEN}性能索引创建完成!${NC}"
else
    echo -e "${YELLOW}警告: 找不到性能索引脚本 myblog-backend/database/migrations/2025-12-07-add-performance-indexes.sql${NC}"
    echo -e "${YELLOW}将手动创建关键索引...${NC}"

    # 手动创建关键索引
    mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" <<EOF
-- 博客表关键索引
ALTER TABLE tb_blog ADD INDEX IF NOT EXISTS idx_tb_blog_category_id (category_id);
ALTER TABLE tb_blog ADD INDEX IF NOT EXISTS idx_tb_blog_author_id (author_id);
ALTER TABLE tb_blog ADD INDEX IF NOT EXISTS idx_tb_blog_status (status);
ALTER TABLE tb_blog ADD INDEX IF NOT EXISTS idx_tb_blog_create_time (create_time);
ALTER TABLE tb_blog ADD INDEX IF NOT EXISTS idx_tb_blog_view_count (view_count);
ALTER TABLE tb_blog ADD INDEX IF NOT EXISTS idx_tb_blog_like_count (like_count);

-- 复合索引
ALTER TABLE tb_blog ADD INDEX IF NOT EXISTS idx_tb_blog_list_query (status, deleted, is_top, create_time DESC);
ALTER TABLE tb_blog ADD INDEX IF NOT EXISTS idx_tb_blog_hot_query (status, deleted, view_count DESC, like_count DESC, publish_time DESC);
ALTER TABLE tb_blog ADD INDEX IF NOT EXISTS idx_tb_blog_latest_query (status, deleted, publish_time DESC);

-- 博客标签关联表索引
ALTER TABLE tb_blog_tag ADD INDEX IF NOT EXISTS idx_tb_blog_tag_blog_id (blog_id);
ALTER TABLE tb_blog_tag ADD INDEX IF NOT EXISTS idx_tb_blog_tag_tag_id (tag_id);
ALTER TABLE tb_blog_tag ADD INDEX IF NOT EXISTS idx_tb_blog_tag_blog_tag (blog_id, tag_id);

-- 用户点赞表索引
ALTER TABLE tb_user_like ADD INDEX IF NOT EXISTS idx_tb_user_like_user_id (user_id);
ALTER TABLE tb_user_like ADD INDEX IF NOT EXISTS idx_tb_user_like_target (target_type, target_id);
ALTER TABLE tb_user_like ADD INDEX IF NOT EXISTS idx_tb_user_like_target_status (target_type, target_id, status);

-- 用户表索引
ALTER TABLE tb_user ADD UNIQUE INDEX IF NOT EXISTS idx_tb_user_username (username);
ALTER TABLE tb_user ADD UNIQUE INDEX IF NOT EXISTS idx_tb_user_email (email);
ALTER TABLE tb_user ADD INDEX IF NOT EXISTS idx_tb_user_nickname (nickname);

-- 分类和标签表索引
ALTER TABLE tb_category ADD UNIQUE INDEX IF NOT EXISTS idx_category_name (name);
ALTER TABLE tb_tag ADD UNIQUE INDEX IF NOT EXISTS idx_tag_name (name);
EOF

    echo -e "${GREEN}关键索引创建完成!${NC}"
fi

# 验证表创建
echo "正在验证表结构..."
TABLE_COUNT=$(mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" -e "SHOW TABLES;" | wc -l)

if [ "$TABLE_COUNT" -gt 1 ]; then
    echo -e "${GREEN}成功! 共创建 $((TABLE_COUNT - 1)) 个表${NC}"
    echo ""
    echo "数据表列表:"
    mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" -e "SHOW TABLES;"
else
    echo -e "${YELLOW}警告: 没有检测到创建的表${NC}"
fi

echo ""
echo -e "${GREEN}==================================="
echo "数据库初始化完成！"
echo "===================================${NC}"
echo "数据库信息:"
echo "  主机: ${MYSQL_HOST}"
echo "  端口: ${MYSQL_PORT}"
echo "  数据库: ${MYSQL_DATABASE}"
echo "  用户: ${MYSQL_ROOT_USER}"
echo ""
echo "下一步："
echo "  1. 检查配置: cat ../.env.prod"
echo "  2. 部署应用: cd .. && ./deploy/quick-upload.sh"
echo ""

