#!/bin/bash

# 简单修复：只更新后端代码，处理 parentId=0 的情况

set -e

echo "=== 简单修复评论功能：只更新后端代码 ==="

# 构建新的后端
cd myblog-backend
mvn clean package -DskipTests

# 上传到服务器
JAR_FILE=$(find target -name "*.jar" -not -name "*-sources.jar" -not -name "*.original" | head -n 1)
scp "$JAR_FILE" root@49.235.139.118:/app/myblog/myblog-backend/target/

# 重启后端服务
ssh root@49.235.139.118 "
    cd /app/myblog
    docker-compose -f docker-compose.prod.yml stop backend
    sleep 3
    docker-compose -f docker-compose.prod.yml build backend
    docker-compose -f docker-compose.prod.yml up -d backend
    sleep 10
    docker-compose -f docker-compose.prod.yml ps backend
"

echo ""
echo "✓ 后端服务已更新"
echo ""
echo "如果仍有问题，请在服务器上执行以下SQL："
echo "  ALTER TABLE tb_comment DROP FOREIGN KEY tb_comment_ibfk_3;"
echo ""
echo "然后测试评论功能"