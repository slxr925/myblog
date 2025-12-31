package com.ryan.myblog.common;

import lombok.Getter;

/**
 * 资源类型枚举
 * 用于标识通知关联的资源类型
 */
@Getter
public enum ResourceType {

    /**
     * 博客文章
     */
    BLOG("博客"),

    /**
     * 评论
     */
    COMMENT("评论"),

    /**
     * 用户
     */
    USER("用户");

    private final String name;

    ResourceType(String name) {
        this.name = name;
    }
}
