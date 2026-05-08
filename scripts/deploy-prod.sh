#!/bin/bash

# MyBlog Production Deployment Wrapper
# A convenience script for common production deployment operations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

# Server config
SERVER_HOST="49.235.139.118"
SERVER_USER="root"
SERVER_PATH="/app/myblog"

# First-time setup
cmd_init() {
    echo -e "${BLUE}=== MyBlog First-Time Setup ===${NC}"
    echo ""
    echo -e "${YELLOW}This will set up the production environment for the first time.${NC}"
    echo -e "${YELLOW}Steps:${NC}"
    echo "  1. Check server connection"
    echo "  2. Create directory structure"
    echo "  3. Upload configuration files"
    echo "  4. Upload deployment scripts"
    echo "  5. Initialize database"
    echo "  6. Build and deploy application"
    echo ""
    read -p "Continue? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        echo "Aborted."
        exit 0
    fi

    # 1. Check connection
    echo ""
    echo -e "${BLUE}Step 1: Checking server connection...${NC}"
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_HOST} "echo 'Connected'" &>/dev/null; then
        echo -e "${YELLOW}⚠ SSH key not configured. Will use password authentication.${NC}"
    else
        echo -e "${GREEN}✓ SSH connection OK${NC}"
    fi

    # 2. Create directory structure
    echo ""
    echo -e "${BLUE}Step 2: Creating directory structure...${NC}"
    ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}/{deploy,myblog-backend/target,myblog-frontend/dist,data/{backend/{logs,uploads},backups}}"
    echo -e "${GREEN}✓ Directories created${NC}"

    # 3. Upload configuration files
    echo ""
    echo -e "${BLUE}Step 3: Uploading configuration files...${NC}"
    if [ -f "docker-compose.prod.yml" ]; then
        scp docker-compose.prod.yml ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/
        echo -e "${GREEN}✓ docker-compose.prod.yml uploaded${NC}"
    fi

    if [ -f ".env.prod" ]; then
        scp .env.prod ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/
        ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH} && cp .env.prod .env"
        echo -e "${GREEN}✓ Environment files uploaded${NC}"
    else
        echo -e "${YELLOW}⚠ .env.prod not found. Please create it manually.${NC}"
    fi

    # 4. Upload deployment scripts
    echo ""
    echo -e "${BLUE}Step 4: Uploading deployment scripts...${NC}"
    if [ -d "deploy/prod" ]; then
        scp deploy/prod/*.sh ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/deploy/
        ssh ${SERVER_USER}@${SERVER_HOST} "chmod +x ${SERVER_PATH}/deploy/*.sh"
        echo -e "${GREEN}✓ Deployment scripts uploaded${NC}"
    fi

    # 5. Upload Dockerfiles
    echo ""
    echo -e "${BLUE}Step 5: Uploading Dockerfiles...${NC}"
    if [ -f "myblog-backend/Dockerfile.prod" ]; then
        scp myblog-backend/Dockerfile.prod ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-backend/Dockerfile.prod
        echo -e "${GREEN}✓ Backend Dockerfile uploaded${NC}"
    fi
    if [ -f "myblog-frontend/Dockerfile" ]; then
        scp myblog-frontend/Dockerfile ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-frontend/Dockerfile
        echo -e "${GREEN}✓ Frontend Dockerfile uploaded${NC}"
    fi

    # 6. Initialize database
    echo ""
    echo -e "${BLUE}Step 6: Initialize database?${NC}"
    read -p "Initialize database now? (y/n): " INIT_DB
    if [ "$INIT_DB" = "y" ]; then
        cmd_init_db
    else
        echo -e "${YELLOW}Skip database initialization. Run 'init-db' command later.${NC}"
    fi

    # 7. Build and deploy
    echo ""
    echo -e "${BLUE}Step 7: Build and deploy application?${NC}"
    read -p "Build and deploy now? (y/n): " BUILD_DEPLOY
    if [ "$BUILD_DEPLOY" = "y" ]; then
        cmd_build
        cmd_upload
        cmd_server_deploy
    else
        echo -e "${YELLOW}Skip deployment. Run 'deploy' command later.${NC}"
    fi

    echo ""
    echo -e "${GREEN}=== First-time setup complete! ===${NC}"
    echo ""
    echo "Next steps:"
    echo "  - If database not initialized: ./scripts/deploy-prod.sh init-db"
    echo "  - If not deployed: ./scripts/deploy-prod.sh deploy"
    echo "  - Check status: ./scripts/deploy-prod.sh status"
    echo ""
}

# Show usage
show_usage() {
    echo -e "${BLUE}MyBlog Production Deployment${NC}"
    echo ""
    echo "Usage: ./scripts/deploy-prod.sh <command>"
    echo ""
    echo "Commands:"
    echo "  init           First-time setup (creates directories, uploads config, initializes DB)"
    echo "  deploy [mode]  Update deployment (build + upload + deploy to existing environment)"
    echo "  build          Build release artifacts locally"
    echo "  upload         Upload artifacts to server"
    echo "  server-deploy  Deploy on server only"
    echo "  backup         Backup database and files on server"
    echo "  init-db        Initialize database on server"
    echo "  logs           View production logs"
    echo "  status         Check production status"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy-prod.sh init      # First-time setup"
    echo "  ./scripts/deploy-prod.sh deploy                # Incremental deploy (default)"
    echo "  ./scripts/deploy-prod.sh deploy --full         # Full deploy"
    echo "  ./scripts/deploy-prod.sh backup"
    echo ""
}

# Build artifacts locally
cmd_build() {
    echo -e "${BLUE}Building release artifacts...${NC}"
    if [ -f "deploy/prod/build-local.sh" ]; then
        chmod +x deploy/prod/build-local.sh
        ./deploy/prod/build-local.sh
    else
        echo -e "${RED}Error: deploy/prod/build-local.sh not found${NC}"
        exit 1
    fi
}

# Full deployment
cmd_deploy() {
    local deploy_mode="${1:-}"
    echo -e "${BLUE}Starting full deployment...${NC}"
    if [ -f "deploy/prod/deploy-update.sh" ]; then
        chmod +x deploy/prod/deploy-update.sh
        if [ -n "$deploy_mode" ]; then
            ./deploy/prod/deploy-update.sh "$deploy_mode"
        else
            ./deploy/prod/deploy-update.sh
        fi
    else
        echo -e "${RED}Error: deploy/prod/deploy-update.sh not found${NC}"
        exit 1
    fi
}

# Upload artifacts
cmd_upload() {
    echo -e "${BLUE}Uploading artifacts to server...${NC}"

    # Find JAR
    JAR_FILE=$(find myblog-backend/target -name "*.jar" -not -name "*-sources.jar" -not -name "*.original" | head -n 1)
    if [ -z "$JAR_FILE" ]; then
        echo -e "${RED}Error: No JAR file found. Run 'build' first.${NC}"
        exit 1
    fi

    echo "Uploading JAR: $JAR_FILE"
    scp "$JAR_FILE" ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-backend/target/

    # Upload dist
    if [ -d "myblog-frontend/dist" ]; then
        echo "Uploading frontend dist..."
        ssh ${SERVER_USER}@${SERVER_HOST} "rm -rf ${SERVER_PATH}/myblog-frontend/dist/* && mkdir -p ${SERVER_PATH}/myblog-frontend/dist"
        scp -r myblog-frontend/dist/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-frontend/dist/
    else
        echo -e "${YELLOW}Warning: myblog-frontend/dist not found${NC}"
    fi

    if [ -d "myblog-backend/database/migrations" ]; then
        echo "Uploading database migrations..."
        ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}/myblog-backend/database/migrations"
        scp myblog-backend/database/migrations/*.sql ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/myblog-backend/database/migrations/
    fi

    echo -e "${GREEN}✓ Upload complete${NC}"
}

# Deploy on server
cmd_server_deploy() {
    echo -e "${BLUE}Triggering server deployment...${NC}"
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH}/deploy && ./quick-deploy.sh"
}

# Backup on server
cmd_backup() {
    echo -e "${BLUE}Creating backup on server...${NC}"
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH}/deploy && ./backup.sh"
}

# Initialize database
cmd_init_db() {
    echo -e "${YELLOW}Warning: This will initialize the database. Continue? (y/n)${NC}"
    read -r CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        echo "Aborted."
        exit 0
    fi

    echo -e "${BLUE}Initializing database on server...${NC}"
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH}/deploy && ./init-database.sh"
}

# View logs
cmd_logs() {
    echo -e "${BLUE}Fetching production logs...${NC}"
    echo ""
    echo "=== Backend Logs (last 50 lines) ==="
    ssh ${SERVER_USER}@${SERVER_HOST} "docker logs --tail=50 myblog-backend"
    echo ""
    echo "=== Frontend Logs (last 50 lines) ==="
    ssh ${SERVER_USER}@${SERVER_HOST} "docker logs --tail=50 myblog-frontend"
}

# Check status
cmd_status() {
    echo -e "${BLUE}Production Status${NC}"
    echo ""
    echo "=== Container Status ==="
    ssh ${SERVER_USER}@${SERVER_HOST} "docker ps -f name=myblog"
    echo ""
    echo "=== Service URLs ==="
    echo "  Frontend: http://${SERVER_HOST}:3000"
    echo "  Backend:  http://${SERVER_HOST}:8081"
    echo "  API Docs: http://${SERVER_HOST}:8081/doc.html"
}

# Main command handling
case "${1:-help}" in
    init)
        cmd_init
        ;;
    build)
        cmd_build
        ;;
    deploy)
        cmd_deploy "${2:-}"
        ;;
    upload)
        cmd_upload
        ;;
    server-deploy)
        cmd_server_deploy
        ;;
    backup)
        cmd_backup
        ;;
    init-db)
        cmd_init_db
        ;;
    logs)
        cmd_logs
        ;;
    status)
        cmd_status
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac
