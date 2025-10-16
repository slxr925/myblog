#!/bin/sh
# ============================================
# MyBlog Docker 容器启动脚本
# 生产环境优化版本
# ============================================

set -e

# 颜色输出函数
print_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

print_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

print_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

# 检查必需的环境变量
check_required_env() {
    print_info "检查必需的环境变量..."

    required_vars="DB_PASSWORD JWT_SECRET"
    missing_vars=""

    for var in $required_vars; do
        if [ -z "$(eval echo \$$var)" ]; then
            missing_vars="$missing_vars $var"
        fi
    done

    if [ -n "$missing_vars" ]; then
        print_error "缺少必需的环境变量:$missing_vars"
        print_error "请在生产环境中设置这些变量"
        exit 1
    fi

    print_info "环境变量检查通过"
}

# 等待依赖服务启动
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local timeout=${4:-30}

    print_info "等待 $service_name 服务启动 ($host:$port)..."

    counter=0
    while [ $counter -lt $timeout ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            print_info "$service_name 服务已启动"
            return 0
        fi

        counter=$((counter + 1))
        sleep 1
    done

    print_error "$service_name 服务启动超时"
    return 1
}

# 检查数据库连接
check_database() {
    if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
        wait_for_service "$DB_HOST" "$DB_PORT" "MySQL"
    fi
}

# 检查 Redis 连接
check_redis() {
    if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
        wait_for_service "$REDIS_HOST" "$REDIS_PORT" "Redis"
    fi
}

# 检查 Elasticsearch 连接
check_elasticsearch() {
    if [ -n "$ELASTICSEARCH_HOST" ] || [ -n "$ELASTICSEARCH_URIS" ]; then
        local es_host=${ELASTICSEARCH_HOST:-localhost}
        local es_port=${ELASTICSEARCH_PORT:-9200}
        wait_for_service "$es_host" "$es_port" "Elasticsearch"
    fi
}

# 创建必要的目录
create_directories() {
    print_info "创建必要的目录..."

    directories="logs uploads/avatars uploads/images temp"

    for dir in $directories; do
        if [ ! -d "/app/$dir" ]; then
            mkdir -p "/app/$dir"
            print_info "创建目录: /app/$dir"
        fi
    done

    # 设置目录权限
    chmod 755 /app/uploads /app/temp
    chmod 755 /app/logs
}

# 显示应用信息
show_app_info() {
    print_info "=================================="
    print_info "MyBlog 应用启动信息"
    print_info "=================================="
    print_info "应用名称: MyBlog Backend"
    print_info "版本: ${APP_VERSION:-latest}"
    print_info "环境: ${SPRING_PROFILES_ACTIVE:-prod}"
    print_info "端口: ${SERVER_PORT:-8081}"
    print_info "JVM 内存限制: ${JAVA_MEMORY_LIMIT:-512MB}"
    print_info "时区: ${TZ:-Asia/Shanghai}"
    print_info "数据库主机: ${DB_HOST:-localhost}"
    print_info "Redis 主机: ${REDIS_HOST:-localhost}"
    print_info "=================================="
}

# 优化 JVM 参数
optimize_jvm() {
    # 根据容器可用内存动态调整 JVM 参数
    if [ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then
        memory_limit=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo "536870912") # 默认 512MB
        memory_mb=$((memory_limit / 1024 / 1024))

        if [ $memory_mb -gt 2048 ]; then
            export JAVA_OPTS="$JAVA_OPTS -Xmx1024m -Xms256m"
        elif [ $memory_mb -gt 1024 ]; then
            export JAVA_OPTS="$JAVA_OPTS -Xmx512m -Xms128m"
        else
            export JAVA_OPTS="$JAVA_OPTS -Xmx256m -Xms64m"
        fi

        print_info "JVM 内存参数已优化为: $JAVA_OPTS"
    fi
}

# 主函数
main() {
    print_info "MyBlog Docker 容器启动中..."

    # 设置默认的 Spring 配置文件
    export SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-prod}

    # 执行各项检查
    check_required_env
    create_directories
    optimize_jvm

    # 等待依赖服务（可选）
    if [ "${WAIT_FOR_DEPENDENCIES:-true}" = "true" ]; then
        check_database
        check_redis
        check_elasticsearch
    fi

    # 显示应用信息
    show_app_info

    print_info "启动 MyBlog 应用..."

    # 启动应用
    exec java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar
}

# 信号处理函数
cleanup() {
    print_info "接收到终止信号，正在优雅关闭应用..."
    # 这里可以添加清理逻辑
    exit 0
}

# 设置信号处理
trap cleanup SIGTERM SIGINT

# 检查必需的命令
if ! command -v nc >/dev/null 2>&1; then
    print_warn "nc 命令不可用，跳过服务健康检查"
fi

# 执行主函数
main "$@"