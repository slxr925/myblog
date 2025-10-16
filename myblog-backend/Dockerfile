# ============================================
# 构建阶段 - Maven 打包
# ============================================
FROM maven:3.9.6-eclipse-temurin-21 AS builder

# 设置工作目录
WORKDIR /app

# 设置 Maven 参数
ARG MAVEN_OPTS=-Dmaven.repo.local=/root/.m2/repository -DskipTests
ENV MAVEN_OPTS=${MAVEN_OPTS}

# 配置 Maven 阿里云镜像加速（如果在国内环境）
COPY settings.xml /root/.m2/settings.xml

# 复制 pom.xml 文件并下载依赖（利用 Docker 层缓存）
COPY pom.xml .
COPY settings.xml .

# 下载依赖（不重复下载源码，利用缓存）
RUN mvn dependency:go-offline -B

# 复制源代码
COPY src ./src

# 打包应用
RUN mvn clean package -B -DskipTests

# ============================================
# 运行阶段 - 最小化 JRE 镜像
# ============================================
FROM eclipse-temurin:21-jre-alpine

# 安装必要的系统依赖
RUN apk add --no-cache \
    curl \
    dumb-init \
    netcat-openbsd \
    && rm -rf /var/cache/apk/*

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用用户（安全考虑）
RUN addgroup -g 1001 -S myblog \
    && adduser -S myblog -u 1001 -G myblog

# 设置工作目录
WORKDIR /app

# 从构建阶段复制 JAR 文件和启动脚本
COPY --from=builder /app/target/myblog-*.jar app.jar
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

# 创建必要的目录结构
RUN mkdir -p /app/uploads/avatars \
            /app/uploads/images \
            /app/logs \
            /app/temp \
    && chown -R myblog:myblog /app \
    && chmod +x /app/docker-entrypoint.sh

# 切换到应用用户
USER myblog

# 暴露端口（Serverless 平台通常需要）
EXPOSE 8081

# 设置 JVM 参数（针对 Serverless 环境优化）
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:+UseStringDeduplication \
               -Xms128m \
               -Xmx512m \
               -Djava.security.egd=file:/dev/./urandom \
               -Dspring.profiles.active=prod \
               -Dfile.encoding=UTF-8 \
               -Duser.timezone=Asia/Shanghai"

# 生产环境配置
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8081

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8081/actuator/health || exit 1

# 使用 dumb-init 作为 PID 1，执行启动脚本
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["/app/docker-entrypoint.sh"]