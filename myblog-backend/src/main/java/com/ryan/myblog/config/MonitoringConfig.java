package com.ryan.myblog.config;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 监控配置类
 */
@Configuration
public class MonitoringConfig {

    @Bean
    public MeterRegistryCustomizer<MeterRegistry> monitoringCommonTags(
            @Value("${spring.application.name:myblog}") String applicationName) {
        return registry -> registry.config().commonTags("application", applicationName);
    }
}