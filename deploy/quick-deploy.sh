#!/bin/bash

# 快速部署脚本 - 适用于首次部署
# 将所有步骤整合在一起

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "==================================="
echo "MyBlog 快速部署向导"
echo "==================================="
echo ""

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_ROOT}"

# 步骤1: 检查环境
echo -e "${BLUE}步骤 1/5: 检查环境${NC}"
echo "检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker 未安装！${NC}"
    echo "请先运行: sudo ./server-setup.sh"
    exit 1
fi
echo -e "${GREEN}✓ Docker 已安装${NC}"

echo "检查 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose 未安装！${NC}"
    echo "请先运行: sudo ./server-setup.sh"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose 已安装${NC}"

# 步骤2: 配置环境变量
echo ""
echo -e "${BLUE}步骤 2/5: 配置环境变量${NC}"
if [ ! -f ".env.prod" ]; then
    echo -e "${YELLOW}未找到 .env.prod 文件${NC}"
    echo "正在从模板创建..."
    cp .env.prod.template .env.prod
    
    echo ""
    echo -e "${YELLOW}请编辑 .env.prod 文件，配置以下必需参数：${NC}"
    echo "  1. MYSQL_PASSWORD - MySQL数据库密码"
    echo "  2. JWT_SECRET - JWT密钥（至少32位）"
    echo "  3. REDIS_PASSWORD - Redis密码（如果设置了）"
    echo ""
    read -p "按回车键继续编辑 .env.prod 文件..."
    vi .env.prod
else
    echo -e "${GREEN}✓ .env.prod 文件已存在${NC}"
fi

# 加载环境变量
source .env.prod

# 验证必需变量
if [ -z "$MYSQL_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}错误: MYSQL_PASSWORD 或 JWT_SECRET 未配置${NC}"
    exit 1
fi

# 步骤3: 初始化数据库
echo ""
echo -e "${BLUE}步骤 3/5: 初始化数据库${NC}"
read -p "是否需要初始化数据库? (y/n): " INIT_DB

if [ "$INIT_DB" = "y" ] || [ "$INIT_DB" = "Y" ]; then
    cd deploy
    ./init-database.sh
    cd "${PROJECT_ROOT}"
else
    echo -e "${YELLOW}跳过数据库初始化${NC}"
fi

# 步骤4: 部署应用
echo ""
echo -e "${BLUE}步骤 4/5: 部署应用${NC}"
cd deploy
./deploy.sh
cd "${PROJECT_ROOT}"

# 步骤5: 配置Nginx
echo ""
echo -e "${BLUE}步骤 5/5: 配置 Nginx${NC}"
read -p "是否配置 Nginx 反向代理? (y/n): " CONFIG_NGINX

if [ "$CONFIG_NGINX" = "y" ] || [ "$CONFIG_NGINX" = "Y" ]; then
    echo "复制 Nginx 配置文件..."
    sudo cp nginx/myblog.conf /etc/nginx/conf.d/
    
    echo "测试 Nginx 配置..."
    if sudo nginx -t; then
        echo "重载 Nginx..."
        sudo systemctl reload nginx
        echo -e "${GREEN}✓ Nginx 配置完成${NC}"
    else
        echo -e "${RED}Nginx 配置测试失败，请检查配置文件${NC}"
    fi
else
    echo -e "${YELLOW}跳过 Nginx 配置${NC}"
    echo "稍后可手动执行:"
    echo "  sudo cp nginx/myblog.conf /etc/nginx/conf.d/"
    echo "  sudo nginx -t && sudo systemctl reload nginx"
fi

# 完成
echo ""
echo -e "${GREEN}==================================="
echo "快速部署完成！"
echo "===================================${NC}"
echo ""
echo "访问地址:"
echo "  前端: http://${SERVER_IP}"
echo "  后端API: http://${SERVER_IP}:8081"
echo "  API文档: http://${SERVER_IP}:8081/doc.html"
echo ""
echo "默认管理员账号:"
echo "  用户名: admin"
echo "  密码: admin123"
echo -e "${RED}  ⚠ 首次登录后请立即修改密码！${NC}"
echo ""
echo "有用的命令:"
echo "  查看日志: cd deploy && ./logs.sh"
echo "  停止服务: cd deploy && ./stop.sh"
echo "  数据备份: cd deploy && ./backup.sh"
echo ""
echo -e "${YELLOW}提示: 详细文档请查看 DEPLOYMENT.md${NC}"

