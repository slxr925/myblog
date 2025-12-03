#!/bin/bash

# 服务器初始化脚本
# 用途：在服务器上安装Docker和配置环境

set -e

echo "==================================="
echo "MyBlog 服务器环境配置脚本"
echo "==================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户或 sudo 运行此脚本${NC}"
    exit 1
fi

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    echo -e "${RED}无法检测操作系统${NC}"
    exit 1
fi

echo "检测到操作系统: $OS $VERSION"

# 1. 安装Docker
echo ""
echo "=== 步骤 1: 安装 Docker ==="
if command -v docker &> /dev/null; then
    echo -e "${GREEN}Docker 已安装，版本: $(docker --version)${NC}"
else
    echo "正在安装 Docker..."
    
    # 安装依赖
    yum install -y yum-utils device-mapper-persistent-data lvm2
    
    # 添加Docker仓库
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    
    # 安装Docker
    yum install -y docker-ce docker-ce-cli containerd.io
    
    # 启动Docker
    systemctl start docker
    systemctl enable docker
    
    echo -e "${GREEN}Docker 安装完成!${NC}"
fi

# 2. 安装Docker Compose
echo ""
echo "=== 步骤 2: 安装 Docker Compose ==="
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}Docker Compose 已安装，版本: $(docker-compose --version)${NC}"
else
    echo "正在安装 Docker Compose..."
    
    # 下载最新版本
    DOCKER_COMPOSE_VERSION="v2.24.0"
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # 添加执行权限
    chmod +x /usr/local/bin/docker-compose
    
    # 创建软链接
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    echo -e "${GREEN}Docker Compose 安装完成!${NC}"
fi

# 3. 配置防火墙
echo ""
echo "=== 步骤 3: 配置防火墙 ==="
if command -v firewall-cmd &> /dev/null; then
    echo "正在配置防火墙规则..."
    
    # 开放端口
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=8081/tcp
    firewall-cmd --permanent --add-port=3000/tcp
    
    # 重载防火墙
    firewall-cmd --reload
    
    echo -e "${GREEN}防火墙配置完成${NC}"
else
    echo -e "${YELLOW}未检测到 firewalld，跳过防火墙配置${NC}"
    echo "请手动确保以下端口开放: 80, 8081, 3000"
fi

# 4. 创建应用目录
echo ""
echo "=== 步骤 4: 创建应用目录 ==="
APP_DIR="/app/myblog"
mkdir -p "${APP_DIR}/data/backend/logs"
mkdir -p "${APP_DIR}/data/backend/uploads"
mkdir -p "${APP_DIR}/nginx"

echo "创建目录: ${APP_DIR}"

# 5. 配置Docker日志轮转
echo ""
echo "=== 步骤 5: 配置 Docker 日志轮转 ==="
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl reload docker
echo -e "${GREEN}Docker 日志轮转配置完成${NC}"

# 6. 优化系统参数
echo ""
echo "=== 步骤 6: 优化系统参数 ==="
cat >> /etc/sysctl.conf <<EOF

# MyBlog优化参数
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 2048
vm.overcommit_memory = 1
EOF

sysctl -p
echo -e "${GREEN}系统参数优化完成${NC}"

# 7. 创建部署用户（可选）
echo ""
echo "=== 步骤 7: 配置用户权限 ==="
read -p "是否创建专用部署用户 myblog? (y/n): " CREATE_USER

if [ "$CREATE_USER" = "y" ] || [ "$CREATE_USER" = "Y" ]; then
    if id "myblog" &>/dev/null; then
        echo -e "${YELLOW}用户 myblog 已存在${NC}"
    else
        useradd -m -s /bin/bash myblog
        usermod -aG docker myblog
        echo -e "${GREEN}用户 myblog 创建完成并添加到 docker 组${NC}"
    fi
    
    chown -R myblog:myblog "${APP_DIR}"
    echo "应用目录权限已设置"
fi

# 8. 显示信息
echo ""
echo -e "${GREEN}==================================="
echo "服务器环境配置完成！"
echo "===================================${NC}"
echo ""
echo "已安装组件:"
echo "  - Docker: $(docker --version)"
echo "  - Docker Compose: $(docker-compose --version)"
echo ""
echo "应用目录: ${APP_DIR}"
echo ""
echo "下一步："
echo "  1. 将项目代码上传到服务器"
echo "  2. 配置 .env.prod 文件"
echo "  3. 运行 ./init-database.sh 初始化数据库"
echo "  4. 运行 ./deploy.sh 部署应用"
echo ""
echo -e "${YELLOW}重要提示：${NC}"
echo "  - 请确保云服务器安全组已开放 80, 8081, 3000 端口"
echo "  - 建议配置 SSH 密钥认证并禁用密码登录"

