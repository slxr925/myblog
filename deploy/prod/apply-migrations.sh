#!/bin/bash

# 生产数据库迁移脚本
# 用途：按文件名顺序执行 myblog-backend/database/migrations 下尚未执行的 SQL
# 使用：./deploy/prod/apply-migrations.sh [ENV_FILE]

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${PROJECT_ROOT}"

MIGRATIONS_DIR="${PROJECT_ROOT}/myblog-backend/database/migrations"
MIGRATIONS_TABLE="tb_schema_migrations"
ENV_FILE="${1:-.env.prod}"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f ".env" ]; then
        ENV_FILE=".env"
    else
        echo -e "${RED}✗ 未找到环境配置文件: .env.prod 或 .env${NC}"
        exit 1
    fi
fi

source "$ENV_FILE"

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-13306}"
MYSQL_DATABASE="${MYSQL_DATABASE:-myblog}"
MYSQL_USERNAME="${MYSQL_USERNAME:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"

if [ -z "${MYSQL_PASSWORD}" ]; then
    echo -e "${RED}✗ MYSQL_PASSWORD 未配置，无法执行迁移${NC}"
    exit 1
fi

if ! command -v mysql >/dev/null 2>&1; then
    echo -e "${RED}✗ 未找到 mysql 客户端，无法执行迁移${NC}"
    exit 1
fi

if [ ! -d "${MIGRATIONS_DIR}" ]; then
    echo -e "${YELLOW}⚠ 未找到迁移目录，跳过数据库迁移: ${MIGRATIONS_DIR}${NC}"
    exit 0
fi

migration_files=()
while IFS= read -r file; do
    migration_files+=("$file")
done < <(find "${MIGRATIONS_DIR}" -maxdepth 1 -type f -name '*.sql' | sort)

if [ "${#migration_files[@]}" -eq 0 ]; then
    echo -e "${BLUE}ℹ 未发现迁移文件（*.sql），跳过数据库迁移${NC}"
    exit 0
fi

sha256_file() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | awk '{print $1}'
    else
        openssl dgst -sha256 "$1" | awk '{print $2}'
    fi
}

mysql_exec() {
    local sql="$1"
    mysql \
        -h"${MYSQL_HOST}" \
        -P"${MYSQL_PORT}" \
        -u"${MYSQL_USERNAME}" \
        -p"${MYSQL_PASSWORD}" \
        "${MYSQL_DATABASE}" \
        -N -s -e "$sql"
}

mysql_apply_file() {
    local file="$1"
    mysql \
        -h"${MYSQL_HOST}" \
        -P"${MYSQL_PORT}" \
        -u"${MYSQL_USERNAME}" \
        -p"${MYSQL_PASSWORD}" \
        "${MYSQL_DATABASE}" < "$file"
}

echo -e "${BLUE}开始执行数据库迁移（生产）...${NC}"

mysql \
    -h"${MYSQL_HOST}" \
    -P"${MYSQL_PORT}" \
    -u"${MYSQL_USERNAME}" \
    -p"${MYSQL_PASSWORD}" \
    -e "CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

mysql_exec "CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  filename VARCHAR(255) NOT NULL UNIQUE,
  checksum VARCHAR(64) NOT NULL,
  executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);"

applied_count=0
skipped_count=0

for file in "${migration_files[@]}"; do
    filename="$(basename "$file")"
    checksum="$(sha256_file "$file")"
    escaped_filename="$(printf "%s" "$filename" | sed "s/'/''/g")"

    existing_checksum="$(mysql_exec "SELECT checksum FROM ${MIGRATIONS_TABLE} WHERE filename='${escaped_filename}' LIMIT 1;" || true)"

    if [ -z "${existing_checksum}" ]; then
        echo "  执行迁移: ${filename}"
        mysql_apply_file "$file"
        mysql_exec "INSERT INTO ${MIGRATIONS_TABLE} (filename, checksum, executed_at) VALUES ('${escaped_filename}', '${checksum}', NOW());"
        applied_count=$((applied_count + 1))
        continue
    fi

    if [ "${existing_checksum}" != "${checksum}" ]; then
        echo -e "${RED}✗ 迁移文件校验失败: ${filename}${NC}"
        echo -e "${RED}  已执行版本与当前文件内容不一致。请新增迁移文件，不要修改已执行脚本。${NC}"
        exit 1
    fi

    skipped_count=$((skipped_count + 1))
done

echo -e "${GREEN}✓ 数据库迁移完成（生产）：新增 ${applied_count}，跳过 ${skipped_count}${NC}"
