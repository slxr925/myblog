package com.ryan.myblog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 线程池配置
 * 用途：为异步任务提供统一管理的线程池
 * 
 * 面试要点：
 * 1. 为什么要独立配置线程池？
 * - 避免使用 Executors 创建的固定线程池造成内存泄漏
 * - 统一管理，便于监控和调优
 * - Spring 容器管理生命周期，应用关闭时自动 shutdown
 * 
 * 2. 线程池参数如何设置？
 * - corePoolSize：CPU密集型任务建议 N+1，IO密集型建议 2N
 * - maxPoolSize：最大线程数，防止资源耗尽
 * - queueCapacity：任务队列容量，队列满后才创建新线程
 * - 拒绝策略：CallerRunsPolicy 让调用者线程执行，避免任务丢失
 * 
 * 3. 为什么使用 ThreadPoolTaskExecutor 而不是 ThreadPoolExecutor？
 * - Spring 封装，与 Spring 容器集成更好
 * - 自动处理生命周期（初始化、关闭）
 * - 支持 @Async 注解
 */
@Configuration
@EnableAsync
public class ThreadPoolConfig {

    /**
     * 博客异步任务线程池
     * 用途：博客详情页的并行查询（推荐文章、热门文章等）
     * 
     * 场景说明：
     * 博客详情页需要并行查询多个数据（相关文章、热门文章、上一篇下一篇等）
     * 这些查询互不依赖，适合并行执行以降低响应时间
     */
    @Bean(name = "blogAsyncExecutor", destroyMethod = "shutdown")
    public Executor blogAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // 核心线程数：4个
        // 理由：博客详情页通常有 6 个并行查询，4个核心线程足够应对
        executor.setCorePoolSize(4);

        // 最大线程数：8个
        // 理由：高峰期允许扩展到 8 个线程
        executor.setMaxPoolSize(8);

        // 队列容量：100
        // 理由：任务执行时间短（查询数据库），不需要很大队列
        executor.setQueueCapacity(100);

        // 线程名称前缀：便于日志追踪
        executor.setThreadNamePrefix("blog-async-");

        // 拒绝策略：CallerRunsPolicy
        // 理由：由调用者线程执行任务，保证任务不丢失，也能起到负载保护作用
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

        // 线程空闲时间：60秒
        // 超过核心线程数的线程，空闲60秒后回收
        executor.setKeepAliveSeconds(60);

        // 允许核心线程超时
        executor.setAllowCoreThreadTimeOut(false);

        // 等待所有任务完成后再关闭线程池
        // 应用关闭时，确保正在执行的任务能完成
        executor.setWaitForTasksToCompleteOnShutdown(true);

        // 最多等待60秒后强制关闭
        executor.setAwaitTerminationSeconds(60);

        // 初始化
        executor.initialize();

        return executor;
    }

    /**
     * 通用异步任务线程池
     * 用途：其他异步任务，如日志记录、统计更新等
     */
    @Bean(name = "commonAsyncExecutor", destroyMethod = "shutdown")
    public Executor commonAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("common-async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }
}
