package com.ryan.myblog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 定时任务配置
 * 
 * 启用Spring的@Scheduled注解支持
 * 
 * 面试要点：
 * 1. 为什么要单独配置？
 * - 明确开启定时任务功能
 * - 便于统一管理定时任务
 * - 可以添加全局配置（线程池等）
 * 
 * 2. 定时任务的注意事项：
 * - 注意并发执行（同一任务是否允许并发）
 * - 注意执行时间（避免任务堆积）
 * - 注意异常处理（异常不应中断后续执行）
 * - 注意分布式场景（多实例如何避免重复执行）
 */
@Configuration
@EnableScheduling
public class ScheduleConfig {

    // 后续可以添加自定义线程池配置
    // 默认情况下，Spring使用单线程池执行所有定时任务
    // 如果有多个定时任务，可以配置线程池提高并发度

    /*
     * @Bean
     * public TaskScheduler taskScheduler() {
     * ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
     * scheduler.setPoolSize(5);
     * scheduler.setThreadNamePrefix("scheduled-task-");
     * scheduler.setWaitForTasksToCompleteOnShutdown(true);
     * scheduler.setAwaitTerminationSeconds(60);
     * scheduler.initialize();
     * return scheduler;
     * }
     */
}
