#!/bin/bash

# MyBlog Health Check Script
# Checks the health status of all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MyBlog Service Health Check       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check function
check_service() {
    local name="$1"
    local check_cmd="$2"

    echo -n "Checking $name... "

    if eval "$check_cmd" &>/dev/null; then
        echo -e "${GREEN}✓ Healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        return 1
    fi
}

# Check Docker
echo -e "${BLUE}=== Docker ===${NC}"
if docker info &>/dev/null; then
    echo -e "${GREEN}✓ Docker is running${NC}"
else
    echo -e "${RED}✗ Docker is not running${NC}"
    exit 1
fi
echo ""

# Check containers
echo -e "${BLUE}=== Containers ===${NC}"
RUNNING=$(docker ps --filter "name=myblog" --format "{{.Names}}" | wc -l | tr -d ' ')
echo "Running containers: $RUNNING"
docker ps --filter "name=myblog" --format "  - {{.Names}}: {{.Status}}"
echo ""

# Check services
echo -e "${BLUE}=== Service Health ===${NC}"

check_service "MySQL" \
    "docker exec myblog-mysql mysqladmin ping -h localhost --silent"

check_service "Redis" \
    "docker exec myblog-redis redis-cli ping"

check_service "Kafka" \
    "docker exec myblog-kafka /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092"

check_service "Elasticsearch" \
    "curl -s http://localhost:9200/_cluster/health"

check_service "Backend (8081)" \
    "curl -s http://localhost:8081/actuator/health"

check_service "Frontend (3000)" \
    "curl -s http://localhost:3000"

echo ""

# Summary
echo -e "${BLUE}=== Summary ===${NC}"
HEALTHY=0
TOTAL=6

docker exec myblog-mysql mysqladmin ping -h localhost --silent 2>/dev/null && ((HEALTHY++)) || true
docker exec myblog-redis redis-cli ping &>/dev/null && ((HEALTHY++)) || true
docker exec myblog-kafka /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 &>/dev/null && ((HEALTHY++)) || true
curl -s http://localhost:9200/_cluster/health &>/dev/null && ((HEALTHY++)) || true
curl -s http://localhost:8081/actuator/health &>/dev/null && ((HEALTHY++)) || true
curl -s http://localhost:3000 &>/dev/null && ((HEALTHY++)) || true

echo "Healthy: $HEALTHY/$TOTAL services"

if [ $HEALTHY -eq $TOTAL ]; then
    echo -e "${GREEN}All systems operational!${NC}"
    exit 0
else
    echo -e "${YELLOW}Some services may need attention${NC}"
    exit 1
fi
