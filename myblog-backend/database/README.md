# Database 目录说明

本目录包含 MyBlog 项目的数据库初始化和种子数据脚本。

## 📁 文件说明

### init.sql
**主数据库初始化脚本**

包含内容：
- 数据库创建
- 所有表结构定义
- 索引和外键约束
- 默认管理员用户（用户名：admin，密码：admin123）
- 默认分类和标签
- 示例博客文章

**使用方法**：
```bash
mysql -u root -p < database/init.sql
```

### seed_data.sql
**文章种子数据脚本**

包含内容：
- 实用技术文章数据
- 示例博客内容
- 用于开发和测试环境

**使用方法**：
```bash
# 在 init.sql 之后执行
mysql -u root -p myblog < database/seed_data.sql
```

### migrate_remove_like_count.sql
**历史迁移脚本（已整合到 init.sql）**

说明：
- 此脚本用于从旧版本升级
- 删除 tb_blog 和 tb_comment 表的冗余计数字段
- 新安装无需执行（init.sql 已包含正确表结构）
- 保留仅供参考

---

## 🚀 快速开始

### 新项目初始化

1. **创建数据库并初始化表结构**：
```bash
mysql -u root -p < database/init.sql
```

2. **（可选）导入示例文章数据**：
```bash
mysql -u root -p myblog < database/seed_data.sql
```

### 从旧版本升级

如果从包含 like_count/comment_count 字段的旧版本升级：

```bash
mysql -u root -p myblog < database/migrate_remove_like_count.sql
```

---

## 📊 表结构概览

| 表名 | 说明 |
|------|------|
| tb_user | 用户表 |
| tb_blog | 博客文章表 |
| tb_category | 分类表 |
| tb_tag | 标签表 |
| tb_blog_tag | 博客标签关联表 |
| tb_comment | 评论表 |
| tb_user_like | 用户点赞表 |
| tb_user_collection | 用户收藏表 |
| tb_collection_folder | 收藏夹分类表 |
| tb_user_follow | 用户关注关系表 |
| tb_visit_log | 访问日志表 |

---

## ⚠️ 注意事项

1. **字符集**：所有表使用 `utf8mb4` 字符集，支持 emoji 等特殊字符
2. **密码加密**：默认管理员密码使用 BCrypt 加密
3. **逻辑删除**：所有表支持逻辑删除（deleted 字段）
4. **计数字段**：点赞数和评论数通过关联表实时查询，不存储冗余字段

---

## 🔧 维护建议

- 定期备份数据库
- 新增表或字段时更新 init.sql
- 使用迁移脚本记录结构变更
- 生产环境谨慎执行 seed_data.sql

---

**最后更新**: 2025-12-22
