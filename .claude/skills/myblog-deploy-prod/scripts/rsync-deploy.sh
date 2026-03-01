#!/bin/bash

# MyBlog Production Deployment via Rsync
# Faster deployment for large frontend dist updates

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Server config
SERVER_HOST="49.235.139.118"
SERVER_USER="root"
SERVER_PATH="/app/myblog"

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "${PROJECT_ROOT}"

echo -e "${BLUE}=== MyBlog Fast Deploy (Rsync) ===${NC}"
echo ""

# Build first
echo -e "${BLUE}Step 1: Building artifacts${NC}"
if [ -f "deploy/prod/build-local.sh" ]; then
    chmod +x deploy/prod/build-local.sh
    ./deploy/prod/build-local.sh
else
    echo -e "${RED}Error: deploy/prod/build-local.sh not found${NC}"
    exit 1
fi

# Upload with rsync
echo ""
echo -e "${BLUE}Step 2: Uploading artifacts (rsync)${NC}"

# Find JAR
JAR_FILE=$(find myblog-backend/target -name "*.jar" -not -name "*-sources.jar" -not -name "*.original" | head -n 1)
if [ -z "$JAR_FILE" ]; then
    echo -e "${RED}Error: No JAR file found${NC}"
    exit 1
fi

# Upload JAR
echo "Uploading JAR..."
rsync -avz --progress "$JAR_FILE" ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-backend/target/

# Upload dist with rsync (faster for incremental updates)
if [ -d "myblog-frontend/dist" ]; then
    echo "Uploading frontend dist..."
    rsync -avz --delete --progress myblog-frontend/dist/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-frontend/dist/
fi

# Deploy on server (incremental mode)
echo ""
echo -e "${BLUE}Step 3: Triggering deployment${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH}/deploy && ./quick-deploy.sh --incremental"

echo ""
echo -e "${GREEN}✓ Deployment complete${NC}"
