#!/bin/bash

###############################################################################
# MyBlog 项目清理脚本
# 用途：清理临时文件、日志文件、备份文件等不需要的文件
# 作者：Ryan Xu
# 日期：2025-12-31
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
resolve_project_root() {
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local root_candidate
    root_candidate="$(cd "$script_dir/../.." && pwd)"
    if [ -f "$root_candidate/docker-compose.yml" ]; then
        echo "$root_candidate"
        return
    fi
    local current="$script_dir"
    local i
    for i in 1 2 3 4 5; do
        if [ -f "$current/docker-compose.yml" ]; then
            echo "$current"
            return
        fi
        current="$(cd "$current/.." && pwd)"
    done
    echo "$root_candidate"
}

PROJECT_ROOT="$(resolve_project_root)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MyBlog 项目清理工具               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 统计清理的文件数量
CLEANED_COUNT=0

# 清理函数
cleanup_files() {
    local pattern="$1"
    local description="$2"
    
    echo -e "${YELLOW}🔍 查找${description}...${NC}"
    
    # 查找文件（排除 node_modules 和 target 目录）
    files=$(find . -name "$pattern" -type f \
        ! -path "*/node_modules/*" \
        ! -path "*/target/*" \
        ! -path "*/.git/*" \
        ! -path "*/.idea/*" 2>/dev/null || true)
    
    if [ -n "$files" ]; then
        count=$(echo "$files" | wc -l | tr -d ' ')
        echo "$files" | while read -r file; do
            echo "  删除: $file"
            rm -f "$file"
        done
        CLEANED_COUNT=$((CLEANED_COUNT + count))
        echo -e "${GREEN}✓ 已清理 $count 个文件${NC}"
    else
        echo -e "${GREEN}✓ 未找到需要清理的文件${NC}"
    fi
    echo ""
}

# 清理目录
cleanup_directory() {
    local dir="$1"
    local description="$2"
    
    if [ -d "$dir" ]; then
        echo -e "${YELLOW}🔍 清理${description}: $dir${NC}"
        size=$(du -sh "$dir" 2>/dev/null | cut -f1 || echo "0")
        rm -rf "$dir"
        echo -e "${GREEN}✓ 已清理 $description ($size)${NC}"
        CLEANED_COUNT=$((CLEANED_COUNT + 1))
    fi
    echo ""
}

echo -e "${BLUE}=== 步骤 1/6: 清理日志文件 ===${NC}"
cleanup_files "*.log" "日志文件"

echo -e "${BLUE}=== 步骤 2/6: 清理 Redis 数据文件 ===${NC}"
cleanup_files "*.rdb" "Redis数据文件"
cleanup_files "*.aof" "Redis AOF文件"

echo -e "${BLUE}=== 步骤 3/6: 清理备份文件 ===${NC}"
cleanup_files "*.bak" "备份文件"
cleanup_files "*.tmp" "临时文件"
cleanup_files "*~" "编辑器临时文件"
cleanup_files "*.swp" "Vim临时文件"
cleanup_files "*.swo" "Vim临时文件"

echo -e "${BLUE}=== 步骤 4/6: 清理系统文件 ===${NC}"
cleanup_files ".DS_Store" "macOS系统文件"
cleanup_files "Thumbs.db" "Windows缩略图"
cleanup_files "Desktop.ini" "Windows桌面配置"

echo -e "${BLUE}=== 步骤 5/6: 清理构建信息 ===${NC}"
if [ -f "build-info.txt" ]; then
    echo -e "${YELLOW}🔍 查找构建信息文件...${NC}"
    echo "  删除: build-info.txt"
    rm -f build-info.txt
    CLEANED_COUNT=$((CLEANED_COUNT + 1))
    echo -e "${GREEN}✓ 已清理构建信息文件${NC}"
else
    echo -e "${GREEN}✓ 未找到构建信息文件${NC}"
fi
echo ""

echo -e "${BLUE}=== 步骤 6/6: 清理前端测试结果 ===${NC}"
cleanup_directory "myblog-frontend/test-results" "Playwright测试结果"

# 显示摘要
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     清理完成                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ 总共清理了 $CLEANED_COUNT 个项目${NC}"
echo ""

# 显示当前 git 状态
echo -e "${BLUE}=== Git 状态检查 ===${NC}"
echo ""
git status --short
echo ""

# 显示被忽略的重要文件
echo -e "${BLUE}=== 已忽略的敏感文件（不会被提交）===${NC}"
echo ""
git status --ignored --short | grep -E '\\.env|application-local|dump\\.rdb|\\*\\.log' || echo "无"
echo ""

echo -e "${YELLOW}💡 提示：${NC}"
echo "  - 所有临时文件和日志已清理"
echo "  - 敏感配置文件（如 .env.prod）已在 .gitignore 中配置"
echo "  - 您可以安全地提交代码了"
echo ""
echo -e "${GREEN}使用 'git status' 查看详细状态${NC}"
