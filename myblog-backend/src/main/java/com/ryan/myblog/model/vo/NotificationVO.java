package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 通知视图对象
 */
@Data
public class NotificationVO {

    private Long id;

    /**
     * 发送者信息
     */
    private Long senderId;
    private String senderName;
    private String senderAvatar;

    /**
     * 通知类型
     */
    private String type;
    private String typeName;

    /**
     * 通知内容
     */
    private String title;
    private String content;

    /**
     * 关联资源
     */
    private String resourceType;
    private Long resourceId;

    /**
     * 扩展数据
     */
    private Map<String, Object> extraData;

    /**
     * 状态
     */
    private Boolean isRead;
    private LocalDateTime readTime;
    private LocalDateTime createTime;
}
