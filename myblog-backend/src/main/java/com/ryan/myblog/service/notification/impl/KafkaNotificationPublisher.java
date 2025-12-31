package com.ryan.myblog.service.notification.impl;

import com.ryan.myblog.config.KafkaNotificationConfig;
import com.ryan.myblog.service.notification.NotificationMessage;
import com.ryan.myblog.service.notification.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Kafka通知发布器实现
 * 基于Apache Kafka实现分布式消息队列
 * 
 * 特点：
 * - 消息持久化到磁盘
 * - 支持高吞吐量（百万级/秒）
 * - 使用用户ID作为分区Key，保证同一用户消息有序
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaNotificationPublisher implements NotificationPublisher {

    private final KafkaTemplate<String, NotificationMessage> kafkaTemplate;

    @Override
    public void publish(NotificationMessage message) {
        String key = String.valueOf(message.getReceiverId());

        log.info("[Kafka] 发送通知消息: topic={}, key={}, idempotentId={}",
                KafkaNotificationConfig.NOTIFICATION_TOPIC, key, message.getIdempotentId());

        CompletableFuture<SendResult<String, NotificationMessage>> future = kafkaTemplate
                .send(KafkaNotificationConfig.NOTIFICATION_TOPIC, key, message);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("[Kafka] 消息发送成功: partition={}, offset={}, idempotentId={}",
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset(),
                        message.getIdempotentId());
            } else {
                log.error("[Kafka] 消息发送失败: idempotentId={}, error={}",
                        message.getIdempotentId(), ex.getMessage(), ex);
                // 可以在这里添加降级逻辑，如写入Redis队列或直接同步处理
            }
        });
    }
}
