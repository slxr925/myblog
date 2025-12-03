#!/bin/bash

# 数据备份脚本
# 用途：备份MySQL数据库和上传文件

set -e

echo "==================================="
echo "MyBlog 数据备份脚本"
echo "==================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置
BACKUP_DIR="/app/myblog/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_HOST="127.0.0.1"
MYSQL_PORT="13306"
MYSQL_DATABASE="myblog"

# 加载环境变量
if [ -f "../.env.prod" ]; then
    source ../.env.prod
else
    echo -e "${YELLOW}未找到 .env.prod，请手动输入数据库信息${NC}"
    read -p "MySQL用户名: " MYSQL_USERNAME
    read -sp "MySQL密码: " MYSQL_PASSWORD
    echo ""
fi

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# 1. 备份数据库
echo "正在备份数据库..."
BACKUP_FILE="${BACKUP_DIR}/myblog_db_${DATE}.sql"

mysqldump -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USERNAME}" -p"${MYSQL_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "${MYSQL_DATABASE}" > "${BACKUP_FILE}"

# 压缩备份文件
gzip "${BACKUP_FILE}"
echo -e "${GREEN}数据库备份完成: ${BACKUP_FILE}.gz${NC}"

# 2. 备份上传文件
echo "正在备份上传文件..."
UPLOAD_DIR="/app/myblog/data/backend/uploads"
if [ -d "${UPLOAD_DIR}" ]; then
    UPLOAD_BACKUP="${BACKUP_DIR}/myblog_uploads_${DATE}.tar.gz"
    tar -czf "${UPLOAD_BACKUP}" -C "$(dirname ${UPLOAD_DIR})" "$(basename ${UPLOAD_DIR})"
    echo -e "${GREEN}文件备份完成: ${UPLOAD_BACKUP}${NC}"
else
    echo -e "${YELLOW}上传目录不存在，跳过文件备份${NC}"
fi

# 3. 清理旧备份（保留最近7天）
echo "正在清理旧备份..."
find "${BACKUP_DIR}" -name "myblog_*" -type f -mtime +7 -delete
echo -e "${GREEN}旧备份已清理（保留7天内的备份）${NC}"

# 4. 显示备份信息
echo ""
echo "==================================="
echo "备份完成！"
echo "==================================="
echo "备份目录: ${BACKUP_DIR}"
echo ""
ls -lh "${BACKUP_DIR}"/*${DATE}*
echo ""
echo "备份文件列表:"
echo "  数据库: myblog_db_${DATE}.sql.gz"
if [ -f "${BACKUP_DIR}/myblog_uploads_${DATE}.tar.gz" ]; then
    echo "  上传文件: myblog_uploads_${DATE}.tar.gz"
fi
echo ""
echo -e "${YELLOW}建议定期将备份文件下载到本地或上传到云存储${NC}"

