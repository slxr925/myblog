package com.ryan.myblog.common;

import lombok.Getter;

import java.util.concurrent.TimeUnit;

/**
 * Redis缓存键工厂
 * 
 * 统一管理所有Redis Key的定义、命名规范、TTL策略
 * 
 * 命名规范: myblog:[module]:[function]:[identifier]
 * - Root: myblog (项目隔离)
 * - Module: user, blog, system (业务模块)
 * - Function: detail, list, hot (功能点)
 * - Identifier: 动态参数 (id, limit, pattern)
 * 
 * 使用示例:
 * 
 * <pre>
 * String key = RedisKeyFactory.BLOG_DETAIL.getKey(blogId);
 * long ttl = RedisKeyFactory.BLOG_DETAIL.getExpire();
 * TimeUnit unit = RedisKeyFactory.BLOG_DETAIL.getTimeUnit();
 * </pre>
 */
@Getter
public enum RedisKeyFactory {

    // ==================== 博客模块 ====================

    /**
     * 博客详情缓存
     * Key: myblog:blog:detail:{blogId}
     * TTL: 30分钟
     */
    BLOG_DETAIL("blog:detail:%s", 30, TimeUnit.MINUTES, "博客详情缓存"),

    /**
     * 热门博客列表
     * Key: myblog:blog:hot:{limit}
     * TTL: 10分钟
     */
    BLOG_HOT_LIST("blog:hot:%d", 10, TimeUnit.MINUTES, "热门博客列表"),

    /**
     * 最新博客列表
     * Key: myblog:blog:latest:{limit}
     * TTL: 10分钟
     */
    BLOG_LATEST_LIST("blog:latest:%d", 10, TimeUnit.MINUTES, "最新博客列表"),

    /**
     * 分类博客列表
     * Key: myblog:blog:category:{categoryId}:{page}
     * TTL: 15分钟
     */
    BLOG_CATEGORY_LIST("blog:category:%s", 15, TimeUnit.MINUTES, "分类博客列表"),

    /**
     * 标签博客列表
     * Key: myblog:blog:tags:{tagId}:{page}
     * TTL: 15分钟
     */
    BLOG_TAG_LIST("blog:tags:%s", 15, TimeUnit.MINUTES, "标签博客列表"),

    // ==================== 点赞模块 ====================

    /**
     * 博客点赞用户集合 (ZSet)
     * Key: myblog:blog:likes:{blogId}
     * TTL: 7天 (长期保留，定期同步到DB)
     */
    BLOG_LIKES_SET("blog:likes:%s", 7, TimeUnit.DAYS, "博客点赞用户集合"),

    /**
     * 博客点赞总数
     * Key: myblog:blog:like:count:{blogId}
     * TTL: 7天
     */
    BLOG_LIKE_COUNT("blog:like:count:%s", 7, TimeUnit.DAYS, "博客点赞总数"),

    /**
     * 博客浏览计数窗口
     * Key: myblog:blog:view:{blogId}
     * TTL: 5分钟
     */
    BLOG_VIEW("blog:view:%s", 5, TimeUnit.MINUTES, "博客浏览计数窗口"),

    /**
     * 博客分页缓存
     * Key: myblog:blog:page:*
     * TTL: 15分钟
     */
    BLOG_PAGE("blog:page:%s", 15, TimeUnit.MINUTES, "博客分页缓存"),

    // ==================== 用户模块 ====================

    /**
     * 用户资料缓存
     * Key: myblog:user:profile:{userId}
     * TTL: 1小时
     */
    USER_PROFILE("user:profile:%s", 1, TimeUnit.HOURS, "用户资料缓存"),

    /**
     * 用户Token
     * Key: myblog:user:token:{userId}
     * TTL: 24小时
     */
    USER_TOKEN("user:token:%s", 24, TimeUnit.HOURS, "用户Token"),

    /**
     * 用户登录锁定
     * Key: myblog:login:lock:user:{username}
     * TTL: 30分钟
     */
    USER_LOGIN_LOCK("login:lock:user:%s", 30, TimeUnit.MINUTES, "用户登录锁定"),

    /**
     * 用户登录失败计数
     * Key: myblog:login:fail:user:{username}
     * TTL: 15分钟
     */
    USER_LOGIN_FAIL("login:fail:user:%s", 15, TimeUnit.MINUTES, "用户登录失败计数"),

    // ==================== 分类模块 ====================

    /**
     * 分类列表
     * Key: myblog:category:list
     * TTL: 1小时
     */
    CATEGORY_LIST("category:list", 1, TimeUnit.HOURS, "分类列表"),

    /**
     * 分类详情
     * Key: myblog:category:detail:{categoryId}
     * TTL: 1小时
     */
    CATEGORY_DETAIL("category:detail:%s", 1, TimeUnit.HOURS, "分类详情"),

    // ==================== 标签模块 ====================

    /**
     * 标签列表
     * Key: myblog:tag:list
     * TTL: 1小时
     */
    TAG_LIST("tag:list", 1, TimeUnit.HOURS, "标签列表"),

    // ==================== 评论模块 ====================

    /**
     * 博客评论数
     * Key: myblog:comment:count:{blogId}
     * TTL: 30分钟
     */
    COMMENT_COUNT("comment:count:%s", 30, TimeUnit.MINUTES, "博客评论数"),

    // ==================== 系统模块 ====================

    /**
     * 系统配置
     * Key: myblog:sys:config:{configKey}
     * TTL: 7天 (配置变更频率低)
     */
    SYS_CONFIG("sys:config:%s", 7, TimeUnit.DAYS, "系统配置"),

    /**
     * 缓存版本号
     * Key: myblog:cache:version:{pattern}
     * TTL: 永久 (手动管理)
     */
    CACHE_VERSION("cache:version:%s", -1, TimeUnit.SECONDS, "缓存版本号");

    /**
     * 项目前缀
     */
    private static final String PROJECT_PREFIX = "myblog:";

    /**
     * Key模式（不含项目前缀）
     */
    private final String pattern;

    /**
     * 过期时间
     * -1 表示永不过期（需手动管理）
     */
    private final long expire;

    /**
     * 时间单位
     */
    private final TimeUnit timeUnit;

    /**
     * 描述信息
     */
    private final String description;

    RedisKeyFactory(String pattern, long expire, TimeUnit timeUnit, String description) {
        this.pattern = pattern;
        this.expire = expire;
        this.timeUnit = timeUnit;
        this.description = description;
    }

    /**
     * 生成完整的Redis Key
     * 
     * @param args 动态参数，按pattern中的占位符顺序传入
     * @return 完整的Redis Key，格式: myblog:[module]:[function]:[identifier]
     */
    public String getKey(Object... args) {
        String formattedKey = String.format(pattern, args);
        return PROJECT_PREFIX + formattedKey;
    }

    /**
     * 生成Key的模式（用于批量删除）
     * 
     * @return Key模式，例如: myblog:blog:detail:*
     */
    public String getPattern() {
        // 将占位符替换为通配符
        String wildcardPattern = pattern.replaceAll("%[sd]", "*");
        return PROJECT_PREFIX + wildcardPattern;
    }

    /**
     * 获取过期时间（秒）
     * 
     * @return 过期时间的秒数，-1表示永不过期
     */
    public long getExpireSeconds() {
        if (expire < 0) {
            return -1;
        }
        return timeUnit.toSeconds(expire);
    }

    /**
     * 是否有过期时间
     * 
     * @return true表示有TTL，false表示永不过期
     */
    public boolean hasExpire() {
        return expire > 0;
    }
}
