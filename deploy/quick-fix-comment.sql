-- 修复评论功能外键约束问题
-- 在服务器上直接执行: mysql -h172.17.0.1 -P13306 -uroot -p myblog < deploy/quick-fix-comment.sql

USE myblog;

-- 显示当前的外键约束
SHOW CREATE TABLE tb_comment\G

-- 方案1: 如果可以接受暂时删除外键约束
-- ALTER TABLE tb_comment DROP FOREIGN KEY tb_comment_ibfk_3;

-- 方案2: 修改字段允许NULL并更新数据
-- ALTER TABLE tb_comment MODIFY COLUMN parent_id BIGINT NULL;
-- UPDATE tb_comment SET parent_id = NULL WHERE parent_id = 0;

-- 查看当前的parent_id分布
SELECT
    parent_id,
    COUNT(*) as count
FROM tb_comment
GROUP BY parent_id
ORDER BY parent_id;