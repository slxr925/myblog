package com.ryan.myblog.service.notification;

/**
 * 通知发布器接口
 * 定义统一的通知发布契约
 * 
 * 实现类：KafkaNotificationPublisher（基于Apache Kafka）
 */
public interface NotificationPublisher {

    /**
     * 发布通知消息
     * 
     * @param message 通知消息对象
     */
    void publish(NotificationMessage message);
}
