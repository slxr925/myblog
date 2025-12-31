package com.ryan.myblog.common;

import lombok.Getter;

/**
 * 通知类型枚举
 */
@Getter
public enum NotificationType {

    /**
     * 评论通知：文章被评论、评论被回复
     */
    COMMENT("评论", "有人评论了你"),

    /**
     * 点赞通知：文章被点赞、评论被点赞
     */
    LIKE("点赞", "有人点赞了你"),

    /**
     * 关注通知：被其他用户关注
     */
    FOLLOW("关注", "有人关注了你"),

    /**
     * 收藏通知：文章被收藏
     */
    COLLECTION("收藏", "有人收藏了你的文章"),

    /**
     * 系统通知：管理员公告、账户安全提醒
     */
    SYSTEM("系统", "系统消息"),

    /**
     * 新文章通知：关注的作者发布新文章
     */
    NEW_ARTICLE("新文章", "你关注的作者发布了新文章"),

    /**
     * @提及通知：在评论中被@
     */
    MENTION("提及", "有人在评论中@了你"),

    /**
     * 统计通知：周报/月报、互动里程碑
     */
    STATS("统计", "你的数据统计");

    private final String name;
    private final String description;

    NotificationType(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
