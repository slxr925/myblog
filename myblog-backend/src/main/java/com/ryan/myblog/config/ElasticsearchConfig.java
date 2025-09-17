package com.ryan.myblog.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;

/**
 * Elasticsearch配置
 */
@Slf4j
@Configuration
public class ElasticsearchConfig extends ElasticsearchConfiguration {
    
    @Value("${app.elasticsearch.enabled:false}")
    private boolean elasticsearchEnabled;
    
    @Value("${spring.elasticsearch.uris:http://localhost:9200}")
    private String elasticsearchUris;
    
    @Override
    public ClientConfiguration clientConfiguration() {
        if (!elasticsearchEnabled) {
            log.warn("Elasticsearch被禁用，跳过配置");
            // 返回一个虚拟配置，但实际不会连接
            return ClientConfiguration.builder()
                    .connectedTo("localhost:9200")
                    .build();
        }
        
        log.info("配置Elasticsearch连接: {}", elasticsearchUris);
        return ClientConfiguration.builder()
                .connectedTo(elasticsearchUris.replace("http://", ""))
                .withConnectTimeout(10000)
                .withSocketTimeout(60000)
                .build();
    }
}