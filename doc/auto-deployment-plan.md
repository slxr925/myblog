# MyBlog 自动化部署重构计划

## 📋 现状分析

### 当前部署流程的问题

1. **数据库迁移手动化**
   - ❌ 需要手动上传SQL文件
   - ❌ 需要手动在Docker容器中执行SQL
   - ❌ 没有版本控制和回滚机制
   - ❌ 多环境部署容易遗漏或重复执行

2. **部署流程不够自动化**
   - ⚠️ 需要本地构建（依赖本地环境）
   - ⚠️ 需要手动上传到服务器
   - ⚠️ 缺少自动化测试
   - ⚠️ 没有部署日志和审计

3. **环境一致性问题**
   - ⚠️ 本地、测试、生产环境数据库状态可能不一致
   - ⚠️ 缺少数据库版本检查机制

---

## 🎯 重构目标

### 核心目标
1. ✅ **数据库迁移自动化**: 使用Flyway实现版本化数据库迁移
2. ✅ **CI/CD流水线**: 使用GitHub Actions实现自动化构建和部署
3. ✅ **多环境支持**: dev、test、production环境配置分离
4. ✅ **安全性提升**: 敏感信息使用环境变量和Secrets
5. ✅ **可追溯性**: 完整的部署日志和版本记录

---

## 🏗️ 技术方案

### 方案一：Flyway + GitHub Actions（推荐）

#### 优势
- ✅ Spring Boot原生支持Flyway
- ✅ 版本化SQL脚本管理
- ✅ 自动检测和执行未应用的迁移
- ✅ 支持回滚
- ✅ GitHub Actions免费且易用

#### 架构图
```
┌─────────────────┐
│  Git Push       │
│  (main/release) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     GitHub Actions Workflow             │
│  ┌───────────────────────────────────┐  │
│  │ 1. Checkout Code                  │  │
│  │ 2. Build Backend (Maven)          │  │
│  │ 3. Build Frontend (npm)           │  │
│  │ 4. Run Tests                      │  │
│  │ 5. Build Docker Images            │  │
│  │ 6. Push to Registry               │  │
│  └───────────────────────────────────┘  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Production Server Deployment           │
│  ┌───────────────────────────────────┐  │
│  │ 1. Pull Docker Images             │  │
│  │ 2. Run Flyway Migration (自动)     │  │
│  │ 3. Stop Old Containers            │  │
│  │ 4. Start New Containers           │  │
│  │ 5. Health Check                   │  │
│  │ 6. Rollback if Failed             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 方案二：Liquibase + GitLab CI（备选）

适用场景：如果需要更强大的数据库重构能力和跨数据库支持。

---

## 📐 实施计划

### Phase 1: 数据库迁移工具集成（2-3小时）

#### 1.1 集成Flyway到Spring Boot

**后端改动：**

```xml
<!-- pom.xml 添加依赖 -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId>
</dependency>
```

```yaml
# application.yml 配置
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true  # 对已有数据库启用
    baseline-version: 0        # 基准版本
    locations: classpath:db/migration  # SQL文件位置
    encoding: UTF-8
    validate-on-migrate: true
    clean-disabled: true       # 生产环境禁用clean
```

#### 1.2 迁移现有SQL文件

**目录结构：**
```
myblog-backend/
├── src/main/resources/
│   └── db/
│       └── migration/
│           ├── V1__init_database.sql              # 初始化脚本
│           ├── V2__add_browse_history.sql         # 浏览记录表
│           ├── V3__add_indexes.sql                # 索引优化
│           └── V4__add_user_settings.sql          # 未来的迁移
```

**命名规则：**
- `V{version}__{description}.sql`
- 版本号递增：V1, V2, V3...
- 描述使用下划线分隔

**示例：V2__add_browse_history.sql**
```sql
-- Flyway迁移脚本：添加浏览记录表
-- 版本: V2
-- 描述: 添加用户浏览记录功能

-- 创建浏览记录表
CREATE TABLE IF NOT EXISTS `tb_browse_history` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '浏览记录ID',
  ...
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户浏览记录表';

-- 记录执行时间
INSERT INTO flyway_schema_history_log (version, description, execution_time)
VALUES ('V2', 'add_browse_history', NOW());
```

#### 1.3 创建回滚脚本（可选）

```
db/migration/
├── V2__add_browse_history.sql
└── U2__drop_browse_history.sql    # 回滚脚本
```

---

### Phase 2: CI/CD流水线搭建（3-4小时）

#### 2.1 GitHub Actions配置

**文件：`.github/workflows/deploy-production.yml`**

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
    tags:
      - 'v*'
  workflow_dispatch:  # 手动触发

env:
  DOCKER_REGISTRY: docker.io
  IMAGE_NAME: myblog

jobs:
  # Job 1: 构建和测试
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: myblog-frontend/package-lock.json

      - name: Build Backend
        run: |
          cd myblog-backend
          mvn clean package -DskipTests

      - name: Run Backend Tests
        run: |
          cd myblog-backend
          mvn test

      - name: Build Frontend
        run: |
          cd myblog-frontend
          npm ci
          npm run build

      - name: Upload backend artifact
        uses: actions/upload-artifact@v4
        with:
          name: backend-jar
          path: myblog-backend/target/*.jar

      - name: Upload frontend artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: myblog-frontend/dist

  # Job 2: 构建Docker镜像
  build-docker:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Registry
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./myblog-backend
          file: ./myblog-backend/Dockerfile.prod
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/${{ secrets.DOCKER_USERNAME }}/myblog-backend:latest
            ${{ env.DOCKER_REGISTRY }}/${{ secrets.DOCKER_USERNAME }}/myblog-backend:${{ github.sha }}

      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./myblog-frontend
          file: ./myblog-frontend/Dockerfile.prod
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/${{ secrets.DOCKER_USERNAME }}/myblog-frontend:latest
            ${{ env.DOCKER_REGISTRY }}/${{ secrets.DOCKER_USERNAME }}/myblog-frontend:${{ github.sha }}

  # Job 3: 部署到生产环境
  deploy-production:
    needs: build-docker
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /app/myblog
            
            # 拉取最新镜像
            docker-compose -f docker-compose.prod.yml pull
            
            # Flyway会自动执行数据库迁移
            # 重启服务
            docker-compose -f docker-compose.prod.yml up -d
            
            # 等待服务启动
            sleep 10
            
            # 健康检查
            curl -f http://localhost:8081/actuator/health || exit 1
            
            # 清理旧镜像
            docker image prune -af --filter "until=24h"

      - name: Notify deployment success
        if: success()
        run: echo "✅ 部署成功！"

      - name: Notify deployment failure
        if: failure()
        run: echo "❌ 部署失败，请检查日志"
```

#### 2.2 GitHub Secrets配置

需要在GitHub仓库设置以下Secrets：

| Secret Name | 描述 | 示例 |
|------------|------|------|
| `DOCKER_USERNAME` | Docker Hub用户名 | `yourname` |
| `DOCKER_PASSWORD` | Docker Hub密码/Token | `***` |
| `SERVER_HOST` | 服务器地址 | `49.235.139.118` |
| `SERVER_USER` | SSH用户 | `root` |
| `SERVER_SSH_KEY` | SSH私钥 | `-----BEGIN RSA...` |
| `DB_PASSWORD` | 数据库密码 | `Kpiass123.` |

---

### Phase 3: Docker配置优化（1-2小时）

#### 3.1 更新docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend:
    image: ${DOCKER_USERNAME}/myblog-backend:${VERSION:-latest}
    container_name: myblog-backend
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/myblog?useSSL=false
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
      # Flyway配置
      - SPRING_FLYWAY_ENABLED=true
      - SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/actuator/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 60s

  frontend:
    image: ${DOCKER_USERNAME}/myblog-frontend:${VERSION:-latest}
    container_name: myblog-frontend

  mysql:
    image: mysql:8.0
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
```

#### 3.2 创建.env文件（生产环境）

```bash
# .env.production (不提交到git)
DOCKER_USERNAME=yourname
VERSION=latest
DB_PASSWORD=Kpiass123.
```

---

### Phase 4: 部署脚本增强（1小时）

#### 4.1 创建数据库迁移检查脚本

**文件：`deploy/check-migration.sh`**

```bash
#!/bin/bash
# 数据库迁移状态检查

set -e

SERVER_HOST="49.235.139.118"
SERVER_USER="root"

echo "检查数据库迁移状态..."

ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
  docker exec myblog-backend java -jar /app/app.jar \
    --spring.flyway.info=true
EOF

echo "迁移状态检查完成"
```

#### 4.2 创建回滚脚本

**文件：`deploy/rollback.sh`**

```bash
#!/bin/bash
# 版本回滚脚本

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "用法: ./rollback.sh <version>"
    echo "示例: ./rollback.sh v1.0.0"
    exit 1
fi

echo "回滚到版本: $VERSION"

# 回滚Docker镜像
ssh root@49.235.139.118 << EOF
  cd /app/myblog
  
  # 使用指定版本的镜像
  export VERSION=$VERSION
  docker-compose -f docker-compose.prod.yml up -d
  
  # 健康检查
  sleep 10
  curl -f http://localhost:8081/actuator/health || exit 1
EOF

echo "✅ 回滚完成"
```

---

### Phase 5: 监控和告警（可选，1-2小时）

#### 5.1 部署通知

使用Webhook通知到钉钉/企业微信：

```yaml
# GitHub Actions 添加通知步骤
- name: Send notification
  if: always()
  uses: actions/github-script@v7
  with:
    script: |
      // 发送钉钉通知
      const webhook = '${{ secrets.DINGTALK_WEBHOOK }}';
      // 实现通知逻辑
```

#### 5.2 数据库迁移日志

```sql
-- V0__migration_log.sql
CREATE TABLE IF NOT EXISTS flyway_migration_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  version VARCHAR(50),
  description VARCHAR(200),
  script_name VARCHAR(100),
  execution_time DATETIME,
  success BOOLEAN,
  error_message TEXT
);
```

---

## 📋 改动文件清单

### 新增文件

**后端：**
1. `src/main/resources/db/migration/V1__init_database.sql`
2. `src/main/resources/db/migration/V2__add_browse_history.sql`
3. 配置文件中添加Flyway配置

**CI/CD：**
4. `.github/workflows/deploy-production.yml`
5. `.github/workflows/deploy-test.yml`
6. `.github/workflows/pr-check.yml`

**部署脚本：**
7. `deploy/check-migration.sh`
8. `deploy/rollback.sh`
9. `deploy/migrate.sh`

**文档：**
10. `doc/deployment-guide.md`
11. `doc/migration-guide.md`

### 修改文件

1. `pom.xml` - 添加Flyway依赖
2. `application.yml` - 添加Flyway配置
3. `application-prod.yml` - 生产环境Flyway配置
4. `docker-compose.prod.yml` - 更新健康检查和依赖
5. `.gitignore` - 添加.env文件

### 删除/迁移文件

1. `database/all-in-one.sql` → 拆分为Flyway迁移脚本
2. `database/browse_history.sql` → 改为 `V2__add_browse_history.sql`

---

## 🔄 实施步骤

### Step 1: 准备工作（30分钟）

```bash
# 1. 创建新分支
git checkout -b feature/auto-deployment

# 2. 安装Flyway Maven插件（可选）
# pom.xml已包含

# 3. 创建迁移目录结构
mkdir -p myblog-backend/src/main/resources/db/migration
```

### Step 2: 集成Flyway（1小时）

```bash
# 1. 添加Flyway依赖到pom.xml
# 2. 配置application.yml
# 3. 创建V1初始化脚本
# 4. 迁移现有SQL文件到V2
# 5. 本地测试
```

### Step 3: 配置GitHub Actions（1.5小时）

```bash
# 1. 创建工作流文件
mkdir -p .github/workflows
vi .github/workflows/deploy-production.yml

# 2. 配置GitHub Secrets
# 登录GitHub → Settings → Secrets → New repository secret

# 3. 测试工作流
git push origin feature/auto-deployment  # 触发PR检查
```

### Step 4: 更新部署脚本（1小时）

```bash
# 1. 创建新的部署脚本
# 2. 添加迁移检查
# 3. 添加回滚功能
# 4. 测试脚本
```

### Step 5: 测试和验证（1-2小时）

```bash
# 1. 在测试环境验证
# 2. 检查Flyway迁移历史
# 3. 测试回滚功能
# 4. 健康检查
```

### Step 6: 生产部署（30分钟）

```bash
# 1. 合并到main分支
git checkout main
git merge feature/auto-deployment

# 2. 打标签
git tag -a v1.1.0 -m "Add automated deployment with Flyway"
git push origin v1.1.0

# 3. 自动触发CI/CD流水线
# 4. 监控部署过程
# 5. 验证功能
```

---

## ⏱️ 时间估算

| 阶段 | 预计时间 | 说明 |
|------|---------|------|
| Phase 1: Flyway集成 | 2-3小时 | 包括本地测试 |
| Phase 2: CI/CD配置 | 3-4小时 | GitHub Actions设置 |
| Phase 3: Docker优化 | 1-2小时 | 健康检查和依赖 |
| Phase 4: 脚本增强 | 1小时 | 迁移检查和回滚 |
| Phase 5: 监控告警 | 1-2小时 | 可选 |
| **总计** | **8-12小时** | 同一个开发周期完成 |

---

## ✅ 验收标准

### 功能验收

- [ ] Flyway能够自动执行数据库迁移
- [ ] CI/CD流水线成功运行
- [ ] 多环境配置正确（dev/test/prod）
- [ ] 回滚功能正常工作
- [ ] 健康检查通过

### 测试场景

1. **正常部署流程**
   - 推送代码到main分支
   - 自动触发构建、测试、部署
   - 数据库自动迁移
   - 服务正常启动

2. **数据库迁移**
   - 添加新表
   - 修改表结构
   - 添加索引
   - 数据迁移

3. **回滚场景**
   - 部署失败自动回滚
   - 手动回滚到指定版本
   - 数据库状态正确

4. **异常处理**
   - 数据库连接失败
   - 迁移脚本错误
   - Docker镜像拉取失败

---

## 🎯 后续优化

### 短期优化（1-2周）

1. 添加单元测试覆盖率检查
2. 集成SonarQube代码质量扫描
3. 添加性能测试
4. 完善部署通知

### 长期优化（1-2月）

1. 多环境管理（dev/test/staging/prod）
2. 蓝绿部署或滚动更新
3. 自动化数据库备份
4. 完整的监控告警体系
5. 灰度发布机制

---

## 📚 参考资料

- [Flyway官方文档](https://flywaydb.org/documentation/)
- [GitHub Actions文档](https://docs.github.com/en/actions)
- [Docker Compose健康检查](https://docs.docker.com/compose/compose-file/compose-file-v3/#healthcheck)
- [Spring Boot Flyway集成](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization.migration-tool.flyway)

---

## 💡 关键决策点

> [!IMPORTANT]
> **是否需要立即实施？**
> 建议分阶段实施：
> - 第一阶段：集成Flyway（必需）
> - 第二阶段：GitHub Actions CI/CD（推荐）
> - 第三阶段：监控告警（可选）

> [!WARNING]
> **生产环境注意事项：**
> - 首次启用Flyway需要设置baseline
> - 必须备份数据库再执行迁移
> - 建议在测试环境充分验证

> [!TIP]
> **最佳实践：**
> - 迁移脚本保持幂等性
> - 大表结构变更先在从库测试
> - 保留回滚脚本
> - 记录每次迁移的执行时间

---

## 🤝 需要确认的事项

在开始实施前，请确认：

1. ✅ 是否接受GitHub Actions作为CI/CD工具？
2. ✅ 是否需要支持多套环境（dev/test/prod）？
3. ✅ 数据库迁移失败时的回滚策略？
4. ✅ 是否需要部署审批流程？
5. ✅ 团队成员是否需要培训？

---

**下一步**: 如果您同意该方案，我将开始实施第一阶段（Flyway集成），预计2-3小时完成。
