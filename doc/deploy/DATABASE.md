# 数据库部署与迁移指南

## 1. 目标

- 让数据库结构变更可追踪、可回放、可审计
- 将手工 SQL 改为迁移脚本化执行

## 2. 迁移目录

- 目录：`myblog-backend/database/migrations/`
- 规则：按时间或版本前缀排序（例如 `V20260302__feature.sql`）
- 注意：生产与本地部署脚本只会执行这个目录下的 SQL；`src/main/resources/db/` 中的文件不会被部署脚本自动执行

## 3. 本地迁移

```bash
./deploy/local/apply-migrations.sh
```

执行逻辑：

1. 扫描迁移目录
2. 按顺序执行未应用脚本
3. 在迁移记录表中登记执行状态

## 4. 生产迁移

```bash
./deploy/prod/apply-migrations.sh .env
```

建议：

- 部署前先做数据库备份
- 每次发布只包含小批量、可回滚变更
- 对大表操作在业务低峰执行

## 5. 备份与恢复（示例流程）

### 5.1 备份

```bash
# 在数据库容器或数据库主机执行（参数请通过环境变量注入）
mysqldump --databases <DB_NAME> > backup.sql
```

### 5.2 恢复

```bash
mysql <DB_NAME> < backup.sql
```

## 6. 变更评审清单

- 是否包含兼容旧版本的策略
- 是否影响核心查询索引
- 是否有回滚脚本或回退方案
- 是否经过预发数据验证

## 7. 敏感信息规范

- 文档仅允许出现变量名：`DB_HOST/DB_USER/DB_PASSWORD/DB_NAME`
- 不允许出现真实口令、连接串、生产实例标识
