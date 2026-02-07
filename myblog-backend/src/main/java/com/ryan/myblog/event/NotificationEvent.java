package com.ryan.myblog.event;

import com.ryan.myblog.common.NotificationType;
import com.ryan.myblog.common.ResourceType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.Map;

/**
 * 通知事件
 * 用于业务层发布通知事件，解耦业务逻辑与通知处理
 */
@Getter
public class NotificationEvent extends ApplicationEvent {

    private final NotificationType type;
    private final Long receiverId;
    private final Long senderId;
    private final String title;
    private final String content;
    private final ResourceType resourceType;
    private final Long resourceId;
    private final Map<String, Object> extraData;

    public NotificationEvent(Object source,
            NotificationType type,
            Long receiverId,
            Long senderId,
            String title,
            String content,
            ResourceType resourceType,
            Long resourceId,
            Map<String, Object> extraData) {
        super(source);
        this.type = type;
        this.receiverId = receiverId;
        this.senderId = senderId;
        this.title = title;
        this.content = content;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.extraData = extraData;
    }

    /**
     * 创建评论通知事件
     */
    public static NotificationEvent commentEvent(Object source,
            Long receiverId,
            Long senderId,
            String blogTitle,
            String commentContent,
            Long blogId,
            Map<String, Object> extraData) {
        String title = "收到新评论";
        String content = String.format("有人评论了你的文章《%s》", blogTitle);
        return new NotificationEvent(source, NotificationType.COMMENT, receiverId, senderId,
                title, content, ResourceType.BLOG, blogId, extraData);
    }

    /**
     * 创建评论回复通知事件
     */
    public static NotificationEvent replyEvent(Object source,
            Long receiverId,
            Long senderId,
            String replyContent,
            Long commentId,
            Map<String, Object> extraData) {
        String title = "收到新回复";
        String content = "有人回复了你的评论";
        return new NotificationEvent(source, NotificationType.COMMENT, receiverId, senderId,
                title, content, ResourceType.COMMENT, commentId, extraData);
    }

    /**
     * 创建点赞通知事件
     */
    public static NotificationEvent likeEvent(Object source,
            Long receiverId,
            Long senderId,
            String blogTitle,
            Long blogId,
            Map<String, Object> extraData) {
        String title = "收到点赞";
        String content = String.format("有人点赞了你的文章《%s》", blogTitle);
        return new NotificationEvent(source, NotificationType.LIKE, receiverId, senderId,
                title, content, ResourceType.BLOG, blogId, extraData);
    }

    /**
     * 创建关注通知事件
     */
    public static NotificationEvent followEvent(Object source,
            Long receiverId,
            Long senderId,
            String senderName,
            Map<String, Object> extraData) {
        String title = "有新粉丝";
        String content = String.format("%s 关注了你", senderName);
        return new NotificationEvent(source, NotificationType.FOLLOW, receiverId, senderId,
                title, content, ResourceType.USER, senderId, extraData);
    }

    /**
     * 创建收藏通知事件
     */
    public static NotificationEvent collectionEvent(Object source,
            Long receiverId,
            Long senderId,
            String blogTitle,
            Long blogId,
            Map<String, Object> extraData) {
        String title = "文章被收藏";
        String content = String.format("有人收藏了你的文章《%s》", blogTitle);
        return new NotificationEvent(source, NotificationType.COLLECTION, receiverId, senderId,
                title, content, ResourceType.BLOG, blogId, extraData);
    }

    /**
     * 创建系统通知事件
     */
    public static NotificationEvent systemEvent(Object source,
            Long receiverId,
            String title,
            String content,
            Map<String, Object> extraData) {
        return new NotificationEvent(source, NotificationType.SYSTEM, receiverId, null,
                title, content, null, null, extraData);
    }

    /**
     * 创建@提及通知事件
     */
    public static NotificationEvent mentionEvent(Object source,
            Long receiverId,
            Long senderId,
            String commentContent,
            Long commentId,
            Map<String, Object> extraData) {
        String title = "有人提及了你";
        String content = "你在评论中被@提及";
        return new NotificationEvent(source, NotificationType.MENTION, receiverId, senderId,
                title, content, ResourceType.COMMENT, commentId, extraData);
    }
}
