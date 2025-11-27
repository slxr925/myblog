package com.ryan.myblog.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

/**
 * Elasticsearch索引配置
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "app.elasticsearch.enabled", havingValue = "true", matchIfMissing = false)
public class ElasticsearchIndexConfig {

    @Autowired(required = false)
    private ElasticsearchOperations elasticsearchOperations;

    /**
     * 应用启动后自动创建索引映射
     */
    @EventListener(ApplicationReadyEvent.class)
    public void setupIndices() {
        if (elasticsearchOperations == null) {
            log.warn("Elasticsearch操作对象为空，跳过索引设置");
            return;
        }

        try {
            createBlogIndex();
            log.info("Elasticsearch索引设置完成");
        } catch (Exception e) {
            log.error("创建Elasticsearch索引失败", e);
        }
    }

    /**
     * 创建博客索引
     */
    private void createBlogIndex() {
        try {
            IndexOperations indexOps = elasticsearchOperations.indexOps(com.ryan.myblog.model.entity.BlogDocument.class);

            if (!indexOps.exists()) {
                indexOps.create();
                log.info("成功创建博客索引: blog_index");
            } else {
                log.info("博客索引已存在: blog_index");
            }
        } catch (Exception e) {
            log.error("创建Elasticsearch索引失败", e);
        }
    }
}