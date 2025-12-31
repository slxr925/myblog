package com.ryan.myblog.service.notification;

import com.ryan.myblog.common.NotificationType;
import com.ryan.myblog.common.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 通知消息对象
 * 用于Kafka消息传递
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 幂等ID - 用于去重，防止重复消费
     */
    @Builder.Default
    private String idempotentId = UUID.randomUUID().toString();

    /**
     * 通知类型
     */
    private NotificationType type;

    /**
     * 接收者ID
     */
    private Long receiverId;

    /**
     * 发送者ID（系统通知时为空）
     */
    private Long senderId;

    /**
     * 通知标题
     */
    private String title;

    /**
     * 通知内容
     */
    private String content;

    /**
     * 资源类型
     */
    private ResourceType resourceType;

    /**
     * 资源ID（如文章ID、评论ID）
     */
    private Long resourceId;

    /**
     * 扩展数据（如文章标题快照、评论内容快照等）
     */
    private Map<String, Object> extraData;

    /**
     * 创建时间
     */
    @Builder.Default
    private LocalDateTime createTime = LocalDateTime.now();
}
