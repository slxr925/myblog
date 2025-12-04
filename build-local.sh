#!/bin/bash

# 本地构建脚本 - 构建前后端应用
# 用途：在本地机器上构建jar包和前端dist

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "==================================="
echo "MyBlog 本地构建脚本"
echo "==================================="

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "${PROJECT_ROOT}"

# 生成版本信息
VERSION=$(date +%Y%m%d-%H%M%S)
echo "构建版本: ${VERSION}"

# 1. 构建后端
echo ""
echo -e "${BLUE}=== 步骤 1: 构建后端 Java 应用 ===${NC}"
cd "${PROJECT_ROOT}/myblog-backend"

if [ ! -f "pom.xml" ]; then
    echo -e "${RED}错误: 未找到 pom.xml 文件${NC}"
    exit 1
fi

echo "正在执行 Maven 构建..."
mvn clean package -DskipTests

# 验证jar包
JAR_FILE=$(find target -name "*.jar" -not -name "*-sources.jar" | head -n 1)
if [ -z "$JAR_FILE" ]; then
    echo -e "${RED}错误: Maven 构建失败，未找到jar文件${NC}"
    exit 1
fi

JAR_SIZE=$(du -h "$JAR_FILE" | cut -f1)
echo -e "${GREEN}✓ 后端构建成功${NC}"
echo "  JAR文件: $JAR_FILE"
echo "  文件大小: $JAR_SIZE"

# 2. 构建前端
echo ""
echo -e "${BLUE}=== 步骤 2: 构建前端应用 ===${NC}"
cd "${PROJECT_ROOT}/myblog-frontend"

if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 未找到 package.json 文件${NC}"
    exit 1
fi

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}未找到 node_modules，正在安装依赖...${NC}"
    npm install
fi

echo "正在执行前端构建..."
npm run build

# 验证dist目录
if [ ! -d "dist" ]; then
    echo -e "${RED}错误: 前端构建失败，未找到dist目录${NC}"
    exit 1
fi

DIST_SIZE=$(du -sh dist | cut -f1)
echo -e "${GREEN}✓ 前端构建成功${NC}"
echo "  Dist目录: dist/"
echo "  目录大小: $DIST_SIZE"

# 3. 生成版本信息文件
echo ""
echo -e "${BLUE}=== 步骤 3: 生成版本信息 ===${NC}"
cd "${PROJECT_ROOT}"

cat > build-info.txt << EOF
构建版本: ${VERSION}
构建时间: $(date '+%Y-%m-%d %H:%M:%S')
构建机器: $(hostname)
Git分支: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
Git提交: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
后端JAR: ${JAR_FILE}
前端Dist: myblog-frontend/dist
EOF

cat build-info.txt

# 4. 完成
echo ""
echo -e "${GREEN}==================================="
echo "构建完成！"
echo "===================================${NC}"
echo ""
echo "构建产物："
echo "  后端: myblog-backend/target/*.jar"
echo "  前端: myblog-frontend/dist/"
echo "  版本信息: build-info.txt"
echo ""
echo "下一步："
echo "  1. 手动上传jar到服务器: /app/myblog/myblog-backend/target/"
echo "  2. 手动上传dist到服务器: /app/myblog/myblog-frontend/"
echo "  3. 服务器执行: cd /app/myblog/deploy && ./quick-deploy.sh"
echo ""

