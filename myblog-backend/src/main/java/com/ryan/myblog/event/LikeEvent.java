package com.ryan.myblog.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * 点赞事件
 * 
 * 事件驱动架构的优势：
 * 1. 解耦：点赞操作（Redis）和持久化（MySQL）分离
 * 2. 异步：不阻塞主流程，提升响应速度
 * 3. 扩展性：新增监听器即可添加新功能（如积分、通知）
 * 4. 削峰：通过异步处理，应对突发流量
 * 
 * 面试要点：
 * 1. 为什么不直接在点赞方法里写数据库？
 * - 响应慢：数据库写入需要10-50ms，Redis只需1ms
 * - 耦合高：Redis层依赖数据库层
 * - 难扩展：新增功能需要修改原代码
 * 
 * 2. 事件丢失了怎么办？
 * - 定时任务兜底：定期对比Redis和MySQL数据，修复不一致
 * - 消息队列：将事件放入MQ，保证可靠性
 * - 本地消息表：在同一个事务中记录待发送消息
 * 
 * 3. 为什么继承ApplicationEvent？
 * - Spring标准事件机制
 * - 支持同步/异步监听
 * - 自动注入事件发布器ApplicationEventPublisher
 */
@Getter
public class LikeEvent extends ApplicationEvent {

    /**
     * 博客ID
     */
    private final Long blogId;

    /**
     * 用户ID
     */
    private final Long userId;

    /**
     * 点赞状态：true-点赞, false-取消点赞
     */
    private final boolean like;

    /**
     * 构造函数
     * 
     * @param source 事件源（通常是发布事件的Service）
     * @param blogId 博客ID
     * @param userId 用户ID
     * @param like   点赞状态
     */
    public LikeEvent(Object source, Long blogId, Long userId, boolean like) {
        super(source);
        this.blogId = blogId;
        this.userId = userId;
        this.like = like;
    }

    @Override
    public String toString() {
        return String.format("LikeEvent{blogId=%d, userId=%d, like=%s, timestamp=%d}",
                blogId, userId, like, getTimestamp()); // 使用父类的getTimestamp()
    }
}
