package com.ryan.myblog.service.notification.impl;

import com.ryan.myblog.config.KafkaNotificationConfig;
import com.ryan.myblog.handler.NotificationWebSocketHandler;
import com.ryan.myblog.model.entity.Notification;
import com.ryan.myblog.model.vo.NotificationVO;
import com.ryan.myblog.service.NotificationService;
import com.ryan.myblog.service.notification.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Kafka通知消费者
 * 监听通知Topic，处理通知消息
 * 
 * 特点：
 * - 并发消费（3个消费者线程）
 * - 幂等性保证（Redis去重）
 * - 死信队列处理失败消息
 * - 手动确认，确保消息不丢失
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaNotificationConsumer {

    private final NotificationService notificationService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final KafkaTemplate<String, NotificationMessage> kafkaTemplate;
    private final NotificationWebSocketHandler webSocketHandler;

    private static final String IDEMPOTENT_KEY_PREFIX = "notification:consumed:";
    private static final Duration IDEMPOTENT_EXPIRE = Duration.ofDays(7);

    /**
     * 监听通知消息
     * concurrency=3 对应Topic的3个分区
     */
    @KafkaListener(topics = KafkaNotificationConfig.NOTIFICATION_TOPIC, groupId = KafkaNotificationConfig.CONSUMER_GROUP, containerFactory = "kafkaListenerContainerFactory")
    public void consume(ConsumerRecord<String, NotificationMessage> record, Acknowledgment ack) {
        NotificationMessage message = record.value();

        log.info("[Kafka Consumer] 接收消息: partition={}, offset={}, idempotentId={}",
                record.partition(), record.offset(), message.getIdempotentId());

        try {
            // 1. 幂等性检查
            String idempotentKey = IDEMPOTENT_KEY_PREFIX + message.getIdempotentId();
            Boolean isNew = redisTemplate.opsForValue()
                    .setIfAbsent(idempotentKey, "1", IDEMPOTENT_EXPIRE);

            if (Boolean.FALSE.equals(isNew)) {
                log.warn("[Kafka Consumer] 重复消息,跳过: idempotentId={}", message.getIdempotentId());
                ack.acknowledge();
                return;
            }

            // 2. 处理通知
            processNotification(message);

            // 3. 手动确认
            ack.acknowledge();
            log.info("[Kafka Consumer] 消息处理完成: idempotentId={}", message.getIdempotentId());

        } catch (Exception e) {
            log.error("[Kafka Consumer] 消息处理失败,发送到DLQ: idempotentId={}, error={}",
                    message.getIdempotentId(), e.getMessage(), e);

            // 发送到死信队列
            sendToDLQ(message, e);

            // 仍然确认消息，避免无限重试
            ack.acknowledge();
        }
    }

    /**
     * 处理通知消息
     */
    private void processNotification(NotificationMessage message) {
        // 1. 检查用户通知设置
        if (!notificationService.isNotificationEnabled(message.getReceiverId(), message.getType())) {
            log.info("[Kafka Consumer] 用户已关闭该类型通知: userId={}, type={}",
                    message.getReceiverId(), message.getType());
            return;
        }

        // 2. 保存到数据库
        Notification notification = notificationService.create(message);

        // 3. 更新Redis未读计数
        notificationService.incrementUnreadCount(message.getReceiverId());

        // 4. 获取最新未读数
        Long unreadCount = notificationService.getUnreadCount(message.getReceiverId());

        // 5. WebSocket实时推送通知
        NotificationVO vo = notificationService.toVO(notification);
        webSocketHandler.sendNotification(message.getReceiverId(), vo);

        // 6. WebSocket实时推送未读数更新
        webSocketHandler.sendUnreadCount(message.getReceiverId(), unreadCount);

        log.info("[Kafka Consumer] 通知处理完成: id={}, receiver={}, unreadCount={}",
                notification.getId(), message.getReceiverId(), unreadCount);
    }

    /**
     * 发送到死信队列
     */
    private void sendToDLQ(NotificationMessage message, Exception e) {
        try {
            // 添加错误信息到extraData
            if (message.getExtraData() != null) {
                message.getExtraData().put("dlq_error", e.getMessage());
            }

            kafkaTemplate.send(KafkaNotificationConfig.DLQ_TOPIC, message);
            log.info("[Kafka Consumer] 消息已发送到DLQ: idempotentId={}", message.getIdempotentId());
        } catch (Exception dlqEx) {
            log.error("[Kafka Consumer] 发送到DLQ失败: idempotentId={}", message.getIdempotentId(), dlqEx);
        }
    }

}
