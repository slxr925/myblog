#!/bin/bash

# 本地Docker环境停止脚本

set -e

echo "==================================="
echo "停止 MyBlog 本地Docker环境"
echo "==================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 项目根目录
resolve_project_root() {
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local root_candidate
    root_candidate="$(cd "$script_dir/../.." && pwd)"
    if [ -f "$root_candidate/docker-compose.yml" ]; then
        echo "$root_candidate"
        return
    fi
    local current="$script_dir"
    local i
    for i in 1 2 3 4 5; do
        if [ -f "$current/docker-compose.yml" ]; then
            echo "$current"
            return
        fi
        current="$(cd "$current/.." && pwd)"
    done
    echo "$root_candidate"
}

PROJECT_ROOT="$(resolve_project_root)"
cd "${PROJECT_ROOT}"

# 检查是否有运行的容器
if docker ps | grep -q myblog.*local; then
    echo "正在停止服务..."
    docker compose -f docker-compose.yml down
    echo -e "${GREEN}✓ 服务已停止${NC}"
else
    echo -e "${YELLOW}没有运行中的本地容器${NC}"
fi

# 询问是否删除数据卷
echo ""
read -p "是否删除数据卷（MySQL、Redis、ES数据将丢失）? (y/n): " REMOVE_VOLUMES
if [ "$REMOVE_VOLUMES" = "y" ] || [ "$REMOVE_VOLUMES" = "Y" ]; then
    echo -e "${RED}警告: 即将删除所有数据卷！${NC}"
    read -p "确认删除? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
        docker compose -f docker-compose.yml down -v
        echo -e "${GREEN}✓ 数据卷已删除${NC}"
    else
        echo "已取消"
    fi
fi

echo ""
echo "容器状态:"
docker ps -a -f name=myblog.*local 2>/dev/null || echo "无本地容器"
