# GitHub Actions 接入说明

仓库已提供两条工作流：

- `CI`：在 `pull_request` 和 `push` 到 `main` 时运行，校验前后端构建
- `Deploy to Production`：仅在 `main` 分支上手动触发，使用 GitHub runner 构建并通过 SSH 发布到生产服务器

## 需要配置的 Secrets

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 中配置：

- `PROD_HOST`：生产服务器地址
- `PROD_USER`：SSH 用户
- `PROD_PATH`：服务器上的项目目录，例如 `/app/myblog`
- `PROD_SSH_KEY`：用于部署的私钥

可选：

- `PROD_PORT`：SSH 端口，默认 `22`
- `PROD_KNOWN_HOSTS`：已确认的主机指纹；不配置时 workflow 会使用 `ssh-keyscan`
- `PROD_ENV_FILE`：完整的生产环境变量文件内容；如不配置，则沿用服务器已有的 `.env` / `.env.prod`

## 建议的仓库设置

- 创建 GitHub `production` environment，并开启人工审批
- 将 `CI` 设为 `main` 分支的 required check
- 仅允许维护者手动触发生产部署

## 工作流行为

### CI

- 前端执行 `npm ci && npm run build:check`
- 后端执行 `./mvnw -B -DskipTests package`

### Deploy to Production

1. 在 GitHub runner 上安装 Node 20 和 Java 21
2. 构建前端 `dist` 与后端 `jar`
3. 通过 SSH 上传产物、部署脚本与生产配置
4. 在服务器执行 `./quick-deploy.sh --incremental` 或 `--full`

## 注意事项

- 生产部署目前复用现有 SSH 发布模式，没有切换为镜像仓库
- 前端生产容器使用 `myblog-frontend/Dockerfile.prod`，它依赖 runner 预先构建好的 `dist`
- 如果服务器上已经维护独立 `.env.prod`，可以不设置 `PROD_ENV_FILE`
