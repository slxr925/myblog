#!/bin/bash

# 在服务器上创建 .env.prod 文件的辅助脚本

echo "==================================="
echo "创建生产环境配置文件"
echo "==================================="
echo ""

# 生成JWT密钥
JWT_SECRET=$(openssl rand -base64 32)

echo "请输入以下信息："
echo ""

# MySQL密码
read -sp "MySQL密码 (myblog_user): " MYSQL_PASSWORD
echo ""

# Redis密码（可选）
read -sp "Redis密码 (如果没有设置密码，直接回车): " REDIS_PASSWORD
echo ""

# 确认
echo ""
echo "配置信息："
echo "  MySQL用户: myblog_user"
echo "  MySQL密码: ****（已隐藏）"
echo "  JWT密钥: ${JWT_SECRET}"
echo "  服务器IP: 49.235.139.118"
echo ""
read -p "确认创建配置文件? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "已取消"
    exit 0
fi

# 创建文件
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cat > "${PROJECT_ROOT}/.env.prod" << EOF
# MySQL配置 (宿主机端口: 13306)
MYSQL_USERNAME=myblog_user
MYSQL_PASSWORD=${MYSQL_PASSWORD}

# Redis配置 (宿主机端口: 26739)
REDIS_PASSWORD=${REDIS_PASSWORD}

# Elasticsearch配置 (宿主机端口: 9200)
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_ENABLED=true

# JWT配置
JWT_SECRET=${JWT_SECRET}

# 服务器配置
SERVER_IP=49.235.139.118
EOF

# 设置权限
chmod 600 "${PROJECT_ROOT}/.env.prod"

echo ""
echo "✓ 配置文件已创建: ${PROJECT_ROOT}/.env.prod"
echo "✓ 文件权限已设置: 600"
echo ""
echo "下一步: ./init-database.sh"
