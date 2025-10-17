# 使用 OpenJDK 17 JRE
FROM openjdk:17-jre-alpine

# 设置工作目录
WORKDIR /app

# 创建必要的目录
RUN mkdir -p /app/uploads/avatars /app/uploads/images /app/logs /app/temp /app/cert

# 复制jar文件
COPY target/myblog-0.0.1-SNAPSHOT.jar app.jar

# 复制证书初始化脚本
COPY cert-initenv.sh /app/cert/initenv.sh
RUN chmod +x /app/cert/initenv.sh

# 设置环境变量
ENV JAVA_OPTS="-Xms128m -Xmx512m -Dspring.profiles.active=prod -Dfile.encoding=UTF-8 -Duser.timezone=Asia/Shanghai"

# 暴露端口
EXPOSE 8081

# 启动应用
CMD ["java", "-jar", "app.jar"]