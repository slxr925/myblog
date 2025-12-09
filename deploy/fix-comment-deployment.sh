#!/bin/bash

# 评论功能修复部署脚本
# 解决生产环境评论提交时的外键约束错误

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 服务器配置
SERVER_HOST="49.235.139.118"
SERVER_USER="root"
SERVER_PATH="/app/myblog"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     评论功能修复部署脚本                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 步骤1: 检查SSH连接
echo -e "${BLUE}=== 步骤 1/4: 检查服务器连接 ===${NC}"
if ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_HOST} "echo '连接成功'" &>/dev/null; then
    echo -e "${GREEN}✓ SSH连接正常${NC}"
else
    echo -e "${RED}✗ SSH连接失败${NC}"
    exit 1
fi
echo ""

# 步骤2: 执行数据库修复
echo -e "${BLUE}=== 步骤 2/4: 修复数据库表结构 ===${NC}"
echo "执行 SQL 脚本修复 parent_id 字段..."

# 将SQL脚本复制到服务器并执行
scp deploy/fix-comment-parent-id.sql ${SERVER_USER}@${SERVER_HOST}:/tmp/
ssh ${SERVER_USER}@${SERVER_HOST} "
    mysql -h172.17.0.1 -P13306 -uroot -p\${MYSQL_PASSWORD} myblog < /tmp/fix-comment-parent-id.sql && \
    echo -e '${GREEN}数据库修复完成${NC}' || \
    (echo -e '${RED}数据库修复失败${NC}'; exit 1)
"
echo ""

# 步骤3: 重新构建并部署后端
echo -e "${BLUE}=== 步骤 3/4: 重新构建后端 ===${NC}"
cd myblog-backend
mvn clean package -DskipTests

JAR_FILE=$(find target -name "*.jar" -not -name "*-sources.jar" -not -name "*.original" | head -n 1)
if [ -z "$JAR_FILE" ]; then
    echo -e "${RED}✗ 构建失败，未找到jar文件${NC}"
    exit 1
fi

echo "上传新的后端JAR..."
scp "$JAR_FILE" ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-backend/target/

# 步骤4: 重启后端服务
echo -e "${BLUE}=== 步骤 4/4: 重启后端服务 ===${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "
    cd ${SERVER_PATH}

    # 停止后端容器
    docker-compose -f docker-compose.prod.yml stop backend

    # 等待容器完全停止
    sleep 3

    # 重新构建镜像
    docker-compose -f docker-compose.prod.yml build backend

    # 启动服务
    docker-compose -f docker-compose.prod.yml up -d backend

    # 等待服务启动
    sleep 10

    # 检查服务状态
    if docker-compose -f docker-compose.prod.yml ps | grep backend | grep 'Up'; then
        echo -e '${GREEN}✓ 后端服务重启成功${NC}'
    else
        echo -e '${RED}✗ 后端服务启动失败${NC}'
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🎉 修复部署成功！              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}修复内容：${NC}"
echo "  1. 修改了 CommentServiceImpl.java，处理 parentId=0 的情况"
echo "  2. 修复了数据库表结构，允许 parent_id 为 NULL"
echo "  3. 更新了现有数据，将 parent_id=0 改为 NULL"
echo ""
echo -e "${YELLOW}测试建议：${NC}"
echo "  1. 访问 http://49.235.139.118:3000"
echo "  2. 登录后尝试发表评论"
echo "  3. 检查是否还有外键约束错误"
echo ""