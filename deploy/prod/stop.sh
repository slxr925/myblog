#!/bin/bash

# 停止服务脚本

set -e

echo "==================================="
echo "停止 MyBlog 服务"
echo "==================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_ROOT}"

# 检查是否有运行的容器
if [ "$(docker ps -q -f name=myblog)" ]; then
    echo "正在停止服务..."
    docker-compose -f docker-compose.prod.yml down
    echo -e "${GREEN}服务已停止${NC}"
else
    echo -e "${YELLOW}没有运行中的 MyBlog 容器${NC}"
fi

# 询问是否删除数据卷
read -p "是否删除数据卷? (y/n): " REMOVE_VOLUMES
if [ "$REMOVE_VOLUMES" = "y" ] || [ "$REMOVE_VOLUMES" = "Y" ]; then
    docker-compose -f docker-compose.prod.yml down -v
    echo -e "${GREEN}数据卷已删除${NC}"
fi

echo ""
echo "容器状态:"
docker ps -a -f name=myblog

