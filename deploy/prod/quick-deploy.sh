#!/bin/bash

# 服务器端快速部署脚本
# 用途：在服务器上部署已上传的jar和dist

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "==================================="
echo "MyBlog 服务器端部署脚本"
echo "==================================="

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_ROOT}"

echo "项目目录: ${PROJECT_ROOT}"

# 1. 检查环境
echo ""
echo -e "${BLUE}=== 步骤 1: 检查环境 ===${NC}"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker 已安装${NC}"

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose 已安装${NC}"

# 2. 检查环境变量
echo ""
echo -e "${BLUE}=== 步骤 2: 检查配置 ===${NC}"

ENV_FILE=".env.prod"
if [ ! -f "$ENV_FILE" ]; then
    if [ -f ".env" ]; then
        echo -e "${YELLOW}提示: 未找到 .env.prod，将使用 .env${NC}"
        ENV_FILE=".env"
    else
        echo -e "${RED}错误: 未找到配置文件 (.env.prod 或 .env)${NC}"
        echo "请先创建配置文件"
        exit 1
    fi
fi

source "$ENV_FILE"

# 确保 docker-compose 可以读取环境变量
# docker-compose 默认读取 .env 文件
if [ "$ENV_FILE" != ".env" ]; then
    cp "$ENV_FILE" .env
    echo -e "${GREEN}✓ 环境配置已同步到 .env${NC}"
else
    echo -e "${GREEN}✓ 使用现有 .env 配置${NC}"
fi

if [ -z "$MYSQL_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}错误: MYSQL_PASSWORD 或 JWT_SECRET 未配置${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 环境配置检查通过${NC}"

# 3. 检查构建产物
echo ""
echo -e "${BLUE}=== 步骤 3: 检查构建产物 ===${NC}"

JAR_FILE=$(find myblog-backend/target -name "*.jar" -not -name "*-sources.jar" -not -name "*.original" 2>/dev/null | head -n 1)
if [ ! -f "$JAR_FILE" ]; then
    echo -e "${RED}错误: 未找到jar文件${NC}"
    echo "请先在本地构建并上传jar包到: myblog-backend/target/"
    exit 1
fi
echo -e "${GREEN}✓ 找到JAR文件: $(basename $JAR_FILE)${NC}"

if [ ! -d "myblog-frontend/dist" ] || [ -z "$(ls -A myblog-frontend/dist 2>/dev/null)" ]; then
    echo -e "${RED}错误: 未找到dist目录或目录为空${NC}"
    echo "请先在本地构建并上传dist目录到: myblog-frontend/"
    exit 1
fi
echo -e "${GREEN}✓ 找到Dist目录${NC}"

# 4. 备份当前版本
echo ""
echo -e "${BLUE}=== 步骤 4: 备份当前版本 ===${NC}"

BACKUP_DIR="backups/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "${BACKUP_DIR}"

# 备份旧jar（如果有容器在运行）
if docker ps -q -f name=myblog-backend &>/dev/null; then
    OLD_JAR=$(docker exec myblog-backend ls /app/app.jar 2>/dev/null || true)
    if [ -n "$OLD_JAR" ]; then
        docker cp myblog-backend:/app/app.jar "${BACKUP_DIR}/myblog-backend.jar" 2>/dev/null || true
    fi
fi

echo -e "${GREEN}✓ 备份完成: ${BACKUP_DIR}${NC}"

# 5. 停止旧容器
echo ""
echo -e "${BLUE}=== 步骤 5: 停止旧容器 ===${NC}"

if docker ps -a | grep -q myblog; then
    echo "停止运行中的容器..."
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" down
    echo -e "${GREEN}✓ 旧容器已停止${NC}"
else
    echo "没有运行中的容器"
fi

# 6. 准备数据目录
echo ""
echo -e "${BLUE}=== 步骤 6: 准备数据目录 ===${NC}"

# 创建日志和上传目录，设置权限
mkdir -p data/backend/logs data/backend/uploads
chmod -R 777 data/backend/logs data/backend/uploads
echo -e "${GREEN}✓ 数据目录已准备${NC}"

# 7. 构建新镜像
echo ""
echo -e "${BLUE}=== 步骤 7: 构建Docker镜像 ===${NC}"

# 构建后端镜像
echo "构建后端镜像..."
docker-compose -f docker-compose.prod.yml build backend

echo -e "${GREEN}✓ 镜像构建完成${NC}"

# 8. 启动服务
echo ""
echo -e "${BLUE}=== 步骤 8: 启动服务 ===${NC}"

docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d

echo "等待服务启动..."
sleep 10

# 9. 健康检查
echo ""
echo -e "${BLUE}=== 步骤 9: 健康检查 ===${NC}"

# 检查容器状态
echo "检查容器状态..."
docker-compose -f docker-compose.prod.yml ps

# 检查后端健康
echo ""
echo "检查后端服务..."
MAX_RETRIES=30
RETRY_COUNT=0
BACKEND_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec myblog-backend wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health &>/dev/null; then
        echo -e "${GREEN}✓ 后端服务健康${NC}"
        BACKEND_HEALTHY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}✗ 后端服务启动失败${NC}"
        echo "查看日志: docker logs myblog-backend"
        
        # 回滚
        echo ""
        echo -e "${YELLOW}尝试回滚到旧版本...${NC}"
        if [ -f "${BACKUP_DIR}/myblog-backend.jar" ]; then
            cp "${BACKUP_DIR}/myblog-backend.jar" "$JAR_FILE"
            docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" restart backend
            echo "已回滚，请检查日志"
    fi
        exit 1
else
        echo "等待后端服务启动... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

# 检查前端
echo ""
echo "检查前端服务..."
if docker exec myblog-frontend wget --no-verbose --tries=1 --spider http://localhost:80/ &>/dev/null; then
    echo -e "${GREEN}✓ 前端服务健康${NC}"
else
    echo -e "${YELLOW}⚠ 前端服务检查失败，但容器运行中${NC}"
fi

# 9. 完成
echo ""
echo -e "${GREEN}==================================="
echo "部署完成！"
echo "===================================${NC}"
echo ""
echo "容器状态:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "访问地址:"
echo "  博客首页: http://$(hostname -I | awk '{print $1}' || echo ${SERVER_IP})"
echo "  前端直连: http://$(hostname -I | awk '{print $1}' || echo ${SERVER_IP}):3000"
echo "  后端API: http://$(hostname -I | awk '{print $1}' || echo ${SERVER_IP}):8081"
echo "  API文档: http://$(hostname -I | awk '{print $1}' || echo ${SERVER_IP}):8081/doc.html"
echo ""
echo "管理命令:"
echo "  查看日志: cd ${PROJECT_ROOT}/deploy && ./logs.sh"
echo "  停止服务: cd ${PROJECT_ROOT}/deploy && ./stop.sh"
echo "  重启服务: docker-compose -f ${PROJECT_ROOT}/docker-compose.prod.yml restart"
echo ""
