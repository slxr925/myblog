package com.ryan.myblog.config;

import lombok.extern.slf4j.Slf4j;
import org.elasticsearch.client.RestClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;

/**
 * Elasticsearch配置
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "app.elasticsearch.enabled", havingValue = "true", matchIfMissing = false)
public class ElasticsearchConfig extends ElasticsearchConfiguration {
    
    @Value("${app.elasticsearch.uris:http://localhost:9200}")
    private String elasticsearchUris;

    @Value("${app.elasticsearch.username:}")
    private String elasticsearchUsername;

    @Value("${app.elasticsearch.password:}")
    private String elasticsearchPassword;
    
    @Override
    public ClientConfiguration clientConfiguration() {
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

    @Override
    @Bean
    @Primary
    public RestClient elasticsearchRestClient(ClientConfiguration clientConfiguration) {
        return super.elasticsearchRestClient(clientConfiguration);
    }
}
