# Production Troubleshooting Guide

## Quick Diagnostics

### Check All Services
```bash
ssh root@49.235.139.118
docker ps -f name=myblog
```

Expected output: All containers running and healthy

### Quick Health Check
```bash
# Backend
curl http://49.235.139.118:8081/actuator/health

# Frontend
curl -I http://49.235.139.118:3000

# MySQL
docker exec myblog-mysql mysqladmin ping -h localhost
```

## Common Issues

### Issue: Backend Container Crashes

**Symptoms:**
- Container exits repeatedly
- `docker ps` shows no backend container
- 502 errors on frontend

**Diagnosis:**
```bash
# Check logs
docker logs --tail=100 myblog-backend

# Check previous logs if container restarted
docker logs --tail=100 myblog-backend --previous
```

**Common Causes:**

1. **Database Connection Failed**
   - Check MySQL is running: `docker ps | grep mysql`
   - Verify credentials in `.env`
   - Test connection: `docker exec myblog-mysql mysql -uroot -p`

2. **Port Already in Use**
   ```bash
   # Find process using port 8081
   netstat -tulpn | grep 8081
   # Kill the process if needed
   ```

3. **Out of Memory**
   ```bash
   # Check available memory
   free -h
   # Increase Java heap in docker-compose.prod.yml if needed
   ```

4. **Missing Configuration**
   - Verify `.env.prod` exists
   - Check all required variables are set

**Solution:**
```bash
# Restart backend
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild if needed
docker-compose -f docker-compose.prod.yml up -d --build backend
```

### Issue: Frontend Shows 502 Bad Gateway

**Symptoms:**
- Frontend loads but shows 502 error
- API calls failing

**Diagnosis:**
```bash
# Check backend is running
curl http://localhost:8081/actuator/health

# Check nginx config in frontend container
docker exec myblog-frontend cat /etc/nginx/conf.d/default.conf
```

**Solution:**
- Backend is likely down - follow backend troubleshooting steps

### Issue: Database Connection Failed

**Symptoms:**
- Backend logs show "Cannot connect to database"
- Health checks fail for backend

**Diagnosis:**
```bash
# Check MySQL container
docker ps | grep mysql

# Check MySQL logs
docker logs myblog-mysql

# Test MySQL connection
docker exec -it myblog-mysql mysql -uroot -p
```

**Common Causes:**
1. MySQL not started yet (wait longer)
2. Wrong credentials in `.env`
3. MySQL needs to be initialized

**Solution:**
```bash
# If MySQL not initialized
cd /app/myblog/deploy
./init-database.sh

# Restart backend after MySQL is ready
docker-compose -f docker-compose.prod.yml restart backend
```

### Issue: Slow Performance

**Diagnosis:**
```bash
# Check server resources
free -h      # Memory
df -h        # Disk space
top          # CPU usage

# Check database performance
docker exec myblog-mysql mysql -uroot -p -e "SHOW PROCESSLIST;"
```

**Common Causes:**
1. **High Memory Usage**
   - Java heap may be too large
   - Too many services running

2. **Database Slow Queries**
   - Check slow query log
   - Verify indexes exist
   - Consider database optimization

3. **Disk Full**
   ```bash
   # Clean up old logs
   docker system prune -a

   # Clean old backups
   cd /app/myblog/backups
   find . -mtime +30 -delete
   ```

**Solution:**
- Add indexes to database
- Increase server resources
- Clean up old data/logs
- Consider caching strategy

### Issue: Deployment Failed

**Symptoms:**
- `deploy-update.sh` fails
- Upload errors
- Health check timeout

**Diagnosis:**
```bash
# Check SSH connection
ssh root@49.235.139.118 "echo 'Connection OK'"

# Check artifacts exist
ls -la myblog-backend/target/*.jar
ls -la myblog-frontend/dist/

# Check server disk space
ssh root@49.235.139.118 "df -h"
```

**Common Causes:**
1. **SSH Connection Failed**
   - Check network connectivity
   - Verify SSH key or password
   - Try `ssh-copy-id` for key setup

2. **Insufficient Disk Space**
   - Clean up old backups
   - Remove unused Docker images

3. **Upload Timeout**
   - Network issues
   - Large file size
   - Try rsync deploy instead: `./scripts/rsync-deploy.sh`

**Solution:**
- Fix underlying issue
- Re-run deployment
- Check logs: `./scripts/deploy-prod.sh logs`

## Log Analysis

### Backend Log Locations
```bash
# Container logs (stdout/stderr)
docker logs myblog-backend

# Application logs (mounted volume)
ssh root@49.235.139.118 "tail -f /app/myblog/data/backend/logs/spring.log"
```

### Frontend Log Locations
```bash
# nginx access logs
docker logs myblog-frontend

# nginx error logs
docker exec myblog-frontend tail -f /var/log/nginx/error.log
```

### MySQL Logs
```bash
docker logs myblog-mysql
```

## Emergency Procedures

### Full Service Restart
```bash
ssh root@49.235.139.118
cd /app/myblog
docker-compose -f docker-compose.prod.yml restart
```

### Rollback to Previous Version
```bash
ssh root@49.235.139.118
cd /app/myblog/backups
ls -la  # Find backup directory
cp backup-YYYYMMDD-HHMMSS/myblog-backend.jar ../myblog-backend/target/
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Restore
```bash
ssh root@49.235.139.118
cd /app/myblog/backups
gunzip myblog_db_YYYYMMDD_HHMMSS.sql.gz
docker exec -i myblog-mysql mysql -uroot -p myblog < myblog_db_YYYYMMDD_HHMMSS.sql
```

### Reset Everything (Destructive)
```bash
ssh root@49.235.139.118
cd /app/myblog
docker-compose -f docker-compose.prod.yml down -v
# This removes all data - only use as last resort
```

## Performance Tuning

### Java Heap Size
Edit `docker-compose.prod.yml`:
```yaml
backend:
  environment:
    JAVA_OPTS: "-Xms512m -Xmx1024m"
```

### MySQL Settings
Edit `docker-compose.prod.yml`:
```yaml
mysql:
  command: --innodb_buffer_pool_size=1G
```

### Nginx Workers
Edit frontend Dockerfile or nginx config

## Monitoring Setup

### Basic Monitoring
```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

### Log Aggregation
Consider setting up:
- ELK stack (Elasticsearch, Logstash, Kibana)
- Splunk
- CloudWatch (if on AWS)

### Uptime Monitoring
Use external services:
- UptimeRobot
- Pingdom
- StatusCake

## Contact Information

- Server: root@49.235.139.118
- Project Path: /app/myblog
- Backup Location: /app/myblog/backups/
- Deploy Logs: Check `deploy-update.sh` output
