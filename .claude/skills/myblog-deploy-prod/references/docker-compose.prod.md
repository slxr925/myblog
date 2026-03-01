# Production Docker Compose Reference

## File: docker-compose.prod.yml

This file defines the production Docker Compose configuration for MyBlog.

## Services

### Backend (myblog-backend)

**Image:** Built from `myblog-backend/Dockerfile.prod`
**Ports:** `8081:8081`
**Environment:**
- `SPRING_PROFILES_ACTIVE=prod`
- Database connection from `.env`
- JWT secret from `.env`

**Volumes:**
- `./data/backend/logs:/app/logs` - Application logs
- `./data/backend/uploads:/app/uploads` - User uploaded files

**Health Check:**
- Endpoint: `http://localhost:8081/actuator/health`
- Interval: 30s
- Timeout: 10s
- Retries: 3

**Depends On:**
- mysql (with health check)

### Frontend (myblog-frontend)

**Image:** Built from `myblog-frontend/Dockerfile`
**Ports:** `3000:80`
**Notes:**
- Serves static files with nginx
- No hot reload in production

**Depends On:**
- backend

### MySQL (myblog-mysql)

**Image:** `mysql:8.0`
**Ports:** `13306:3306`
**Environment:**
- `MYSQL_ROOT_PASSWORD` from `.env`
- `MYSQL_DATABASE=myblog`

**Volumes:**
- `myblog-mysql-data:/var/lib/mysql` - Database persistence

### Redis (myblog-redis)

**Image:** `redis:7-alpine`
**Ports:** `16379:6379`
**Volumes:**
- `myblog-redis-data:/data` - Redis persistence

## Networks

**myblog-network:**
- All services connect to this network
- Internal communication uses service names as hostnames
  - Backend connects to `mysql:3306` and `redis:6379`
  - Frontend proxy to `backend:8081`

## Volumes

Named volumes for data persistence:
- `myblog-mysql-data` - MySQL database files
- `myblog-redis-data` - Redis snapshot files

## Environment Variables

Required in `.env.prod`:

```bash
# MySQL
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=myblog

# JWT
JWT_SECRET=your_jwt_secret_key

# Application
SERVER_PORT=8081

# Upload limits
MAX_FILE_SIZE=10MB
```

## Build Configuration

**Backend:**
- Multi-stage build
- Stage 1: Maven build
- Stage 2: Runtime with JRE only
- Result: Smaller image size

**Frontend:**
- Multi-stage build
- Stage 1: Node.js build
- Stage 2: nginx static file serving
- Result: Optimized for serving static files

## Production Optimizations

1. **No Hot Reload:** Code changes require redeployment
2. **Resource Limits:** Consider adding CPU/memory limits
3. **Health Checks:** All services have health check endpoints
4. **Log Aggregation:** Logs mounted to host for collection
5. **Static Compression:** nginx handles gzip compression

## Common Commands

```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Incremental deploy on server (recommended for routine updates)
cd /app/myblog/deploy && ./quick-deploy.sh --incremental

# Full deploy on server (when infra needs reset)
cd /app/myblog/deploy && ./quick-deploy.sh --full

# Stop services
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs myblog-backend

# Check if port is in use
netstat -tulpn | grep 8081
```

### Database Connection Issues
```bash
# Verify MySQL is running
docker ps | grep mysql

# Test MySQL connection
docker exec -it myblog-mysql mysql -uroot -p
```

### Out of Disk Space
```bash
# Check disk usage
df -h

# Clean up unused Docker resources
docker system prune -a
```
