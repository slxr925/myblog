package com.ryan.myblog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 数据库连接测试
 */
@SpringBootTest(properties = "spring.config.name=application")
public class DatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void testDatabaseConnection() throws Exception {
        // 测试数据库连接
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "数据库连接应该成功");

            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("数据库产品名称: " + metaData.getDatabaseProductName());
            System.out.println("数据库版本: " + metaData.getDatabaseProductVersion());
            System.out.println("驱动名称: " + metaData.getDriverName());
            System.out.println("驱动版本: " + metaData.getDriverVersion());
            System.out.println("用户名: " + metaData.getUserName());

            assertEquals("MySQL", metaData.getDatabaseProductName(), "应该连接到MySQL数据库");
        }
    }

    @Test
    public void testTableExists() {
        // 测试表是否存在
        List<Map<String, Object>> tables = jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'myblog'"
        );

        System.out.println("数据库中的表:");
        for (Map<String, Object> table : tables) {
            System.out.println("  - " + table.get("table_name"));
        }

        // 验证核心表存在
        List<String> tableNames = tables.stream()
            .map(table -> (String) table.get("table_name"))
            .toList();

        assertTrue(tableNames.contains("tb_user"), "用户表应该存在");
        assertTrue(tableNames.contains("tb_blog"), "博客表应该存在");
        assertTrue(tableNames.contains("tb_comment"), "评论表应该存在");
        assertTrue(tableNames.contains("tb_user_like"), "点赞记录表应该存在");
    }

    @Test
    public void testUserData() {
        // 测试用户数据
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
            "SELECT id, username, email, role, status FROM tb_user WHERE deleted = 0"
        );

        System.out.println("用户数据:");
        for (Map<String, Object> user : users) {
            System.out.printf("  ID: %d, 用户名: %s, 邮箱: %s, 角色: %d, 状态: %d%n",
                user.get("id"), user.get("username"), user.get("email"),
                user.get("role"), user.get("status"));
        }

        assertFalse(users.isEmpty(), "应该存在用户数据");
        assertTrue(users.size() >= 2, "应该至少有2个用户");
    }

    @Test
    public void testBlogData() {
        // 测试博客数据
        List<Map<String, Object>> blogs = jdbcTemplate.queryForList(
            "SELECT id, title, author_id, status, view_count FROM tb_blog WHERE deleted = 0"
        );

        System.out.println("博客数据:");
        for (Map<String, Object> blog : blogs) {
            System.out.printf("  ID: %d, 标题: %s, 作者ID: %s, 状态: %d, 阅读量: %d%n",
                blog.get("id"), blog.get("title"), blog.get("author_id"),
                blog.get("status"), blog.get("view_count"));
        }

        assertFalse(blogs.isEmpty(), "应该存在博客数据");
    }

    @Test
    public void testCommentData() {
        // 测试评论数据
        List<Map<String, Object>> comments = jdbcTemplate.queryForList(
            "SELECT id, blog_id, user_id, status, like_count FROM tb_comment WHERE deleted = 0"
        );

        System.out.println("评论数据:");
        for (Map<String, Object> comment : comments) {
            System.out.printf("  ID: %d, 博客ID: %s, 用户ID: %s, 状态: %d, 点赞数: %d%n",
                comment.get("id"), comment.get("blog_id"), comment.get("user_id"),
                comment.get("status"), comment.get("like_count"));
        }

        assertFalse(comments.isEmpty(), "应该存在评论数据");
    }

    @Test
    public void testUserLikeTable() {
        // 测试点赞记录表
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM tb_user_like WHERE deleted = 0", Integer.class
        );

        System.out.println("点赞记录数量: " + count);
        assertNotNull(count, "应该能够查询点赞记录表");
    }

    @Test
    public void testDatabasePerformance() {
        // 简单的性能测试
        long startTime = System.currentTimeMillis();

        // 执行一些查询
        jdbcTemplate.queryForObject("SELECT COUNT(*) FROM tb_user", Integer.class);
        jdbcTemplate.queryForObject("SELECT COUNT(*) FROM tb_blog", Integer.class);
        jdbcTemplate.queryForObject("SELECT COUNT(*) FROM tb_comment", Integer.class);

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        System.out.println("数据库查询耗时: " + duration + "ms");
        assertTrue(duration < 1000, "数据库查询应该在1秒内完成");
    }
}