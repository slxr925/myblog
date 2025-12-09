#!/bin/bash

# =====================================================
# MySQL全文索引迁移部署脚本
# 版本: v1.1.7
# 日期: 2025-12-09
# 说明: 执行全文索引数据库迁移
# =====================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATION_FILE="$PROJECT_ROOT/myblog-backend/database/migrations/2025-12-09-add-fulltext-index.sql"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  MySQL全文索引迁移部署${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# 加载环境变量
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
    echo -e "${GREEN}✓${NC} 环境变量已加载"
else
    echo -e "${RED}✗${NC} .env文件不存在，使用默认配置"
fi

# 数据库配置（优先使用环境变量）
DB_HOST=${MYSQL_HOST:-172.17.0.1}
DB_PORT=${MYSQL_PORT:-13306}
DB_NAME=${MYSQL_DATABASE:-myblog}
DB_USER=${MYSQL_USERNAME:-root}
DB_PASSWORD=${MYSQL_PASSWORD}

# 检查必需参数
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}✗${NC} 数据库密码未设置"
    echo -e "${YELLOW}提示:${NC} 请在.env文件中设置MYSQL_PASSWORD"
    exit 1
fi

# 检查迁移文件是否存在
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗${NC} 迁移文件不存在: $MIGRATION_FILE"
    exit 1
fi

echo ""
echo -e "${BLUE}=== 数据库连接信息 ===${NC}"
echo -e "主机: ${DB_HOST}:${DB_PORT}"
echo -e "数据库: ${DB_NAME}"
echo -e "用户: ${DB_USER}"
echo ""

# 测试数据库连接
echo -e "${YELLOW}测试数据库连接...${NC}"
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 数据库连接成功"
else
    echo -e "${RED}✗${NC} 数据库连接失败"
    exit 1
fi

# 确认执行
echo ""
echo -e "${YELLOW}即将执行全文索引迁移，是否继续？${NC}"
echo -e "迁移文件: $(basename $MIGRATION_FILE)"
read -p "继续执行? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消${NC}"
    exit 0
fi

# 备份提示
echo ""
echo -e "${YELLOW}=== 执行迁移前建议 ===${NC}"
echo "1. 确保已备份数据库"
echo "2. 选择低峰期执行（索引创建可能需要几分钟）"
echo "3. 准备好回滚方案"
echo ""
read -p "已完成备份准备，继续? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消${NC}"
    exit 0
fi

# 执行迁移
echo ""
echo -e "${BLUE}=== 执行数据库迁移 ===${NC}"
echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE" 2>&1 | grep -v "mysql: \\[Warning\\]"; then
    echo ""
    echo -e "${GREEN}✓${NC} 迁移执行成功"
else
    echo ""
    echo -e "${RED}✗${NC} 迁移执行失败"
    exit 1
fi

# 验证索引
echo ""
echo -e "${BLUE}=== 验证全文索引 ===${NC}"
INDEX_CHECK=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW INDEX FROM tb_blog WHERE Key_name = 'ft_blog_search';" 2>&1 | grep -v "mysql: \\[Warning\\]" | grep -c "ft_blog_search" || echo "0")

if [ "$INDEX_CHECK" -ge 1 ]; then
    echo -e "${GREEN}✓${NC} 全文索引 ft_blog_search 已成功创建"
else
    echo -e "${RED}✗${NC} 全文索引验证失败"
    exit 1
fi

# 性能测试
echo ""
echo -e "${BLUE}=== 性能测试 ===${NC}"
echo "执行测试查询..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
EXPLAIN SELECT * FROM tb_blog 
WHERE MATCH(title, summary, content) AGAINST('Spring' IN BOOLEAN MODE) 
AND status = 1 AND deleted = 0 
LIMIT 5;" 2>&1 | grep -v "mysql: \\[Warning\\]" | grep "fulltext" > /dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 全文索引正在使用中（type=fulltext）"
else
    echo -e "${YELLOW}⚠${NC} 未检测到全文索引使用"
fi

# 完成
echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✓ 迁移完成！${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${GREEN}下一步操作:${NC}"
echo "1. 重启应用服务确保新代码生效"
echo "2. 测试搜索功能验证性能提升"
echo "3. 监控索引使用情况"
echo ""
echo -e "${YELLOW}回滚方法（如需）:${NC}"
echo "ALTER TABLE tb_blog DROP INDEX ft_blog_search;"
echo ""
echo "完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
