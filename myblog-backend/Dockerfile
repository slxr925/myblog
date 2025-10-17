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

# 安装必要的系统依赖（仅 curl 用于健康检查）
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用用户（安全考虑）
RUN addgroup -g 1001 -S myblog \
    && adduser -S myblog -u 1001 -G myblog

# 设置工作目录
WORKDIR /app

# 从构建阶段复制 JAR 文件
COPY --from=builder /app/target/myblog-*.jar app.jar

# 创建必要的目录结构
RUN mkdir -p /app/uploads/avatars \
            /app/uploads/images \
            /app/logs \
            /app/temp \
    && chown -R myblog:myblog /app

# 切换到应用用户
USER myblog

# 暴露端口
EXPOSE 8081

# 设置 JVM 参数（针对微信云托管环境优化）
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=60.0 \
               -XX:+UseG1GC \
               -XX:+UseStringDeduplication \
               -Xms64m \
               -Xmx256m \
               -XX:+UnlockExperimentalVMOptions \
               -XX:+UseCGroupMemoryLimitForHeap \
               -Djava.security.egd=file:/dev/./urandom \
               -Dspring.profiles.active=prod \
               -Dfile.encoding=UTF-8 \
               -Duser.timezone=Asia/Shanghai \
               -Dspring.jpa.open-in-view=false"

# 健康检查 - 微信云托管优化
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=2 \
    CMD curl -f http://0.0.0.0:8081/actuator/health || exit 1

# 直接启动 Java 应用
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]