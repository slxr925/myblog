package com.ryan.myblog.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.elasticsearch.client.RestClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RAG向量检索使用的低层Elasticsearch客户端。
 */
@Slf4j
@Configuration
public class RagVectorStoreConfig {

    @Value("${app.elasticsearch.uris:http://localhost:9200}")
    private String elasticsearchUris;

    @Value("${app.elasticsearch.username:}")
    private String elasticsearchUsername;

    @Value("${app.elasticsearch.password:}")
    private String elasticsearchPassword;

    @Bean(name = "ragRestClient", destroyMethod = "close")
    public RestClient ragRestClient() {
        HttpHost[] hosts = java.util.Arrays.stream(elasticsearchUris.split(","))
                .map(String::trim)
                .filter(uri -> !uri.isEmpty())
                .map(HttpHost::create)
                .toArray(HttpHost[]::new);
        if (hosts.length == 0) {
            hosts = new HttpHost[] { HttpHost.create("http://localhost:9200") };
        }

        var builder = RestClient.builder(hosts);
        if (hasText(elasticsearchUsername) && hasText(elasticsearchPassword)) {
            BasicCredentialsProvider credentialsProvider = new BasicCredentialsProvider();
            credentialsProvider.setCredentials(AuthScope.ANY,
                    new UsernamePasswordCredentials(elasticsearchUsername, elasticsearchPassword));
            builder.setHttpClientConfigCallback(httpClientBuilder ->
                    httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider));
        }
        log.info("配置RAG Elasticsearch RestClient: {}", elasticsearchUris);
        return builder.build();
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
