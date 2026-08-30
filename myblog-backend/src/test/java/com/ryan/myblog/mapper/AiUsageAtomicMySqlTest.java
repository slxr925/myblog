package com.ryan.myblog.mapper;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Testcontainers(disabledWithoutDocker = true)
class AiUsageAtomicMySqlTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("myblog_test")
            .withUsername("test")
            .withPassword("test");

    @BeforeAll
    static void createSchema() throws Exception {
        try (Connection connection = connection(); Statement statement = connection.createStatement()) {
            statement.execute("""
                    CREATE TABLE tb_ai_usage_daily (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        user_id BIGINT NOT NULL,
                        usage_date DATE NOT NULL,
                        request_count INT NOT NULL DEFAULT 0,
                        token_count INT NOT NULL DEFAULT 0,
                        create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY uk_user_date (user_id, usage_date)
                    ) ENGINE=InnoDB
                    """);
        }
    }

    @Test
    void concurrentUpdatesNeverConsumeMoreThanThreeRequests() throws Exception {
        int attempts = 12;
        try (var executor = Executors.newFixedThreadPool(attempts)) {
            List<Callable<Integer>> tasks = new ArrayList<>();
            for (int i = 0; i < attempts; i++) {
                tasks.add(AiUsageAtomicMySqlTest::tryConsume);
            }
            int successful = executor.invokeAll(tasks).stream().mapToInt(future -> {
                try {
                    return future.get();
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }).sum();

            assertEquals(3, successful);
            try (Connection connection = connection();
                 PreparedStatement statement = connection.prepareStatement(
                         "SELECT request_count FROM tb_ai_usage_daily WHERE user_id = 99 AND usage_date = ?")) {
                statement.setObject(1, LocalDate.now());
                try (ResultSet resultSet = statement.executeQuery()) {
                    resultSet.next();
                    assertEquals(3, resultSet.getInt(1));
                }
            }
        }
    }

    private static int tryConsume() throws Exception {
        try (Connection connection = connection()) {
            try (PreparedStatement insert = connection.prepareStatement(
                    "INSERT IGNORE INTO tb_ai_usage_daily " +
                            "(user_id, usage_date, request_count, token_count) VALUES (99, ?, 0, 0)")) {
                insert.setObject(1, LocalDate.now());
                insert.executeUpdate();
            }
            try (PreparedStatement update = connection.prepareStatement(
                    "UPDATE tb_ai_usage_daily SET request_count = request_count + 1, token_count = token_count + 1 " +
                            "WHERE user_id = 99 AND usage_date = ? AND request_count < 3 " +
                            "AND token_count + 1 <= 50000")) {
                update.setObject(1, LocalDate.now());
                return update.executeUpdate();
            }
        }
    }

    private static Connection connection() throws Exception {
        return DriverManager.getConnection(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
    }
}
