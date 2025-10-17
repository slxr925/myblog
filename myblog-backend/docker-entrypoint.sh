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

# 加载本地环境变量文件
load_env_file() {
    local env_file="/app/.env.local"

    if [ -f "$env_file" ]; then
        print_info "加载本地环境变量文件: $env_file"
        # 加载 .env.local 文件
        set -a
        . "$env_file"
        set +a
        print_info "本地环境变量已加载"
    else
        print_warn "未找到本地环境变量文件，使用默认配置"
    fi
}

# 检查环境变量配置
check_env_config() {
    print_info "检查环境配置..."

    # 根据环境配置不同的检查逻辑
    local profile=${SPRING_PROFILES_ACTIVE:-prod}

    if [ "$profile" = "prod" ]; then
        print_info "生产环境配置检查..."

        # 检查关键环境变量，但不强制失败
        if [ -z "$DB_PASSWORD" ]; then
            print_warn "未设置 DB_PASSWORD 环境变量，将使用生产配置文件中的默认值"
        fi

        if [ -z "$JWT_SECRET" ]; then
            print_warn "未设置 JWT_SECRET 环境变量，将使用生产配置文件中的默认值"
            print_warn "⚠️  建议在生产环境中设置自定义 JWT_SECRET"
        fi

        # 显示重要配置信息
        print_info "数据库主机: ${DB_HOST:-mysql}"
        print_info "Redis 主机: ${REDIS_HOST:-redis}"
        print_info "应用端口: ${SERVER_PORT:-8081}"

    else
        print_info "开发环境配置检查..."

        # 开发环境的警告信息
        if [ -z "$DB_PASSWORD" ]; then
            print_warn "未设置 DB_PASSWORD，使用本地开发配置"
        fi

        if [ -z "$JWT_SECRET" ]; then
            print_warn "未设置 JWT_SECRET，使用默认开发密钥"
            export JWT_SECRET="dev-jwt-secret-key-change-in-production"
        fi
    fi

    print_info "环境配置检查完成 ($profile 环境)"
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

    # 加载本地环境变量文件
    load_env_file

    # 设置默认的 Spring 配置文件
    export SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-prod}

    # 执行各项检查
    check_env_config
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