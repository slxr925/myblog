# Docker Compose Quick Reference

## Essential Commands

### Lifecycle
```bash
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose restart            # Restart services
docker compose ps                 # List running containers
```

### Building
```bash
docker compose build              # Build images
docker compose build --no-cache   # Build without cache
docker compose up -d --build      # Build and start
docker compose up -d --build backend frontend  # Incremental app-only deploy
```

### Deployment Scripts
```bash
./deploy/local/deploy-update.sh               # Incremental deploy (default)
./deploy/local/deploy-update.sh --rebuild     # Full rebuild deploy
./deploy/local/quick-deploy.sh --incremental  # App-only incremental deploy
./deploy/local/apply-migrations.sh            # Apply pending DB migrations
```

### Logs
```bash
docker compose logs               # All logs
docker compose logs -f            # Follow logs
docker compose logs --tail=100    # Last 100 lines
docker compose logs backend       # Specific service
```

### Execution
```bash
docker exec -it myblog-backend bash        # Enter container
docker exec myblog-mysql mysql -uroot -pxr123321  # MySQL CLI
docker exec myblog-redis redis-cli         # Redis CLI
```

### Cleanup
```bash
docker compose down -v             # Stop and remove volumes
docker system prune -a            # Remove all unused data
```

## Service-Specific Commands

### MySQL
```bash
# Connect to MySQL
docker exec -it myblog-mysql mysql -uroot -pxr123321

# Backup database
docker exec myblog-mysql mysqldump -uroot -pxr123321 myblog > backup.sql

# Restore database
docker exec -i myblog-mysql mysql -uroot -pxr123321 myblog < backup.sql
```

### Redis
```bash
# Connect to Redis
docker exec -it myblog-redis redis-cli

# Flush all data
docker exec myblog-redis redis-cli FLUSHALL
```

### Backend
```bash
# View real-time logs
docker logs -f myblog-backend

# Restart backend only
docker compose restart backend

# Rebuild and restart backend
docker compose up -d --build backend
```

### Elasticsearch
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health

# List indices
curl http://localhost:9200/_cat/indices?v

# Search all documents
curl http://localhost:9200/_search?q=*
```

## Troubleshooting Commands

```bash
# Check container resource usage
docker stats

# Inspect container details
docker inspect myblog-backend

# View container processes
docker top myblog-backend

# Copy file from container
docker cp myblog-backend:/app/logs/debug.log ./debug.log

# Check Docker networks
docker network ls
docker network inspect myblog-network
```
