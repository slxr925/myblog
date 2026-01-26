# MyBlog Local Architecture

## Service Stack

The MyBlog local development environment consists of the following services:

### Application Services

| Service | Container Name | Port | Technology |
|---------|---------------|------|------------|
| Backend | myblog-backend | 8081 | Spring Boot (Java) |
| Frontend | myblog-frontend | 3000 | React + Vite |

### Infrastructure Services

| Service | Container Name | Port | Technology |
|---------|---------------|------|------------|
| MySQL | myblog-mysql | 3307 | MySQL 8.0 |
| Redis | myblog-redis | 6380 | Redis 7 |
| Kafka | myblog-kafka | 9092 (internal), 8088 (UI) | Apache Kafka + Kafka UI |
| Elasticsearch | myblog-elasticsearch | 9200 | Elasticsearch 8 |

## Docker Compose Structure

The `docker-compose.yml` file defines:
- **Networks**: All services communicate via `myblog-network`
- **Volumes**: Persistent data for MySQL, Redis, and Elasticsearch
- **Depends_on**: Backend waits for MySQL and Redis before starting
- **Health checks**: All services have health check endpoints

## Development Workflow

### Hot Reload
- **Backend**: Spring Boot DevTools automatically reloads on code changes
- **Frontend**: Vite HMR provides instant updates

### Building Images
```bash
# Build backend image
docker compose build backend

# Build frontend image
docker compose build frontend

# Build all (with no cache)
docker compose build --no-cache
```

### Service Dependencies

```
Frontend (3000)
    ↓
Backend (8081)
    ↓
MySQL (3307) + Redis (6380) + Kafka (9092) + Elasticsearch (9200)
```

## Environment Configuration

### Backend Configuration
- Active profile: `local`
- Config file: `myblog-backend/src/main/resources/application-local.yml`
- Database: MySQL at `mysql:3306` (internal Docker network)

### Frontend Configuration
- API proxy: Vite proxies `/api` to `http://localhost:8081`
- Environment: Development mode with HMR enabled

## Data Persistence

Data volumes persist across container restarts:
- `myblog-mysql-data`: MySQL database files
- `myblog-redis-data`: Redis persistence (RDB/AOF)
- `myblog-es-data`: Elasticsearch indices

To completely reset data:
```bash
docker compose down -v  # Removes volumes
```

## Troubleshooting

### Port Conflicts
If default ports conflict, modify in `docker-compose.yml`:
- MySQL: `3307:3306`
- Redis: `6380:6379`
- Backend: `8081:8081`
- Frontend: `3000:3000`

### Memory Issues
For systems with limited RAM:
1. Stop unused services
2. Reduce Elasticsearch heap size
3. Limit container memory in docker-compose.yml

### Network Issues
Services communicate using container names as hostnames:
- Backend connects to `mysql:3306`, not `localhost:3307`
- Frontend API calls use `localhost:8081` (host machine proxy)
