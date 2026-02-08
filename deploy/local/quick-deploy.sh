#!/bin/bash

# MyBlog 本地环境快速部署脚本
# 用途: 一键构建并部署所有服务（Backend + Frontend + 基础设施）
# 使用: ./deploy/local/quick-deploy.sh [--rebuild]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "==================================="
echo "MyBlog 本地环境快速部署"
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

# 检查参数
REBUILD=false
if [ "$1" = "--rebuild" ]; then
    REBUILD=true
    echo -e "${YELLOW}注意: 将重新构建所有镜像${NC}"
fi

# 1. 检查Docker环境
echo ""
echo -e "${BLUE}=== 步骤 1: 检查环境 ===${NC}"

# 获取Docker命令
if command -v docker &> /dev/null; then
    DOCKER_CMD="docker"
elif [ -f "/Applications/Docker.app/Contents/Resources/bin/docker" ]; then
    DOCKER_CMD="/Applications/Docker.app/Contents/Resources/bin/docker"
else
    echo -e "${RED}错误: Docker 未安装或未找到${NC}"
    exit 1
fi

# 检查Docker是否运行
if ! ${DOCKER_CMD} info &> /dev/null; then
    echo -e "${RED}错误: Docker 未运行${NC}"
    echo "请先启动 Docker Desktop"
    exit 1
fi

echo -e "${GREEN}✓ Docker 正在运行${NC}"

# 2. 停止旧容器
echo ""
echo -e "${BLUE}=== 步骤 2: 停止旧容器 ===${NC}"
if ${DOCKER_CMD} ps | grep -q myblog; then
    echo "停止运行中的容器..."
    ${DOCKER_CMD} compose -f docker-compose.yml down
    echo -e "${GREEN}✓ 旧容器已停止${NC}"
else
    echo "没有运行中的容器"
fi

# 3. 构建并启动服务
echo ""
echo -e "${BLUE}=== 步骤 3: 构建并启动服务 ===${NC}"

if [ "$REBUILD" = true ]; then
    echo "重新构建所有镜像..."
    ${DOCKER_CMD} compose -f docker-compose.yml build --no-cache backend frontend
    echo -e "${GREEN}✓ 镜像构建完成${NC}"
    echo ""
    echo "启动所有服务..."
    ${DOCKER_CMD} compose -f docker-compose.yml up -d
else
    echo "启动所有服务（使用已有镜像）..."
    ${DOCKER_CMD} compose -f docker-compose.yml up -d --build
fi

# 4. 等待服务启动
echo ""
echo -e "${BLUE}=== 步骤 4: 等待服务启动 ===${NC}"
echo "等待服务启动..."
sleep 5

echo ""
echo "容器状态:"
${DOCKER_CMD} compose -f docker-compose.yml ps

# 5. 健康检查
echo ""
echo -e "${BLUE}=== 步骤 5: 健康检查 ===${NC}"

# 检查MySQL
echo -n "检查 MySQL... "
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if ${DOCKER_CMD} exec myblog-mysql mysqladmin ping -h localhost --silent &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    RETRY=$((RETRY + 1))
    if [ $RETRY -eq $MAX_RETRIES ]; then
        echo -e "${RED}✗${NC}"
        echo "MySQL 健康检查失败"
    fi
    sleep 1
done

# 检查Redis
echo -n "检查 Redis... "
if ${DOCKER_CMD} exec myblog-redis redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# 检查Kafka
echo -n "检查 Kafka... "
if ${DOCKER_CMD} exec myblog-kafka /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# 检查后端服务
echo -n "检查 后端服务... "
MAX_RETRIES=60
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if ${DOCKER_CMD} exec myblog-backend wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    RETRY=$((RETRY + 1))
    if [ $RETRY -eq $MAX_RETRIES ]; then
        echo -e "${YELLOW}⚠ 超时${NC}"
        echo "提示: 后端服务可能仍在启动中，请稍后手动检查"
        echo "查看日志: docker logs myblog-backend"
        break
    fi
    sleep 2
done

# 检查前端服务
echo -n "检查 前端服务... "
if ${DOCKER_CMD} ps --filter "name=myblog-frontend" --filter "status=running" | grep -q myblog-frontend; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}"
fi

# 6. 完成
echo ""
echo -e "${GREEN}==================================="
echo "部署完成！"
echo "===================================${NC}"
echo ""
echo "访问地址:"
echo "  前端 (Dev): http://localhost:3000"
echo "  后端 (API): http://localhost:8081"
echo "  Kafka UI:   http://localhost:8088"
echo "  数据库:     localhost:3307 (用户名: root, 密码: xr123321)"
echo ""
echo "管理命令:"
echo "  查看日志:   ./deploy/local/logs.sh"
echo "  停止服务:   ./deploy/local/stop.sh"
echo "  重启服务:   docker compose restart [service]"
echo "  重建后端:   ./deploy/local/quick-deploy.sh --rebuild"
echo ""
echo "开发提示:"
echo "  - 后端代码修改后会自动热重载（mvn spring-boot:run）"
echo "  - 前端代码修改后会自动热重载（Vite）"
echo "  - 数据库已预置 16 篇测试文章"
echo ""
