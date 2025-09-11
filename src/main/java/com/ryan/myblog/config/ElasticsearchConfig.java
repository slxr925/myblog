package com.ryan.myblog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

/**
 * Elasticsearch配置类
 */
@Configuration
@EnableElasticsearchRepositories(basePackages = "com.ryan.myblog.repository")
public class ElasticsearchConfig extends ElasticsearchConfiguration {
    
    @Override
    public ClientConfiguration clientConfiguration() {
        return ClientConfiguration.builder()
                .connectedTo("localhost:9200")
                .withConnectTimeout(10000)
                .withSocketTimeout(60000)
                .build();
    }
}