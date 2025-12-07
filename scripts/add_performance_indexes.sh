#!/bin/bash

# 博客系统性能优化 - 添加数据库索引脚本
# 使用方法: ./add_performance_indexes.sh [mysql_host] [mysql_port] [mysql_database] [mysql_username] [mysql_password]

# 默认参数
MYSQL_HOST=${1:-172.17.0.1}
MYSQL_PORT=${2:-13306}
MYSQL_DATABASE=${3:-myblog}
MYSQL_USERNAME=${4:-root}
MYSQL_PASSWORD=${5:-}

# SQL脚本路径
SQL_SCRIPT="$(dirname "$0")/../myblog-backend/src/main/resources/sql/performance_indexes.sql"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}博客系统数据库性能优化索引创建脚本${NC}"
echo "========================================"
echo "MySQL Host: $MYSQL_HOST"
echo "MySQL Port: $MYSQL_PORT"
echo "Database: $MYSQL_DATABASE"
echo "Username: $MYSQL_USERNAME"
echo "SQL Script: $SQL_SCRIPT"
echo ""

# 检查SQL脚本是否存在
if [ ! -f "$SQL_SCRIPT" ]; then
    echo -e "${RED}错误: SQL脚本文件不存在: $SQL_SCRIPT${NC}"
    exit 1
fi

# 检查MySQL客户端是否安装
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}错误: MySQL客户端未安装${NC}"
    echo "请先安装MySQL客户端:"
    echo "  Ubuntu/Debian: sudo apt-get install mysql-client"
    echo "  macOS: brew install mysql-client"
    echo "  CentOS/RHEL: sudo yum install mysql"
    exit 1
fi

# 提示用户确认
echo -e "${YELLOW}警告: 此脚本将为数据库添加索引，可能需要几分钟时间完成${NC}"
echo -e "${YELLOW}建议在低峰期执行此操作${NC}"
read -p "是否继续执行? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 1
fi

# 执行SQL脚本
echo -e "${GREEN}开始执行索引创建脚本...${NC}"
echo ""

# 构建MySQL连接命令
MYSQL_CMD="mysql -h$MYSQL_HOST -P$MYSQL_PORT -u$MYSQL_USERNAME"
if [ ! -z "$MYSQL_PASSWORD" ]; then
    MYSQL_CMD="$MYSQL_CMD -p$MYSQL_PASSWORD"
fi
MYSQL_CMD="$MYSQL_CMD $MYSQL_DATABASE"

# 执行SQL
if $MYSQL_CMD < "$SQL_SCRIPT"; then
    echo ""
    echo -e "${GREEN}索引创建成功完成！${NC}"
    echo ""
    echo -e "${YELLOW}建议执行以下操作来优化数据库性能：${NC}"
    echo "1. 更新表统计信息: ANALYZE TABLE tb_blog, tb_user, tb_category, tb_tag, tb_blog_tag, tb_user_like;"
    echo "2. 检查索引使用情况: SHOW INDEX FROM tb_blog;"
    echo "3. 监控慢查询日志以识别其他需要优化的查询"
else
    echo ""
    echo -e "${RED}索引创建失败！${NC}"
    echo -e "${YELLOW}请检查：${NC}"
    echo "1. MySQL连接参数是否正确"
    echo "2. MySQL服务是否正常运行"
    echo "3. 用户是否有足够的权限"
    echo "4. SQL脚本语法是否正确"
    exit 1
fi

# 提供验证索引的命令
echo ""
echo -e "${YELLOW}验证索引是否创建成功：${NC}"
echo "mysql -h$MYSQL_HOST -P$MYSQL_PORT -u$MYSQL_USERNAME ${MYSQL_PASSWORD:+-p$MYSQL_PASSWORD} $MYSQL_DATABASE -e \"SHOW INDEX FROM tb_blog;\""
echo ""