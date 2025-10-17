# ============================================
# 简化的生产环境 Dockerfile
# 使用手工打包的 jar 文件，避免容器内构建
# ============================================

# 使用官方 Alpine Linux 版本的 OpenJDK 21 JRE
FROM eclipse-temurin:21-jre-alpine

# 设置维护者信息
LABEL maintainer="myblog-admin"
LABEL description="MyBlog Backend Application"
LABEL version="1.0"

# 安装必要的系统工具
RUN apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# 设置时区为中国标准时间
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用用户（安全考虑）
RUN addgroup -g 1001 -S myblog \
    && adduser -S myblog -u 1001 -G myblog

# 设置工作目录
WORKDIR /app

# 创建必要的目录结构
RUN mkdir -p /app/uploads/avatars \
            /app/uploads/images \
            /app/logs \
            /app/temp \
            /app/cert \
    && chown -R myblog:myblog /app

# 复制证书初始化脚本
COPY cert-initenv.sh /app/cert/initenv.sh
RUN chmod +x /app/cert/initenv.sh \
    && chown myblog:myblog /app/cert/initenv.sh

# 复制本地打包好的 JAR 文件
# 注意：在部署前需要先运行 `mvn clean package -DskipTests`
COPY target/myblog-0.0.1-SNAPSHOT.jar app.jar

# 设置文件权限
RUN chown myblog:myblog app.jar \
    && chmod +x app.jar

# 切换到应用用户
USER myblog

# 暴露应用端口
EXPOSE 8081

# 设置 JVM 参数 - 针对微信云托管环境优化
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=60.0 \
               -XX:+UseG1GC \
               -XX:+UseStringDeduplication \
               -Xms128m \
               -Xmx512m \
               -Djava.security.egd=file:/dev/./urandom \
               -Dspring.profiles.active=prod \
               -Dfile.encoding=UTF-8 \
               -Duser.timezone=Asia/Shanghai \
               -Dspring.jpa.open-in-view=false \
               -Dserver.port=8081"

# 健康检查 - 简单可靠
HEALTHCHECK --interval=60s --timeout=30s --start-period=120s --retries=3 \
    CMD curl -f -s http://localhost:8081/actuator/health || exit 1

# 启动命令 - 简单直接
CMD ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]