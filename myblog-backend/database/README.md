# 数据库初始化指南

## 📋 说明

博客系统需要8个核心表才能正常运行。我已经提供了完整的数据库初始化脚本。

## 🗄️ 数据库表清单

### 核心业务表
1. **`tb_user`** - 用户表
2. **`tb_blog`** - 博客文章表
3. **`tb_category`** - 文章分类表
4. **`tb_tag`** - 文章标签表
5. **`tb_blog_tag`** - 博客标签关联表
6. **`tb_comment`** - 评论表

### 交互功能表
7. **`tb_user_like`** - 用户点赞表 ⭐ **必需**
8. **`tb_visit_log`** - 访问日志表 ⭐ **必需**

## 🚀 初始化步骤

### 1. 创建数据库
```sql
CREATE DATABASE IF NOT EXISTS myblog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE myblog;
```

### 2. 运行初始化脚本
```bash
# MySQL命令行
mysql -u root -p myblog < init.sql

# 或者使用MySQL Workbench、phpMyAdmin等工具执行init.sql文件
```

### 3. 验证表是否创建成功
```sql
-- 运行检查脚本
mysql -u root -p myblog < check_tables.sql
```

## ⚠️ 重要提醒

### 如果没有运行init.sql，以下功能将无法工作：

1. **访问统计功能** - 需要 `tb_visit_log` 表
   - 后端会报错：`Table 'myblog.tb_visit_log' doesn't exist`
   - 管理控制台无法显示真实访问量

2. **点赞功能** - 需要 `tb_user_like` 表
   - 用户无法点赞博客或评论
   - 点赞数据无法持久化保存

3. **评论功能** - 需要 `tb_comment` 表
   - 评论系统完全无法工作

## 🔧 故障排除

### 检查表是否存在
```sql
SHOW TABLES LIKE 'tb_%';
```

### 单独创建缺失的表

如果只需要创建访问日志表：
```sql
CREATE TABLE IF NOT EXISTS tb_visit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    page VARCHAR(255) NOT NULL COMMENT '访问的页面',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    user_id BIGINT COMMENT '用户ID（如果已登录）',
    visit_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_page (page),
    INDEX idx_ip_address (ip_address),
    INDEX idx_user_id (user_id),
    INDEX idx_visit_time (visit_time),
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访问日志表';
```

如果只需要创建点赞表：
```sql
CREATE TABLE IF NOT EXISTS tb_user_like (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    target_id BIGINT NOT NULL COMMENT '目标ID（博客或评论）',
    target_type TINYINT NOT NULL COMMENT '目标类型：1-博客，2-评论',
    status TINYINT DEFAULT 1 COMMENT '状态：0-取消点赞，1-已点赞',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_target (target_id, target_type),
    INDEX idx_status (status),
    UNIQUE KEY uk_user_target (user_id, target_id, target_type),
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户点赞表';
```

## 📝 配置验证

确保你的 `.env` 文件中的数据库配置正确：

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=myblog
DB_USERNAME=root
DB_PASSWORD=你的MySQL密码
```

## ✅ 成功标志

运行初始化脚本后，你应该能看到：

1. **8个表** 全部创建成功
2. **默认管理员用户** - 用户名: `admin`, 密码: `admin123`
3. **示例数据** - 3个分类，10个标签，3篇示例文章
4. **功能正常** - 访问统计、点赞、评论功能都可以正常使用

## 🆘 如果仍有问题

1. 检查MySQL服务是否启动
2. 确认数据库连接配置正确
3. 查看Spring Boot启动日志中的数据库连接信息
4. 运行 `check_tables.sql` 确认表状态