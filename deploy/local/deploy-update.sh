#!/bin/bash

# MyBlog 本地环境完整部署脚本
# 用途: 构建镜像 + 部署所有服务（Backend + Frontend + 基础设施）
# 使用: ./deploy/local/deploy-update.sh [--rebuild]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MyBlog 本地环境完整部署           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${PROJECT_ROOT}"

# 检查参数
REBUILD_FLAG=""
if [ "$1" = "--rebuild" ]; then
    REBUILD_FLAG="--rebuild"
    echo -e "${YELLOW}注意: 将强制重新构建所有镜像（忽略缓存）${NC}"
    echo ""
fi

# ============================================
# 步骤1: 检查Docker环境
# ============================================
echo -e "${BLUE}=== 步骤 1/3: 检查环境 ===${NC}"

# 获取Docker命令
if command -v docker &> /dev/null; then
    DOCKER_CMD="docker"
elif [ -f "/Applications/Docker.app/Contents/Resources/bin/docker" ]; then
    DOCKER_CMD="/Applications/Docker.app/Contents/Resources/bin/docker"
else
    echo -e "${RED}✗ Docker 未安装或未找到${NC}"
    exit 1
fi

# 检查Docker是否运行
if ! ${DOCKER_CMD} info &> /dev/null; then
    echo -e "${RED}✗ Docker 未运行${NC}"
    echo "请先启动 Docker Desktop"
    exit 1
fi

echo -e "${GREEN}✓ Docker 运行正常${NC}"

# 检查 docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ 找不到 docker-compose.yml${NC}"
    exit 1
fi
echo -e "${GREEN}✓ docker-compose.yml 存在${NC}"

# 检查 Dockerfile
if [ ! -f "myblog-backend/Dockerfile" ] || [ ! -f "myblog-frontend/Dockerfile" ]; then
    echo -e "${RED}✗ 找不到 Dockerfile${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dockerfile 存在${NC}"

echo ""

# ============================================
# 步骤2: 构建镜像
# ============================================
echo -e "${BLUE}=== 步骤 2/3: 构建Docker镜像 ===${NC}"

if [ "$REBUILD_FLAG" = "--rebuild" ]; then
    echo "强制重新构建所有镜像..."
    ${DOCKER_CMD} compose -f docker-compose.yml build --no-cache backend frontend
else
    echo "构建镜像（使用缓存）..."
    ${DOCKER_CMD} compose -f docker-compose.yml build backend frontend
fi

echo -e "${GREEN}✓ 镜像构建完成${NC}"
echo ""

# ============================================
# 步骤3: 部署服务
# ============================================
echo -e "${BLUE}=== 步骤 3/3: 部署服务 ===${NC}"

# 调用 quick-deploy.sh
if [ ! -f "deploy/local/quick-deploy.sh" ]; then
    echo -e "${RED}✗ 找不到 quick-deploy.sh${NC}"
    exit 1
fi

chmod +x deploy/local/quick-deploy.sh

# 传递 rebuild 参数（如果有）
if [ "$REBUILD_FLAG" = "--rebuild" ]; then
    ./deploy/local/quick-deploy.sh --rebuild
else
    ./deploy/local/quick-deploy.sh
fi

# ============================================
# 完成
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     🎉 部署成功！                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}部署信息:${NC}"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  项目: MyBlog 本地开发环境"
echo ""
echo -e "${BLUE}访问地址:${NC}"
echo "  前端 (Dev): http://localhost:3000"
echo "  后端 (API): http://localhost:8081"
echo "  Kafka UI:   http://localhost:8088"
echo "  API文档:    http://localhost:8081/doc.html"
echo ""
echo -e "${BLUE}管理命令:${NC}"
echo "  查看日志:   ./deploy/local/logs.sh"
echo "  停止服务:   ./deploy/local/stop.sh"
echo "  重启服务:   docker compose restart [service]"
echo ""
echo -e "${BLUE}💡 开发提示:${NC}"
echo "  - 后端代码修改后会自动热重载"
echo "  - 前端代码修改后会自动热重载"
echo "  - 数据库已预置测试数据（16篇文章）"
echo ""
