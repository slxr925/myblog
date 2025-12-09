-- 修复评论表 parent_id 外键约束问题
-- 解决生产环境评论提交失败的问题

USE myblog;

-- 删除 parent_id 的外键约束
ALTER TABLE tb_comment DROP FOREIGN KEY tb_comment_ibfk_3;

-- 修改字段允许 NULL
ALTER TABLE tb_comment MODIFY COLUMN parent_id BIGINT DEFAULT NULL COMMENT '父评论ID，NULL表示顶级评论';

-- 更新现有的 0 值为 NULL
UPDATE tb_comment SET parent_id = NULL WHERE parent_id = 0;