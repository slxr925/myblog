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

    @Value("${app.elasticsearch.uris:http://localhost:9200}")
    private String elasticsearchUris;

    @Value("${app.elasticsearch.username:}")
    private String elasticsearchUsername;

    @Value("${app.elasticsearch.password:}")
    private String elasticsearchPassword;
    
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

        var builder = ClientConfiguration.builder()
                .connectedTo(elasticsearchUris.replace("http://", "").replace("https://", ""))
                .withConnectTimeout(10000)
                .withSocketTimeout(60000);

        // 如果配置了用户名和密码，添加认证信息
        if (elasticsearchUsername != null && !elasticsearchUsername.trim().isEmpty()
            && elasticsearchPassword != null && !elasticsearchPassword.trim().isEmpty()) {
            log.info("使用用户名密码认证连接Elasticsearch");
            builder.withBasicAuth(elasticsearchUsername, elasticsearchPassword);
        }

        return builder.build();
    }
}