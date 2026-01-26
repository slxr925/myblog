# Production Deployment Checklist

## Pre-Deployment Checklist

### Local Environment
- [ ] Git branch is clean (no uncommitted changes)
- [ ] On correct branch (main for production)
- [ ] Tests pass (if applicable)
- [ ] Code reviewed (if working with team)

### Build Verification
- [ ] Backend builds successfully: `./deploy/prod/build-local.sh`
- [ ] Frontend builds successfully
- [ ] JAR file size is reasonable
- [ ] Dist directory contains expected files

### Server Preparation
- [ ] SSH connection works: `ssh root@49.235.139.118`
- [ ] Server has sufficient disk space
- [ ] Backup is recent (or create new backup)
- [ ] Environment variables are correct in `.env.prod`

## Deployment Steps

### 1. Create Backup
```bash
# On server
cd /app/myblog/deploy
./backup.sh
```

### 2. Deploy
```bash
# From local machine
./deploy/prod/deploy-update.sh
```

Or use wrapper:
```bash
./scripts/deploy-prod.sh deploy
```

### 3. Monitor Deployment
Watch for:
- Build completion
- Upload progress
- Server deployment logs
- Health check results

## Post-Deployment Verification

### Container Status
```bash
ssh root@49.235.139.118 "docker ps -f name=myblog"
```

Expected: All containers running and healthy

### Backend Health Check
```bash
curl http://49.235.139.118:8081/actuator/health
```

Expected: `{"status":"UP"}`

### Frontend Access
Visit: http://49.235.139.118:3000

Expected: Homepage loads without errors

### API Documentation
Visit: http://49.235.139.118:8081/doc.html

Expected: Swagger UI loads

### Log Check
```bash
ssh root@49.235.139.118 "docker logs --tail=100 myblog-backend"
```

Check for:
- No ERROR logs
- Application started successfully
- Database connection OK

## Rollback Procedure

If deployment fails:

1. Check logs for errors
2. Automatic rollback may have occurred
3. Manual rollback if needed:
```bash
ssh root@49.235.139.118
cd /app/myblog/backups
ls -la  # Find backup
cp backup-YYYYMMDD-HHMMSS/myblog-backend.jar ../myblog-backend/target/
docker-compose -f docker-compose.prod.yml restart backend
```

## Common Issues

### Port Already in Use
```bash
# Check what's using the port
ssh root@49.235.139.118 "netstat -tulpn | grep :8081"
```

### Out of Memory
```bash
# Check server resources
ssh root@49.235.139.118 "free -h"
ssh root@49.235.139.118 "df -h"
```

### Database Connection Failed
- Verify MySQL container is running
- Check database credentials in `.env.prod`
- Ensure database exists and is initialized

## Emergency Contacts

- Server Admin: root@49.235.139.118
- Backup Location: /app/myblog/backups/
- Log Location: `docker logs myblog-backend` or `docker logs myblog-frontend`
