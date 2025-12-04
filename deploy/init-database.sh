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

