# 雪花算法迁移策略

## 现状分析

MyBlog 项目现有表都使用 MySQL 自增主键：
- `id BIGINT AUTO_INCREMENT PRIMARY KEY`
- 已有大量生产数据

## 推荐方案：渐进式迁移（双模式共存）

### 策略说明

老表保持自增ID，新表使用雪花ID，两者共存。

### 具体实现

```java
// 老表实体 - 保持自增ID
@TableName("tb_blog")
public class Blog {
    @TableId(type = IdType.AUTO)  // 继续使用自增
    private Long id;
    // ...
}

// 新表实体 - 使用雪花ID
@TableName("tb_browse_history")
public class BrowseHistory {
    @TableId(type = IdType.ASSIGN_ID)  // 使用雪花算法
    private Long id;
    // ...
}
```

### 为什么不迁移老数据？

1. **风险大**：需要停机，修改外键关联
2. **收益小**：现有数据量不大，自增ID够用
3. **成本高**：需要双写、数据校验、回滚方案

### 如果一定要迁移（不推荐）

假设需要迁移 `tb_blog` 表：

#### 方案一：停机迁移（适合小数据量）

```sql
-- 1. 备份表
CREATE TABLE tb_blog_backup AS SELECT * FROM tb_blog;

-- 2. 清空表（保留结构）
TRUNCATE TABLE tb_blog;

-- 3. 修改主键类型（如果需要）
ALTER TABLE tb_blog MODIFY id BIGINT NOT NULL;
ALTER TABLE tb_blog DROP PRIMARY KEY;
ALTER TABLE tb_blog ADD PRIMARY KEY (id);

-- 4. 使用应用层重新插入数据（新ID由雪花算法生成）
-- Java代码循环插入...

-- 5. 更新外键关联表
UPDATE tb_comment c
JOIN tb_blog_backup b ON c.blog_id = b.id
SET c.blog_id = (SELECT id FROM tb_blog WHERE title = b.title LIMIT 1);
```

#### 方案二：双写迁移（适合大数据量，无停机）

```java
// 1. 新增雪花ID字段
ALTER TABLE tb_blog ADD COLUMN snowflake_id BIGINT;

// 2. 应用层双写
public Blog saveBlog(Blog blog) {
    // 保存时同时生成雪花ID
    blog.setSnowflakeId(snowflakeIdGenerator.nextId());
    blogMapper.insert(blog);  // 自增ID正常生成
    return blog;
}

// 3. 逐步迁移老数据
@Scheduled(cron = "0 0 2 * * ?")  // 每天凌晨2点
public void migrateOldData() {
    List<Blog> oldBlogs = blogMapper.selectList(
        new LambdaQueryWrapper<Blog>()
            .isNull(Blog::getSnowflakeId)
            .last("LIMIT 1000")
    );
    
    for (Blog blog : oldBlogs) {
        blog.setSnowflakeId(snowflakeIdGenerator.nextId());
        blogMapper.updateById(blog);
    }
}

// 4. 迁移完成后切换主键（需停机）
ALTER TABLE tb_blog DROP PRIMARY KEY;
ALTER TABLE tb_blog CHANGE snowflake_id id BIGINT PRIMARY KEY;
ALTER TABLE tb_blog DROP COLUMN old_id;
```

## 推荐的最终策略

**保持现状，新功能使用雪花ID**

- ✅ 零风险
- ✅ 无需停机
- ✅ 面试时展示技术储备即可

**面试时如何回答：**

> "项目使用雪花算法作为分布式ID生成器，为未来分库分表做准备。
> 现有表保持自增ID以保证稳定性，新表和新功能使用雪花ID。
> 这样既避免了老数据迁移的风险，又具备了横向扩展能力。"

## 配置说明

在 `application.yml` 中配置机器ID：

```yaml
myblog:
  snowflake:
    datacenter-id: 0  # 数据中心ID (0-31)
    worker-id: 0      # 机器ID (0-31)
```

如果部署多实例，每个实例配置不同的 `worker-id`。
