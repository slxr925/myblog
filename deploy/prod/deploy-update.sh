#!/bin/bash

# MyBlog 一键迭代部署脚本
# 用途: 本地构建 + 上传到服务器 + 自动部署
# 使用:
#   ./deploy-update.sh                # 增量部署（默认）
#   ./deploy-update.sh --full         # 全量部署
#   ./deploy-update.sh --incremental  # 显式增量部署

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 服务器配置
SERVER_HOST="49.235.139.118"
SERVER_USER="root"
SERVER_PATH="/app/myblog"

DEPLOY_MODE="incremental"
if [ "${1:-}" = "--full" ]; then
    DEPLOY_MODE="full"
elif [ "${1:-}" = "--incremental" ] || [ -z "${1:-}" ]; then
    DEPLOY_MODE="incremental"
else
    echo -e "${RED}✗ 不支持的参数: ${1}${NC}"
    echo "可选参数: --full | --incremental"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MyBlog 一键迭代部署               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}部署模式: ${DEPLOY_MODE}${NC}"
echo ""

# ============================================
# 步骤1: 检查SSH连接
# ============================================
echo -e "${BLUE}=== 步骤 1/5: 检查服务器连接 ===${NC}"
if ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_HOST} "echo '连接成功'" &>/dev/null; then
    echo -e "${GREEN}✓ SSH连接正常（已配置密钥）${NC}"
    USE_SCP=true
else
    echo -e "${YELLOW}⚠ SSH密钥未配置，将使用密码登录${NC}"
    echo -e "${YELLOW}提示: 配置SSH密钥可以免密码部署${NC}"
    USE_SCP=false
fi
echo ""

# ============================================
# 步骤2: 本地构建
# ============================================
echo -e "${BLUE}=== 步骤 2/5: 本地构建 ===${NC}"
if [ ! -f "./deploy/prod/build-local.sh" ]; then
    echo -e "${RED}✗ 找不到 deploy/prod/build-local.sh${NC}"
    exit 1
fi

chmod +x ./deploy/prod/build-local.sh
if ./deploy/prod/build-local.sh; then
    echo -e "${GREEN}✓ 本地构建成功${NC}"
else
    echo -e "${RED}✗ 本地构建失败${NC}"
    exit 1
fi
echo ""

# ============================================
# 步骤3: 上传后端JAR
# ============================================
echo -e "${BLUE}=== 步骤 3/5: 上传后端JAR ===${NC}"
JAR_FILE=$(find myblog-backend/target -name "*.jar" -not -name "*-sources.jar" -not -name "*.original" | head -n 1)
if [ -z "$JAR_FILE" ]; then
    echo -e "${RED}✗ 找不到jar文件${NC}"
    exit 1
fi

echo "上传: $JAR_FILE"
if [ "$USE_SCP" = true ]; then
    if scp "$JAR_FILE" ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-backend/target/; then
        echo -e "${GREEN}✓ 后端JAR上传成功${NC}"
    else
        echo -e "${RED}✗ 后端JAR上传失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}请手动上传: $JAR_FILE${NC}"
    echo -e "${YELLOW}到服务器路径: ${SERVER_PATH}/myblog-backend/target/${NC}"
    read -p "上传完成后按Enter继续..." 
fi
echo ""

# ============================================
# 步骤4: 上传前端dist
# ============================================
echo -e "${BLUE}=== 步骤 4/5: 上传前端dist ===${NC}"
if [ ! -d "myblog-frontend/dist" ]; then
    echo -e "${RED}✗ 找不到dist目录${NC}"
    exit 1
fi

echo "上传: myblog-frontend/dist/"
if [ "$USE_SCP" = true ]; then
    # 先清空服务器的dist目录
    ssh ${SERVER_USER}@${SERVER_HOST} "rm -rf ${SERVER_PATH}/myblog-frontend/dist/* && mkdir -p ${SERVER_PATH}/myblog-frontend/dist"
    
    # 上传新的dist
    if scp -r myblog-frontend/dist/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-frontend/dist/; then
        echo -e "${GREEN}✓ 前端dist上传成功${NC}"
    else
        echo -e "${RED}✗ 前端dist上传失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}请手动上传: myblog-frontend/dist/所有文件${NC}"
    echo -e "${YELLOW}到服务器路径: ${SERVER_PATH}/myblog-frontend/dist/${NC}"
    read -p "上传完成后按Enter继续..." 
fi
echo ""

# ============================================
# 步骤4.5: 上传部署脚本和配置
# ============================================
echo -e "${BLUE}=== 步骤 4.5: 上传部署脚本和配置 ===${NC}"

if [ "$USE_SCP" = true ]; then
    echo "上传: deploy/*.sh, docker-compose.prod.yml 和 Dockerfile.prod"
    # 确保远程目录存在
    ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}/deploy ${SERVER_PATH}/myblog-backend"
    
    # 上传脚本
    if scp deploy/prod/*.sh ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/deploy/; then
        # 添加执行权限
        ssh ${SERVER_USER}@${SERVER_HOST} "chmod +x ${SERVER_PATH}/deploy/*.sh"
        echo -e "${GREEN}✓ 部署脚本上传成功${NC}"
    else
        echo -e "${RED}✗ 部署脚本上传失败${NC}"
        exit 1
    fi
    
    # 上传docker-compose配置
    if scp docker-compose.prod.yml ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/; then
        echo -e "${GREEN}✓ docker-compose配置上传成功${NC}"
    else
        echo -e "${RED}✗ docker-compose配置上传失败${NC}"
        exit 1
    fi
    
    # 上传Dockerfile.prod
    if scp myblog-backend/Dockerfile.prod ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-backend/; then
        echo -e "${GREEN}✓ Dockerfile.prod上传成功${NC}"
    else
        echo -e "${RED}✗ Dockerfile.prod上传失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}请手动上传: deploy/*.sh, docker-compose.prod.yml 和 myblog-backend/Dockerfile.prod${NC}"
fi
echo ""

# ============================================
# 步骤5: 服务器部署
# ============================================
echo -e "${BLUE}=== 步骤 5/5: 服务器部署 ===${NC}"
if [ "$USE_SCP" = true ]; then
    echo "执行远程部署脚本..."
    if ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH}/deploy && ./quick-deploy.sh --${DEPLOY_MODE}"; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║     🎉 部署成功！                     ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${GREEN}✓ 前端访问: http://${SERVER_HOST}:3000${NC}"
        echo -e "${GREEN}✓ 后端API: http://${SERVER_HOST}:8081${NC}"
        echo ""
        echo -e "${BLUE}查看日志:${NC}"
        echo "  docker logs -f myblog-backend"
        echo "  docker logs -f myblog-frontend"
        echo ""
    else
        echo -e "${RED}✗ 部署失败${NC}"
        echo -e "${YELLOW}查看日志: ssh ${SERVER_USER}@${SERVER_HOST} 'docker logs myblog-backend'${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}请登录服务器执行部署:${NC}"
    echo "  ssh ${SERVER_USER}@${SERVER_HOST}"
    echo "  cd ${SERVER_PATH}/deploy"
    echo "  ./quick-deploy.sh --${DEPLOY_MODE}"
fi

# ============================================
# 部署信息
# ============================================
echo -e "${BLUE}部署信息:${NC}"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  JAR: $(basename $JAR_FILE)"
echo "  服务器: ${SERVER_HOST}"
echo ""

echo -e "${BLUE}💡 提示:${NC}"
echo "  - 如需回滚: cd ${SERVER_PATH}/backups && 查看备份"
echo "  - 如需配置SSH密钥: ssh-copy-id ${SERVER_USER}@${SERVER_HOST}"
echo ""
