#!/bin/bash

# 本地Docker环境日志查看脚本

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${PROJECT_ROOT}"

echo "==================================="
echo "MyBlog 本地环境日志"
echo "==================================="
echo ""
echo "可用选项:"
echo "  1) 后端日志"
echo "  2) 前端日志"
echo "  3) MySQL日志"
echo "  4) Redis日志"
echo "  5) Kafka日志"
echo "  6) Elasticsearch日志"
echo "  7) 所有服务日志"
echo "  8) 实时跟踪后端日志"
echo "  9) 实时跟踪所有日志"
echo ""

read -p "请选择 (1-9): " CHOICE

case $CHOICE in
    1)
        echo -e "${BLUE}=== 后端日志 ===${NC}"
        docker logs myblog-backend 2>&1 | tail -100
        ;;
    2)
        echo -e "${BLUE}=== 前端日志 ===${NC}"
        docker logs myblog-frontend 2>&1 | tail -100
        ;;
    3)
        echo -e "${BLUE}=== MySQL日志 ===${NC}"
        docker logs myblog-mysql 2>&1 | tail -100
        ;;
    4)
        echo -e "${BLUE}=== Redis日志 ===${NC}"
        docker logs myblog-redis 2>&1 | tail -100
        ;;
    5)
        echo -e "${BLUE}=== Kafka日志 ===${NC}"
        docker logs myblog-kafka 2>&1 | tail -100
        ;;
    6)
        echo -e "${BLUE}=== Elasticsearch日志 ===${NC}"
        docker logs myblog-elasticsearch 2>&1 | tail -100
        ;;
    7)
        echo -e "${BLUE}=== 所有服务日志 ===${NC}"
        docker compose -f docker-compose.yml logs --tail=50
        ;;
    8)
        echo -e "${BLUE}=== 实时跟踪后端日志 (Ctrl+C 退出) ===${NC}"
        docker logs -f myblog-backend
        ;;
    9)
        echo -e "${BLUE}=== 实时跟踪所有日志 (Ctrl+C 退出) ===${NC}"
        docker compose -f docker-compose.yml logs -f
        ;;
    *)
        echo -e "${YELLOW}无效选项${NC}"
        exit 1
        ;;
esac
