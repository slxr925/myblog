#!/bin/bash

# 部署脚本
# 用途：构建并启动Docker容器

set -e

echo "==================================="
echo "MyBlog 应用部署脚本"
echo "==================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_ROOT}"

echo "项目目录: ${PROJECT_ROOT}"

# 检查环境变量文件
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}错误: 未找到 .env.prod 文件${NC}"
    echo "请先复制 .env.prod.example 为 .env.prod 并配置相关参数"
    exit 1
fi

# 加载环境变量
source .env.prod

# 检查必需的环境变量
REQUIRED_VARS=("MYSQL_PASSWORD" "JWT_SECRET")
for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo -e "${RED}错误: 环境变量 ${VAR} 未设置${NC}"
        exit 1
    fi
done

echo -e "${GREEN}环境变量检查通过${NC}"

# 1. 清理旧容器
echo ""
echo -e "${BLUE}=== 步骤 1: 停止并清理旧容器 ===${NC}"
if [ "$(docker ps -aq -f name=myblog)" ]; then
    echo "停止运行中的容器..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod down
    echo -e "${GREEN}旧容器已停止${NC}"
else
    echo "没有运行中的容器"
fi

# 2. 构建镜像
echo ""
echo -e "${BLUE}=== 步骤 2: 构建 Docker 镜像 ===${NC}"
echo "这可能需要几分钟时间..."

# 构建后端镜像
echo "正在构建后端镜像..."
docker-compose -f docker-compose.prod.yml build backend

# 构建前端镜像
echo "正在构建前端镜像..."
docker-compose -f docker-compose.prod.yml build frontend

echo -e "${GREEN}镜像构建完成${NC}"

# 3. 创建网络（如果不存在）
echo ""
echo -e "${BLUE}=== 步骤 3: 准备Docker网络 ===${NC}"
if ! docker network ls | grep -q myblog-network; then
    docker network create myblog-network
    echo -e "${GREEN}网络 myblog-network 已创建${NC}"
else
    echo "网络 myblog-network 已存在"
fi

# 4. 启动服务
echo ""
echo -e "${BLUE}=== 步骤 4: 启动服务 ===${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

echo "等待服务启动..."
sleep 10

# 5. 检查服务状态
echo ""
echo -e "${BLUE}=== 步骤 5: 检查服务状态 ===${NC}"
docker-compose -f docker-compose.prod.yml ps

# 6. 健康检查
echo ""
echo -e "${BLUE}=== 步骤 6: 服务健康检查 ===${NC}"

# 检查后端
echo "检查后端服务..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:8081/actuator/health &>/dev/null; then
        echo -e "${GREEN}✓ 后端服务健康${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}✗ 后端服务启动失败${NC}"
        echo "查看日志: docker logs myblog-backend"
    else
        echo "等待后端服务启动... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

# 检查前端
echo "检查前端服务..."
if curl -f http://localhost:3000/health &>/dev/null; then
    echo -e "${GREEN}✓ 前端服务健康${NC}"
else
    echo -e "${YELLOW}⚠ 前端服务健康检查失败，但可能仍在启动中${NC}"
fi

# 7. 显示访问信息
echo ""
echo -e "${GREEN}==================================="
echo "部署完成！"
echo "===================================${NC}"
echo ""
echo "访问地址:"
echo "  前端: http://${SERVER_IP}"
echo "  后端API: http://${SERVER_IP}:8081"
echo "  API文档: http://${SERVER_IP}:8081/doc.html"
echo ""
echo "容器管理命令:"
echo "  查看日志: ./logs.sh"
echo "  停止服务: ./stop.sh"
echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo -e "${YELLOW}重要提示：${NC}"
echo "  1. 请配置 Nginx 反向代理以通过 80 端口访问"
echo "  2. 配置文件位于: nginx/myblog.conf"
echo "  3. 执行: sudo cp nginx/myblog.conf /etc/nginx/conf.d/"
echo "  4. 重载 Nginx: sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "容器状态:"
docker-compose -f docker-compose.prod.yml ps

