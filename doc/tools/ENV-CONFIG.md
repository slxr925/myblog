# 环境变量配置规范

## 1. 配置文件约定

- 本地：`.env.local`（不提交）
- 生产：`.env`（由运维系统或服务器安全维护）
- 模板：`.env.example`（可提交，不含真实值）

## 2. 必备配置（示例字段）

```bash
# 数据库
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

# 认证
JWT_SECRET=
JWT_EXPIRE_SECONDS=

# AI（如启用）
AI_ENABLED=
OPENAI_BASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=
AI_MAX_REQUESTS_PER_DAY=3
AI_MAX_TOKENS_PER_DAY=50000
TZ=Asia/Shanghai
```

## 3. 管理原则

- 真实值只保存在受控环境
- 通过 CI/CD 或服务器注入，不写入仓库
- 变更后同步更新 `.env.example` 字段说明

## 4. 自检清单

- `.gitignore` 已忽略环境文件
- 本地与生产字段一致
- 关键配置缺失时应用能快速失败并给出明确日志
