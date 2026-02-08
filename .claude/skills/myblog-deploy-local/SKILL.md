---
name: myblog-deploy-local
description: Local Docker deployment management for the MyBlog project. Use this skill when deploying, starting, stopping, or managing the local development environment with Docker Compose.
---

# MyBlog Local Deploy

## Overview

This skill manages the local Docker development environment for the MyBlog project. It provides convenient access to deployment scripts located in `deploy/local/` for starting, stopping, monitoring, and maintaining the complete development stack.

## Quick Reference

Use the convenience wrapper script `scripts/deploy.sh` for common operations:
```bash
./scripts/deploy.sh start [--rebuild]   # Start environment
./scripts/deploy.sh stop                # Stop all services
./scripts/deploy.sh restart             # Restart services
./scripts/deploy.sh logs [service]      # View logs (backend/frontend/mysql/redis/kafka/es/all)
./scripts/deploy.sh status              # Show container status and URLs
./scripts/deploy.sh clean               # Clean temporary files
./scripts/deploy.sh rebuild             # Rebuild and restart
```

For health checks, use `scripts/health-check.sh` to verify all services are running properly.

## Deployment Scripts

All deployment scripts are located in the `deploy/local/` directory at the project root:

### Quick Start

**Quick Deploy** - `deploy/local/quick-deploy.sh`
- Fastest way to get the development environment running
- Stops existing containers, builds images (if needed), and starts all services
- Performs health checks on MySQL, Redis, Kafka, and backend service
- Does not create deployment backups (local uses Docker volumes only)
- Usage: `./deploy/local/quick-deploy.sh [--rebuild]`
- The `--rebuild` flag forces a full rebuild without cache

**Start** - `deploy/local/start.sh`
- Starts the local Docker environment
- Rebuilds images if `--rebuild` or `-r` flag is provided
- Includes comprehensive health checks
- Usage: `./deploy/local/start.sh [--rebuild]`

### Full Deployment

**Deploy Update** - `deploy/local/deploy-update.sh`
- Complete deployment workflow: builds images then deploys
- Calls `quick-deploy.sh` after building images
- Usage: `./deploy/local/deploy-update.sh [--rebuild]`

### Management Operations

**Stop** - `deploy/local/stop.sh`
- Stops all running containers
- Optionally removes Docker volumes (prompts for confirmation)
- Usage: `./deploy/local/stop.sh`

**Logs** - `deploy/local/logs.sh`
- Interactive log viewer for all services
- Options:
  1. Backend logs
  2. Frontend logs
  3. MySQL logs
  4. Redis logs
  5. Kafka logs
  6. Elasticsearch logs
  7. All service logs
  8. Follow backend logs (real-time)
  9. Follow all logs (real-time)

**Cleanup** - `deploy/local/cleanup.sh`
- Removes temporary files, logs, and build artifacts
- Cleans up: *.log, *.rdb, *.aof, *.bak, *.tmp, .DS_Store, etc.
- Safe to run - excludes node_modules and target directories
- Usage: `./deploy/local/cleanup.sh`

## Service Access URLs

After deployment, services are accessible at:

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend (Dev) | http://localhost:3000 | - |
| Backend API | http://localhost:8081 | - |
| API Docs | http://localhost:8081/doc.html | - |
| Kafka UI | http://localhost:8088 | - |
| Elasticsearch | http://localhost:9200 | - |
| MySQL | localhost:3307 | root/xr123321 |
| Redis | localhost:6380 | - |

## Docker Commands

The deployment scripts use Docker Compose with the `docker-compose.yml` file at the project root.

Common manual operations:
```bash
# View container status
docker compose ps

# View all logs
docker compose logs

# Restart a specific service
docker compose restart backend

# Execute command in container
docker exec -it myblog-backend bash

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## Hot Reload

Both frontend and backend support hot reload during development:
- **Backend**: Code changes trigger automatic reload via Spring Boot DevTools
- **Frontend**: Vite provides instant hot module replacement (HMR)

## Troubleshooting

### Docker not running
Scripts will detect and report if Docker is not running. Start Docker Desktop before deployment.

### Port conflicts
If ports are already in use, adjust port mappings in `docker-compose.yml`.

### Service health check timeout
If backend service takes longer than expected:
- Check logs: `./deploy/local/logs.sh` (option 8 for real-time backend logs)
- Verify database connectivity
- Check for Java heap issues in backend container

### Clean restart
To start completely fresh:
```bash
./deploy/local/stop.sh    # Stop services
./deploy/local/cleanup.sh # Clean temp files
./deploy/local/quick-deploy.sh --rebuild  # Rebuild and deploy
```

## Resources

This skill includes the following bundled resources:

### Scripts

**scripts/deploy.sh**
- Convenience wrapper for common deployment operations
- Unified interface for start, stop, restart, logs, status, clean, rebuild commands
- Simplifies service-specific log viewing

**scripts/health-check.sh**
- Automated health verification for all services
- Checks Docker, containers, MySQL, Redis, Kafka, Elasticsearch, Backend, and Frontend
- Provides summary of healthy/unhealthy services

### References

**references/architecture.md**
- Detailed system architecture documentation
- Service stack overview with ports and technologies
- Docker Compose structure and service dependencies
- Data persistence and troubleshooting guide

**references/commands.md**
- Docker Compose quick reference
- Service-specific commands for MySQL, Redis, Elasticsearch
- Troubleshooting and diagnostic commands
