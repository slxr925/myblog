#!/bin/bash

# MyBlog Local Deployment Wrapper
# A convenience script for common deployment operations

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

# Show usage
show_usage() {
    echo -e "${BLUE}MyBlog Local Deployment${NC}"
    echo ""
    echo "Usage: ./scripts/deploy.sh <command>"
    echo ""
    echo "Commands:"
    echo "  start [--rebuild]     Start the local environment"
    echo "  stop                  Stop all services"
    echo "  restart               Restart all services"
    echo "  logs [service]        View logs (backend, frontend, mysql, redis, kafka, es, all)"
    echo "  status                Show container status"
    echo "  clean                 Clean temporary files and logs"
    echo "  rebuild               Rebuild and restart all services"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy.sh start"
    echo "  ./scripts/deploy.sh start --rebuild"
    echo "  ./scripts/deploy.sh logs backend"
    echo ""
}

# Execute deployment script
run_deploy_script() {
    local script="$1"
    shift
    if [ -f "deploy/local/${script}.sh" ]; then
        chmod +x "deploy/local/${script}.sh"
        "./deploy/local/${script}.sh" "$@"
    else
        echo -e "${RED}Error: deploy/local/${script}.sh not found${NC}"
        exit 1
    fi
}

# Main command handling
case "${1:-help}" in
    start)
        echo -e "${BLUE}Starting MyBlog local environment...${NC}"
        run_deploy_script start "${@:2}"
        ;;
    stop)
        echo -e "${BLUE}Stopping MyBlog local environment...${NC}"
        run_deploy_script stop
        ;;
    restart)
        echo -e "${BLUE}Restarting MyBlog local environment...${NC}"
        docker compose restart
        echo -e "${GREEN}✓ Services restarted${NC}"
        ;;
    logs)
        SERVICE="${2:-all}"
        case "$SERVICE" in
            backend)
                docker logs --tail=100 -f myblog-backend
                ;;
            frontend)
                docker logs --tail=100 -f myblog-frontend
                ;;
            mysql)
                docker logs --tail=100 -f myblog-mysql
                ;;
            redis)
                docker logs --tail=100 -f myblog-redis
                ;;
            kafka)
                docker logs --tail=100 -f myblog-kafka
                ;;
            es|elasticsearch)
                docker logs --tail=100 -f myblog-elasticsearch
                ;;
            all)
                docker compose logs --tail=50 -f
                ;;
            *)
                echo -e "${RED}Unknown service: $SERVICE${NC}"
                echo "Available: backend, frontend, mysql, redis, kafka, es, all"
                exit 1
                ;;
        esac
        ;;
    status)
        echo -e "${BLUE}Container Status:${NC}"
        docker compose ps
        echo ""
        echo -e "${BLUE}Service URLs:${NC}"
        echo "  Frontend:   http://localhost:3000"
        echo "  Backend:    http://localhost:8081"
        echo "  API Docs:   http://localhost:8081/doc.html"
        echo "  Kafka UI:   http://localhost:8088"
        echo "  MySQL:      localhost:3307 (root/xr123321)"
        echo "  Redis:      localhost:6380"
        ;;
    clean)
        echo -e "${BLUE}Cleaning temporary files...${NC}"
        run_deploy_script cleanup
        ;;
    rebuild)
        echo -e "${BLUE}Rebuilding and restarting...${NC}"
        run_deploy_script quick-deploy --rebuild
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
