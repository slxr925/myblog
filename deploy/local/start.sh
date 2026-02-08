#!/bin/bash

# 本地Docker环境启动脚本
# 用途：一键启动完整的本地Docker开发环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "==================================="
echo "MyBlog 本地Docker环境启动脚本"
echo "==================================="

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

echo "项目目录: ${PROJECT_ROOT}"

# 定义 Docker 命令
if command -v docker &> /dev/null; then
    DOCKER="docker"
elif [ -f "/Applications/Docker.app/Contents/Resources/bin/docker" ]; then
    DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
else
    echo -e "${RED}错误: 未找到 docker 命令${NC}"
    exit 1
fi

COMPOSE="$DOCKER compose"

# 1. 检查环境
echo ""
echo -e "${BLUE}=== 步骤 1: 检查环境 ===${NC}"

if ! $DOCKER info &> /dev/null; then
    echo -e "${RED}错误: Docker 未运行${NC}"
    echo "请先启动 Docker Desktop"
    exit 1
fi
echo -e "${GREEN}✓ Docker 正在运行${NC}"

# 2. 停止已有容器
echo ""
echo -e "${BLUE}=== 步骤 2: 清理旧容器 ===${NC}"

if $DOCKER ps -a | grep -q myblog; then
    echo "停止运行中的本地容器..."
    $COMPOSE -f docker-compose.yml down 2>/dev/null || true
    echo -e "${GREEN}✓ 旧容器已清理${NC}"
else
    echo "没有运行中的本地容器"
fi

# 3. 构建并启动服务
echo ""
echo -e "${BLUE}=== 步骤 3: 构建并启动服务 ===${NC}"

# 是否重新构建
if [ "$1" = "--rebuild" ] || [ "$1" = "-r" ]; then
    echo "重新构建镜像..."
    $COMPOSE -f docker-compose.yml build --no-cache
fi

echo "启动所有服务..."
$COMPOSE -f docker-compose.yml up -d

# 4. 等待服务健康
echo ""
echo -e "${BLUE}=== 步骤 4: 等待服务启动 ===${NC}"

echo "等待服务启动..."
sleep 5

# 显示容器状态
echo ""
echo "容器状态:"
$COMPOSE -f docker-compose.yml ps

# 5. 健康检查
echo ""
echo -e "${BLUE}=== 步骤 5: 健康检查 ===${NC}"

# 检查MySQL
echo -n "检查 MySQL... "
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if $DOCKER exec myblog-mysql mysqladmin ping -h localhost -uroot -pxr123321 &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
done
[ $RETRY_COUNT -eq $MAX_RETRIES ] && echo -e "${YELLOW}⚠ 等待超时${NC}"

# 检查Redis
echo -n "检查 Redis... "
if $DOCKER exec myblog-redis redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ Redis检查失败${NC}"
fi

# 检查Kafka
echo -n "检查 Kafka... "
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if $DOCKER exec myblog-kafka /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
done
[ $RETRY_COUNT -eq $MAX_RETRIES ] && echo -e "${YELLOW}⚠ 等待超时${NC}"

# 检查Posterior
echo -n "检查 后端服务... "
MAX_RETRIES=60
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8081/actuator/health &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 3
done
[ $RETRY_COUNT -eq $MAX_RETRIES ] && echo -e "${YELLOW}⚠ 后端启动中，请稍等...${NC}"

# 6. 完成
echo ""
echo -e "${GREEN}==================================="
echo "本地环境启动完成！"
echo "===================================${NC}"
echo ""
echo "服务访问地址:"
echo "  前端: http://localhost:3000"
echo "  后端API: http://localhost:8081"
echo "  API文档: http://localhost:8081/doc.html"
echo "  Kafka UI: http://localhost:8088"
echo "  Elasticsearch: http://localhost:9200"
echo ""
echo "数据库连接:"
echo "  MySQL: localhost:3307 (root/xr123321)"
echo "  Redis: localhost:6380"
echo ""
