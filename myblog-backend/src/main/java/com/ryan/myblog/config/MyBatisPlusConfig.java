package com.ryan.myblog.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.incrementer.IdentifierGenerator;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.ryan.myblog.utils.SnowflakeIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * MyBatis Plus 配置类
 * 
 * 配置说明：
 * 1. 分页插件 - 支持物理分页
 * 2. 雪花算法ID生成器 - 支持分布式ID生成
 * 
 * 面试要点：
 * 1. 为什么使用雪花算法？
 * - 数据库自增ID不支持分库分表
 * - UUID无序，影响B+Tree索引性能
 * - 雪花ID趋势递增，性能好
 * 
 * 2. 如何配置机器ID？
 * - 通过配置文件：myblog.snowflake.datacenter-id 和 myblog.snowflake.worker-id
 * - 支持0-31，共1024种组合
 */
@Configuration
@RequiredArgsConstructor
public class MyBatisPlusConfig {

    private final SnowflakeIdGenerator snowflakeIdGenerator;

    /**
     * MyBatis Plus 拦截器配置
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }

    /**
     * 自定义ID生成器
     * 使用雪花算法生成分布式ID
     * 
     * 注意：需要在实体类的@TableId注解中指定 type = IdType.ASSIGN_ID
     * 例如：@TableId(value = "id", type = IdType.ASSIGN_ID)
     * 
     * 现有表使用 AUTO（自增），新表可以逐步切换到 ASSIGN_ID
     */
    @Bean
    @Primary
    public IdentifierGenerator customIdGenerator() {
        return new IdentifierGenerator() {
            @Override
            public Number nextId(Object entity) {
                return snowflakeIdGenerator.nextId();
            }

            @Override
            public String nextUUID(Object entity) {
                return snowflakeIdGenerator.nextIdStr();
            }
        };
    }
}