# MyBlog 数据库迁移目录

本目录下的 `*.sql` 文件会被以下脚本按文件名字典序自动执行：

- `/Users/xuran/Dev/myblog/deploy/local/apply-migrations.sh`
- `/Users/xuran/Dev/myblog/deploy/prod/apply-migrations.sh`

规则：

- 新增结构变更时，必须把 SQL 放到本目录，不能只放在 `src/main/resources/db/`
- 已执行过的迁移文件不要修改内容；如需继续变更，请新增文件
- 文件名建议使用时间/版本前缀，例如 `V20260401__feature.sql`

当前迁移：

- `V20260401__add_blog_public_id.sql`
  为 `tb_blog` 增加 `public_id`，回填历史 UUID，移除冗余普通索引，并补上唯一索引 `uk_blog_public_id`
