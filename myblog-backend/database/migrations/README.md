# MyBlog 数据库迁移记录

## 2026-02-07 收藏分享功能字段添加

### 问题
收藏分享功能需要以下字段，但`tb_collection_folder`表中缺失：
- `is_public` - 标记收藏夹是否公开
- `share_code` - 分享码
- `share_expire_time` - 分享过期时间

### 解决方案
执行以下SQL添加缺失字段：

```sql
-- 添加公开收藏字段
ALTER TABLE tb_collection_folder 
ADD COLUMN is_public TINYINT(1) DEFAULT 0 COMMENT '是否公开（0私有1公开）',
ADD COLUMN share_code VARCHAR(32) DEFAULT NULL COMMENT '分享码',
ADD COLUMN share_expire_time DATETIME DEFAULT NULL COMMENT '分享过期时间';

-- 添加索引
CREATE INDEX idx_share_code ON tb_collection_folder(share_code);
```

### 验证
```sql
DESCRIBE tb_collection_folder;
-- 应该看到新增的三列
```

### 回滚
如需回滚（不推荐）：
```sql
ALTER TABLE tb_collection_folder 
DROP COLUMN is_public,
DROP COLUMN share_code,
DROP COLUMN share_expire_time;
```
