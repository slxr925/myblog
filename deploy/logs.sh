#!/bin/bash

# 日志查看脚本

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${PROJECT_ROOT}"

echo "==================================="
echo "MyBlog 服务日志"
echo "==================================="
echo ""
echo "可用选项:"
echo "  1) 后端日志"
echo "  2) 前端日志"
echo "  3) 所有日志"
echo "  4) 实时跟踪后端日志"
echo "  5) 实时跟踪前端日志"
echo "  6) 实时跟踪所有日志"
echo ""

read -p "请选择 (1-6): " CHOICE

case $CHOICE in
    1)
        echo -e "${BLUE}=== 后端日志 ===${NC}"
        docker logs myblog-backend
        ;;
    2)
        echo -e "${BLUE}=== 前端日志 ===${NC}"
        docker logs myblog-frontend
        ;;
    3)
        echo -e "${BLUE}=== 后端日志 ===${NC}"
        docker logs myblog-backend
        echo ""
        echo -e "${BLUE}=== 前端日志 ===${NC}"
        docker logs myblog-frontend
        ;;
    4)
        echo -e "${BLUE}=== 实时跟踪后端日志 (Ctrl+C 退出) ===${NC}"
        docker logs -f myblog-backend
        ;;
    5)
        echo -e "${BLUE}=== 实时跟踪前端日志 (Ctrl+C 退出) ===${NC}"
        docker logs -f myblog-frontend
        ;;
    6)
        echo -e "${BLUE}=== 实时跟踪所有日志 (Ctrl+C 退出) ===${NC}"
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    *)
        echo -e "${YELLOW}无效选项${NC}"
        exit 1
        ;;
esac

