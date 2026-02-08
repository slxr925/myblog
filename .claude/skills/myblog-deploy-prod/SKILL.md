---
name: myblog-deploy-prod
description: Production deployment management for the MyBlog project. Use this skill when deploying to production server, building release artifacts, uploading to server, or managing production environment.
---

# MyBlog Production Deploy

## Overview

This skill manages the production deployment workflow for the MyBlog project. It handles local builds, artifact uploads, server deployment, database initialization, backups, and production environment management.

## Quick Reference

Use the convenience wrapper script `scripts/deploy-prod.sh` for common operations:
```bash
./scripts/deploy-prod.sh init           # First-time setup (new server)
./scripts/deploy-prod.sh deploy         # Update deployment (existing server)
./scripts/deploy-prod.sh build          # Build release artifacts locally
./scripts/deploy-prod.sh upload         # Upload artifacts to server
./scripts/deploy-prod.sh server-deploy  # Deploy on server only
./scripts/deploy-prod.sh backup         # Backup database and files
./scripts/deploy-prod.sh init-db        # Initialize database on server
./scripts/deploy-prod.sh logs           # View production logs
./scripts/deploy-prod.sh status         # Check production status
```

**Deployment Types:**
- **First-time setup**: Use `init` command for new servers
- **Update deployment**: Use `deploy` command for existing deployments

## Production Deployment Scripts

All production deployment scripts are located in the `deploy/prod/` directory at the project root:

### Build & Deploy Workflow

**Deploy Update** - `deploy/prod/deploy-update.sh`
- Complete one-command deployment: local build → upload → server deploy
- Checks SSH connection, builds artifacts, uploads to server, triggers deployment
- Supports both SSH key and password authentication
- Automatically uploads deployment scripts and configurations
- Usage: `./deploy/prod/deploy-update.sh`

**Build Local** - `deploy/prod/build-local.sh`
- Builds backend JAR and frontend dist artifacts
- Generates build-info.txt with version, git commit, and timestamp
- Skips tests for faster builds
- Usage: `./deploy/prod/build-local.sh`

### Server-Side Deployment

**Quick Deploy** - `deploy/prod/quick-deploy.sh`
- Server-side deployment script (run on production server)
- Checks environment, validates artifacts, builds Docker images
- Performs health checks with automatic rollback on failure
- Cleans up deployment backups older than 3 days after a successful deploy
- Usage (on server): `cd /app/myblog/deploy && ./quick-deploy.sh`

### Management Operations

**Stop** - `deploy/prod/stop.sh`
- Stops all production containers
- Optionally removes Docker volumes
- Usage (on server): `cd /app/myblog/deploy && ./stop.sh`

**Backup** - `deploy/prod/backup.sh`
- Backs up MySQL database and uploaded files
- Creates compressed backups with timestamp
- Automatically cleans up backups older than 7 days
- Usage (on server): `cd /app/myblog/deploy && ./backup.sh`

**Init Database** - `deploy/prod/init-database.sh`
- Initializes MySQL database on production server
- Creates database schema and executes migrations
- Sets up performance indexes
- Usage (on server): `cd /app/myblog/deploy && ./init-database.sh`

**Logs** - `deploy/prod/logs.sh`
- Interactive log viewer for production services
- Real-time log following available

## Server Configuration

**Production Server:**
- Host: `49.235.139.118`
- User: `root`
- Path: `/app/myblog`

**Environment Variables** (`.env.prod`):
```bash
MYSQL_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
# ... other configuration
```

## Service Access URLs (Production)

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://49.235.139.118:3000 | Production frontend |
| Backend API | http://49.235.139.118:8081 | Production API |
| API Docs | http://49.235.139.118:8081/doc.html | Swagger documentation |

## Deployment Workflow

### First-Time Setup (New Server)

Use this for initial deployment to a new server:

```bash
./scripts/deploy-prod.sh init
```

This interactive command will:
1. Check server connection
2. Create directory structure
3. Upload configuration files (`.env.prod`, `docker-compose.prod.yml`)
4. Upload deployment scripts
5. Upload Dockerfiles
6. Optionally initialize database
7. Optionally build and deploy application

**Manual first-time setup** (if you prefer full control):
```bash
# 1. SSH to server and create directories
ssh root@49.235.139.118
mkdir -p /app/myblog/{deploy,myblog-backend/target,myblog-frontend/dist,data/{backend/{logs,uploads},backups}}

# 2. Upload config and scripts
scp .env.prod docker-compose.prod.yml root@49.235.139.118:/app/myblog/
scp deploy/prod/*.sh root@49.235.139.118:/app/myblog/deploy/
scp myblog-backend/Dockerfile.prod root@49.235.139.118:/app/myblog/myblog-backend/

# 3. Initialize database
ssh root@49.235.139.118 "cd /app/myblog/deploy && ./init-database.sh"

# 4. Deploy application
./scripts/deploy-prod.sh deploy
```

### Update Deployment (Existing Server)

Use this for deploying updates to an already-running server:

```bash
./scripts/deploy-prod.sh deploy
```

This is equivalent to the original `deploy-update.sh` workflow.

### Full Deployment (Recommended)
```bash
# From local machine
./deploy/prod/deploy-update.sh
```

This executes:
1. Checks SSH connection
2. Builds artifacts locally (`build-local.sh`)
3. Uploads JAR to server
4. Uploads frontend dist to server
5. Uploads deployment scripts and configs
6. Triggers server deployment (`quick-deploy.sh`)

### Manual Deployment Steps

If you need more control:

```bash
# 1. Build locally
./deploy/prod/build-local.sh

# 2. Upload artifacts manually
scp myblog-backend/target/*.jar root@49.235.139.118:/app/myblog/myblog-backend/target/
scp -r myblog-frontend/dist/* root@49.235.139.118:/app/myblog/myblog-frontend/dist/

# 3. SSH to server and deploy
ssh root@49.235.139.118
cd /app/myblog/deploy
./quick-deploy.sh
```

## Docker Compose Production

Production uses `docker-compose.prod.yml` with optimized configurations:
- Multi-stage builds for smaller images
- Production-ready settings (no hot reload)
- Persistent volumes for data
- Health checks enabled

## SSH Key Setup (Recommended)

For passwordless deployment:
```bash
ssh-copy-id root@49.235.139.118
```

## Troubleshooting

### Deployment Failures
- Check logs on server: `docker logs myblog-backend`
- Verify artifacts uploaded: `ls -la /app/myblog/myblog-backend/target/`
- Check environment variables: `cat /app/myblog/.env`

### Health Check Timeout
- Backend may need more time to start (Java applications)
- Check database connectivity
- Verify sufficient disk space and memory

### Rollback
If deployment fails, automatic rollback attempts to restore the previous JAR from `backups/` directory.

Manual rollback:
```bash
# On server
cd /app/myblog/backups
ls -la  # Find backup version
cp backup-YYYYMMDD-HHMMSS/myblog-backend.jar ../myblog-backend/target/
docker-compose -f docker-compose.prod.yml restart backend
```

## Backup Strategy

Automated backups are created before each deployment in `backups/backup-YYYYMMDD-HHMMSS/`:
- Previous JAR file
- Database dumps (run manually with `backup.sh`)
- Uploaded files (run manually with `backup.sh`)

Regular backup maintenance:
```bash
# On server
cd /app/myblog/deploy
./backup.sh  # Creates DB and file backups
```

## Resources

This skill includes the following bundled resources:

### Scripts

**scripts/deploy-prod.sh**
- Convenience wrapper for production deployment operations
- Unified interface for build, deploy, upload, backup, logs, status commands
- Simplifies the complete deployment workflow

**scripts/rsync-deploy.sh**
- Alternative deployment using rsync for faster file transfers
- Useful for large frontend dist updates

### References

**references/production-checklist.md**
- Pre-deployment checklist
- Environment verification steps
- Post-deployment verification

**references/docker-compose.prod.md**
- Production Docker Compose configuration reference
- Service definitions and environment variables
- Volume mappings and networking

**references/troubleshooting.md**
- Common production issues and solutions
- Log locations and diagnostic commands
- Performance tuning tips
