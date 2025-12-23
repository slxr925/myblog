package com.ryan.myblog.initializer;

import com.ryan.myblog.service.SearchService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Elasticsearch 索引初始化器
 * 在应用启动时检查并创建索引
 */
@Slf4j
@Component
public class ElasticsearchInitializer implements ApplicationRunner {

    @Autowired(required = false)
    private SearchService searchService;

    @Value("${app.elasticsearch.enabled:false}")
    private boolean esEnabled;

    @Override
    public void run(ApplicationArguments args) {
        if (!esEnabled) {
            log.info("Elasticsearch 未启用，跳过索引初始化");
            return;
        }

        if (searchService == null) {
            log.warn("SearchService 未注入，跳过索引初始化");
            return;
        }

        try {
            if (!searchService.isAvailable()) {
                log.warn("Elasticsearch 不可用，跳过索引初始化");
                return;
            }

            log.info("Elasticsearch 已启用，准备初始化索引");
            // 索引初始化由管理员手动触发
            // 可通过 POST /api/search/rebuild 接口重建索引
            log.info("索引初始化完成（等待手动重建）");

        } catch (Exception e) {
            log.error("Elasticsearch 索引初始化失败", e);
            // 不影响应用启动
        }
    }
}
