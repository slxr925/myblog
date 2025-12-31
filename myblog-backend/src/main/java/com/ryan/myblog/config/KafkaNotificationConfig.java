package com.ryan.myblog.config;

import com.ryan.myblog.service.notification.NotificationMessage;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka配置类
 * 通知系统基于Apache Kafka实现分布式消息队列
 * 
 * 本地开发：直接安装Kafka KRaft模式
 * 生产环境：Docker部署Kafka
 */
@Slf4j
@Configuration
@EnableKafka
public class KafkaNotificationConfig {

    public static final String NOTIFICATION_TOPIC = "blog-notifications";
    public static final String DLQ_TOPIC = "blog-notifications-dlq";
    public static final String CONSUMER_GROUP = "notification-consumer-group";

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    /**
     * 创建通知主题
     * 3个分区支持并发消费
     */
    @Bean
    public NewTopic notificationTopic() {
        log.info("创建Kafka Topic: {}", NOTIFICATION_TOPIC);
        return TopicBuilder.name(NOTIFICATION_TOPIC)
                .partitions(3)
                .replicas(1) // 本地单实例
                .build();
    }

    /**
     * 创建死信队列主题
     * 用于存储处理失败的消息
     */
    @Bean
    public NewTopic dlqTopic() {
        log.info("创建Kafka DLQ Topic: {}", DLQ_TOPIC);
        return TopicBuilder.name(DLQ_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    /**
     * Kafka生产者工厂
     * 配置序列化器和可靠性参数
     */
    @Bean
    public ProducerFactory<String, NotificationMessage> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

        // 可靠性配置
        config.put(ProducerConfig.ACKS_CONFIG, "all"); // 等待所有副本确认
        config.put(ProducerConfig.RETRIES_CONFIG, 3); // 重试3次
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true); // 开启幂等性

        return new DefaultKafkaProducerFactory<>(config);
    }

    /**
     * Kafka消费者工厂
     * 配置反序列化器和消费参数
     */
    @Bean
    public ConsumerFactory<String, NotificationMessage> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, CONSUMER_GROUP);
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);

        // 消费配置
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false); // 手动提交

        // JSON反序列化配置
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.ryan.myblog.*");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, NotificationMessage.class.getName());

        return new DefaultKafkaConsumerFactory<>(config);
    }

    /**
     * KafkaTemplate用于发送消息
     */
    @Bean
    public KafkaTemplate<String, NotificationMessage> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    /**
     * Kafka监听器容器工厂
     * 配置并发消费和手动确认
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, NotificationMessage> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, NotificationMessage> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3); // 3个消费者线程，对应3个分区
        factory.getContainerProperties().setAckMode(
                org.springframework.kafka.listener.ContainerProperties.AckMode.MANUAL);
        return factory;
    }
}
