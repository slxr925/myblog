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

# MySQL连接信息
MYSQL_HOST="127.0.0.1"
MYSQL_PORT="13306"
MYSQL_ROOT_PASSWORD=""
MYSQL_DATABASE="myblog"
MYSQL_USER="myblog_user"
MYSQL_PASSWORD=""

# 读取环境变量或提示用户输入
if [ -f ../.env.prod ]; then
    echo -e "${GREEN}检测到 .env.prod 文件，正在加载配置...${NC}"
    source ../.env.prod
    MYSQL_PASSWORD="${MYSQL_PASSWORD}"
else
    echo -e "${YELLOW}未找到 .env.prod 文件${NC}"
    read -sp "请输入 MySQL root 密码: " MYSQL_ROOT_PASSWORD
    echo ""
    read -sp "请输入要创建的数据库用户密码: " MYSQL_PASSWORD
    echo ""
fi

# 检查MySQL是否可访问
echo "正在检查 MySQL 连接..."
if ! mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -uroot -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1;" &>/dev/null; then
    echo -e "${RED}错误: 无法连接到 MySQL 服务器${NC}"
    echo "请检查:"
    echo "  1. MySQL 服务是否运行"
    echo "  2. 端口 ${MYSQL_PORT} 是否正确"
    echo "  3. root 密码是否正确"
    exit 1
fi

echo -e "${GREEN}MySQL 连接成功!${NC}"

# 创建数据库
echo "正在创建数据库 ${MYSQL_DATABASE}..."
mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -uroot -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

# 创建用户并授权
echo "正在创建用户 ${MYSQL_USER} 并授权..."
mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -uroot -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
EOF

# 执行初始化SQL脚本
echo "正在执行数据库初始化脚本..."
if [ -f "../myblog-backend/database/init.sql" ]; then
    mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" < ../myblog-backend/database/init.sql
    echo -e "${GREEN}数据库初始化完成!${NC}"
else
    echo -e "${RED}错误: 找不到初始化脚本 myblog-backend/database/init.sql${NC}"
    exit 1
fi

# 验证表创建
echo "正在验证表结构..."
TABLE_COUNT=$(mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" -e "SHOW TABLES;" | wc -l)

if [ "$TABLE_COUNT" -gt 1 ]; then
    echo -e "${GREEN}成功! 共创建 $((TABLE_COUNT - 1)) 个表${NC}"
    echo ""
    echo "数据表列表:"
    mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" -e "SHOW TABLES;"
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
echo "  用户: ${MYSQL_USER}"
echo ""
echo "现在可以运行 ./deploy.sh 部署应用"

