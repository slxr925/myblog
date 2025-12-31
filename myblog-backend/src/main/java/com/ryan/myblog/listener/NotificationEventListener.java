package com.ryan.myblog.listener;

import com.ryan.myblog.event.NotificationEvent;
import com.ryan.myblog.service.notification.NotificationMessage;
import com.ryan.myblog.service.notification.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 通知事件监听器
 * 
 * 使用@TransactionalEventListener确保只有在事务成功提交后才发送通知
 * 避免"通知已发送但数据库回滚"的问题
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationPublisher notificationPublisher;

    /**
     * 监听通知事件
     * 在事务提交后执行，确保数据一致性
     */
    @org.springframework.context.event.EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("收到通知事件: type={}, receiver={}, sender={}",
                event.getType(), event.getReceiverId(), event.getSenderId());

        // 不给自己发通知
        if (event.getSenderId() != null && event.getSenderId().equals(event.getReceiverId())) {
            log.debug("发送者和接收者相同,跳过通知: userId={}", event.getSenderId());
            return;
        }

        // 构建通知消息
        NotificationMessage message = NotificationMessage.builder()
                .type(event.getType())
                .receiverId(event.getReceiverId())
                .senderId(event.getSenderId())
                .title(event.getTitle())
                .content(event.getContent())
                .resourceType(event.getResourceType())
                .resourceId(event.getResourceId())
                .extraData(event.getExtraData())
                .build();

        // 发布到Kafka
        notificationPublisher.publish(message);

        log.info("通知事件已发布: idempotentId={}", message.getIdempotentId());
    }
}
