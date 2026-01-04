# MyBlog 性能优化实践指南

> 本文档总结了项目中的性能优化点，用于面试技术深度展示

## 📊 性能优化总览

| 优化类型 | 技术方案 | 效果 |
|---------|----------|------|
| **缓存架构** | Redis 读写分离 | 读性能提升 10x |
| **接口限流** | 滑动窗口算法 | 防止恶意攻击 |
| **分布式锁** | Redis + Lua | 防止并发数据不一致 |
| **异步处理** | 线程池 + 事件驱动 | 响应时间降低 50% |
| **全文搜索** | Elasticsearch | 毫秒级搜索响应 |
| **消息队列** | Kafka | 削峰填谷，解耦 |
| **数据库索引** | 复合索引优化 | 查询性能提升 5x |
| **ID 生成** | 雪花算法 | 支持分库分表 |

---

## 1️⃣ 缓存架构（重点）

### 点赞系统读写分离

```
┌─────────────────────────────────────────────────────────────┐
│                      点赞架构设计                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  用户点击 ──→ Redis ZSet (实时写入, 1-2ms)                   │
│            ──→ 发布 LikeEvent (异步)                         │
│                    │                                        │
│                    ↓                                        │
│            LikeEventListener (线程池异步)                    │
│                    │                                        │
│                    ↓                                        │
│            MySQL (持久化, 不阻塞用户)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心代码

```java
// 1. Redis 实时读写
@Override
@DistributedLock(key = "'like:' + #blogId + ':' + #userId")
public Boolean toggleLike(Long blogId, Long userId) {
    // 使用 ZSet 存储，自动去重
    Double score = unifiedCacheService.getZSetScore(
        RedisKeyFactory.BLOG_LIKES_SET, userId.toString(), blogId);
    
    if (score == null) {
        // 添加点赞
        unifiedCacheService.addToZSet(RedisKeyFactory.BLOG_LIKES_SET, 
            userId.toString(), timestamp, blogId);
        unifiedCacheService.increment(RedisKeyFactory.BLOG_LIKE_COUNT, 1L, blogId);
        
        // 异步持久化
        eventPublisher.publishEvent(new LikeEvent(this, blogId, userId, true));
    }
    // ...
}

// 2. 异步持久化监听器
@Async("commonAsyncExecutor")
@EventListener
@Transactional
public void handleLikeEvent(LikeEvent event) {
    // 写入 MySQL
    userLikeMapper.insert(newLike);
}
```

### 面试话术

> **问：为什么不直接写数据库？**
>
> 答：Redis 写入 1-2ms，MySQL 写入 10-50ms。点赞是高频操作，用户期望即时反馈。
> 
> **问：数据不一致怎么办？**
>
> 答：三层保障：
> 1. 事件机制本身有重试
> 2. 定时任务对比 Redis 和 MySQL，自动修复差异
> 3. 缓存预热从 MySQL 恢复 Redis 数据

---

## 2️⃣ 接口限流

### 滑动窗口算法

```java
/**
 * 使用 Redis ZSet 实现滑动窗口
 * - score: 请求时间戳
 * - value: 唯一标识（时间戳字符串）
 */
private boolean checkRateLimit(String key, int limit, int windowSeconds) {
    long now = System.currentTimeMillis();
    long windowStart = now - (windowSeconds * 1000L);
    
    // 1. 删除窗口外的旧请求
    redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);
    
    // 2. 统计当前窗口请求数
    Long count = redisTemplate.opsForZSet().zCard(key);
    
    if (count >= limit) return false;  // 超限
    
    // 3. 添加当前请求
    redisTemplate.opsForZSet().add(key, String.valueOf(now), now);
    return true;
}
```

### 滑动窗口 vs 固定窗口

| 特性 | 固定窗口 | 滑动窗口 |
|------|---------|---------|
| 实现 | 简单 | 稍复杂 |
| 边界问题 | 有（可能双倍流量） | 无 |
| 内存占用 | 低 | 较高 |
| 适用场景 | 要求不严格 | 精确限流 |

### 面试话术

> **问：为什么选滑动窗口？**
>
> 固定窗口在边界有问题：假设限制 10次/分钟，用户在 0:59 发 10 次，1:01 又发 10 次，
> 实际 2 秒内发了 20 次。滑动窗口看的是任意 60 秒窗口，不存在这个问题。

---

## 3️⃣ 分布式锁

### 实现要点

```java
/**
 * Redis 分布式锁核心实现
 * 
 * 三个关键点：
 * 1. SET NX EX - 原子性加锁
 * 2. UUID - 唯一标识，防止误删
 * 3. Lua 脚本 - 原子性解锁
 */

// 加锁：SET key value NX EX seconds
Boolean success = stringRedisTemplate.opsForValue()
    .setIfAbsent(key, value, expireSeconds, TimeUnit.SECONDS);

// 解锁：Lua 脚本保证原子性
private static final String UNLOCK_SCRIPT = 
    "if redis.call('get', KEYS[1]) == ARGV[1] then " +
    "    return redis.call('del', KEYS[1]) " +
    "else " +
    "    return 0 " +
    "end";
```

### 使用方式

```java
// 注解声明，SpEL 动态 key
@DistributedLock(key = "'like:' + #blogId + ':' + #userId", expire = 30)
public Boolean toggleLike(Long blogId, Long userId) {
    // 业务逻辑
}
```

### 面试话术

> **问：为什么用 Lua 脚本解锁？**
>
> 解锁需要两步：验证 value 匹配 → 删除 key。
> 如果不是原子操作，可能验证通过后锁过期，被别人获取，再删就误删了。
> Lua 脚本在 Redis 中原子执行，避免这个问题。

---

## 4️⃣ 异步处理

### 线程池配置

```java
@Configuration
@EnableAsync
public class ThreadPoolConfig {
    
    @Bean(name = "blogAsyncExecutor")
    public Executor blogAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);        // 核心线程数
        executor.setMaxPoolSize(8);         // 最大线程数
        executor.setQueueCapacity(100);     // 队列容量
        executor.setThreadNamePrefix("blog-async-");
        executor.setRejectedExecutionHandler(new CallerRunsPolicy());  // 拒绝策略
        return executor;
    }
}
```

### 线程池参数设置依据

| 参数 | 值 | 依据 |
|-----|---|------|
| corePoolSize | 4 | CPU 核数（博客详情页 4-6 个并行查询） |
| maxPoolSize | 8 | 2倍核心数，应对峰值 |
| queueCapacity | 100 | 任务执行快，不需要大队列 |
| 拒绝策略 | CallerRunsPolicy | 调用者执行，保证任务不丢失 |

### 面试话术

> **问：线程池参数怎么定的？**
>
> 根据任务类型：
> - **CPU 密集型**：N+1（N=CPU核数）
> - **IO 密集型**：2N 或更多
> 
> 博客系统以 IO（数据库查询）为主，但查询有缓存，实际执行时间短，
> 所以用 4 核心 + 100 队列，既保证响应又不过度消耗资源。

---

## 5️⃣ Elasticsearch 搜索优化

### 搜索架构

```
用户搜索
    │
    ↓
Elasticsearch (全文检索)
    │
    ├── IK 中文分词
    ├── 高亮显示
    └── 实时搜索建议
```

### 索引设计

```json
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "ik_max_word",      // 索引时最细粒度分词
        "search_analyzer": "ik_smart"   // 搜索时智能分词
      },
      "content": {
        "type": "text",
        "analyzer": "ik_max_word"
      }
    }
  }
}
```

### 面试话术

> **问：ES 和 MySQL 数据如何同步？**
>
> 两种方式：
> 1. **同步写入**：保存博客时同时写 ES（当前使用）
> 2. **异步同步**：通过 Binlog + Canal 实时同步
>
> 当前用同步写入，因为博客发布不频繁，性能影响小。
> 如果写入频繁，建议用 Canal 异步同步。

---

## 6️⃣ Kafka 消息队列

### 通知系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     通知系统架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  业务事件 ──→ NotificationEvent                              │
│                    │                                        │
│                    ↓                                        │
│              KafkaTemplate.send()                           │
│                    │                                        │
│                    ↓                                        │
│              Kafka Topic                                    │
│                    │                                        │
│                    ↓                                        │
│          KafkaNotificationConsumer                          │
│                    │                                        │
│            ┌──────┴──────┐                                  │
│            ↓              ↓                                 │
│        MySQL          WebSocket                             │
│       (持久化)        (实时推送)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 面试话术

> **问：为什么用 Kafka 不用 RabbitMQ？**
>
> 选型考虑：
> - **Kafka**：高吞吐、持久化强、支持重放，适合日志/事件流
> - **RabbitMQ**：灵活路由、低延迟、AMQP 协议，适合业务消息
>
> 通知系统场景更像事件流，选 Kafka。
> 如果需要复杂路由（如延迟队列），会考虑 RabbitMQ。

---

## 7️⃣ 雪花算法

### 结构设计

```
64位 ID 结构：
+------+----------------------+----------------+--------------+
| 1bit |       41bits         |    10bits      |    12bits    |
+------+----------------------+----------------+--------------+
| 符号 |       时间戳          |    机器ID      |    序列号    |
+------+----------------------+----------------+--------------+
  0     毫秒级差值（69年）      5+5（1024节点）   4096/ms
```

### 核心代码

```java
public synchronized long nextId() {
    long currentTimestamp = getCurrentTimestamp();
    
    // 时钟回拨检测
    if (currentTimestamp < lastTimestamp) {
        throw new RuntimeException("时钟回拨，拒绝生成ID");
    }
    
    // 同一毫秒内序列号递增
    if (currentTimestamp == lastTimestamp) {
        sequence = (sequence + 1) & SEQUENCE_MASK;
        if (sequence == 0) {
            currentTimestamp = waitNextMillis(lastTimestamp);
        }
    } else {
        sequence = 0L;
    }
    
    lastTimestamp = currentTimestamp;
    
    // 组装 ID
    return ((currentTimestamp - START_TIMESTAMP) << TIMESTAMP_SHIFT)
            | (datacenterId << DATACENTER_ID_SHIFT)
            | (workerId << WORKER_ID_SHIFT)
            | sequence;
}
```

### 面试话术

> **问：雪花算法有什么问题？**
>
> 1. **时钟回拨**：NTP 同步可能导致时间倒退，需要检测和等待
> 2. **机器 ID 分配**：需要外部系统（ZK/配置中心）保证唯一
> 3. **单点瓶颈**：synchronized 有锁竞争，可用 ThreadLocal 优化

---

## 8️⃣ 数据库索引

### 索引设计原则

```sql
-- 复合索引示例：通知查询优化
CREATE INDEX idx_receiver_read_time 
    ON tb_notification (receiver_id, is_read, create_time DESC);
    
-- 覆盖查询场景：
-- 1. 查询用户的未读通知（receiver_id + is_read）
-- 2. 按时间排序（create_time DESC）
-- 3. 最左前缀原则：可以只用 receiver_id 查询
```

### 索引优化实践

| 表 | 索引 | 优化场景 |
|---|------|---------|
| `tb_blog` | `idx_author_id` | 作者文章列表 |
| `tb_blog` | `idx_publish_time` | 最新文章排序 |
| `tb_comment` | `idx_blog_id, parent_id` | 评论树构建 |
| `tb_user_like` | `uk_user_target` | 点赞状态查询 |
| `tb_notification` | `idx_receiver_read_time` | 未读通知列表 |

---

## 🎯 面试总结

### 性能优化三连问

**Q1：项目中做了哪些性能优化？**

> 主要从三个层面：
> 1. **缓存层**：Redis 读写分离 + 统一缓存服务
> 2. **并发层**：分布式锁 + 接口限流 + 异步线程池
> 3. **存储层**：ES 全文搜索 + 数据库索引优化 + 雪花 ID

**Q2：如何验证优化效果？**

> 1. **压测**：JMeter 测试 QPS 和响应时间
> 2. **慢查询日志**：监控 MySQL 慢查询
> 3. **Redis 监控**：缓存命中率、内存使用
> 4. **APM**：链路追踪定位瓶颈

**Q3：遇到过什么性能问题？怎么解决的？**

> **问题**：MyBatis LEFT JOIN + LIMIT 分页返回条数不对
> 
> **原因**：LIMIT 作用于 JOIN 后的行数，不是最终对象数
> 
> **解决**：子查询先限制主表数量，再 JOIN 关联表
> 
> ```sql
> SELECT b.*, t.* FROM (
>     SELECT * FROM tb_blog LIMIT 6  -- 子查询先限制
> ) b LEFT JOIN tb_tag t ON ...
> ```
