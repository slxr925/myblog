# 基础构建阶段
FROM maven:3.9-eclipse-temurin-21 AS base
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src

# 开发阶段 (Local Development)
# 使用方法: docker build --target dev -t myblog-backend:dev .
FROM base AS dev
ENV SPRING_PROFILES_ACTIVE=docker-local
CMD ["mvn", "spring-boot:run", "-Dspring-boot.run.profiles=docker-local", "-Dspring-boot.run.jvmArguments=-Xms512m -Xmx1g"]

# 构建阶段 (Production Build)
FROM base AS builder
RUN mvn clean package -DskipTests

# 生产阶段 (Production Runtime)
# 使用方法: docker build --target prod -t myblog-backend:prod .
FROM eclipse-temurin:21-jre-alpine AS prod

# 安装必要工具
RUN apk add --no-cache curl

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1000 spring && adduser -D -s /bin/sh -u 1000 -G spring spring

# 复制JAR
COPY --from=builder /app/target/*.jar app.jar

# 创建相关目录
RUN mkdir -p /app/logs /app/uploads && \
    chown -R spring:spring /app

# JVM参数
ENV JAVA_OPTS="-Xms768m -Xmx1536m -XX:+UseG1GC -XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0"
ENV TZ=Asia/Shanghai

# 设置时区
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:8081/actuator/health || exit 1

USER spring

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]