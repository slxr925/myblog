# MyBlog 项目面试全面指南

> 5年后端开发面试必备 - 技术栈、架构设计、难点解析、常见问题

---

## 📌 目录

1. [项目介绍](#1-项目介绍)
2. [技术架构](#2-技术架构)
3. [核心功能](#3-核心功能)
4. [技术亮点](#4-技术亮点)
5. [设计模式](#5-设计模式)
6. [性能优化](#6-性能优化)
7. [项目难点](#7-项目难点)
8. [面试问答](#8-面试问答)

---

## 1. 项目介绍

### 1.1 一分钟电梯演讲

> **面试官：请介绍一下这个项目**

**回答示例：**

"MyBlog 是我独立开发的一个现代化全栈博客系统，采用前后端分离架构。

**技术选型**方面，后端使用 Spring Boot 3.x + MyBatis Plus + Redis + Elasticsearch + Kafka，前端使用 React 19 + TypeScript + Tailwind CSS。

**核心功能**包括博客发布、全文搜索、实时通知、AI 智能助手等。

**技术亮点**是引入了 Kafka 消息队列实现事件驱动架构，使用 WebSocket 实现实时通知推送，以及 Elasticsearch 实现毫秒级全文搜索。

**性能优化**方面，采用 Redis 读写分离架构，点赞等高频操作直接写 Redis，异步同步到 MySQL，响应时间降低了 80%。

整个项目代码约 3 万行，已部署到生产环境，日均 PV 约 1000+。"

### 1.2 项目背景

| 项目信息 | 详情 |
|---------|------|
| **项目名称** | MyBlog - 现代化全栈博客系统 |
| **开发时间** | 2025年12月（1个月） |
| **项目规模** | 代码量约3万行，包含前后端 |
| **部署方式** | Docker 容器化，单机部署 |
| **在线地址** | http://49.235.139.118:3000 |
| **代码仓库** | GitHub（私有仓库） |

### 1.3 项目定位

- **学习项目**：深入实践主流技术栈
- **作品集项目**：展示技术实力
- **生产级项目**：可实际使用的完整系统

---

## 2. 技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层                                │
│   React 19 + TypeScript + Tailwind CSS + Vite              │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────┴────────────────────────────────────────┐
│                      Nginx 反向代理                          │
│             静态资源 + API 转发 + 负载均衡                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                     后端服务层                               │
│          Spring Boot 3.5 + Spring Security                  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Blog     │  │ Search   │  │ Notify   │  │ AI       │  │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
└─────┬──────────────┬──────────────┬──────────────┬─────────┘
      │              │              │              │
      ↓              ↓              ↓              ↓
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ MySQL    │  │ Redis    │  │Elastic   │  │ Kafka    │
│ 8.0      │  │ 7.x      │  │search    │  │ 3.9      │
│          │  │          │  │ 8.11     │  │          │
│ 数据持久  │  │ 缓存+锁  │  │ 全文搜索 │  │ 消息队列 │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### 2.2 技术栈详解

#### 后端技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | Spring Boot | 3.5.5 | 核心框架 |
| **安全** | Spring Security | 6.x | 认证授权 |
| **ORM** | MyBatis Plus | 3.5.9 | 数据库操作 |
| **数据库** | MySQL | 8.0 | 数据持久化 |
| **缓存** | Redis | 7.x | 缓存+分布式锁 |
| **搜索** | Elasticsearch | 8.11 | 全文搜索 |
| **消息** | Kafka | 3.9 | 事件驱动 |
| **实时通信** | WebSocket | - | 实时推送 |
| **AI** | Spring AI | 1.1.2 | AI 集成 |
| **认证** | JWT | 0.12.3 | 无状态认证 |
| **文档** | Knife4j | 4.3.0 | API 文档 |

#### 前端技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | React | 19.1 | UI 框架 |
| **语言** | TypeScript | 5.8 | 类型安全 |
| **构建** | Vite | 7.1 | 打包工具 |
| **样式** | Tailwind CSS | 4.1 | CSS 框架 |
| **组件** | Radix UI | - | 组件库 |
| **动画** | Framer Motion | 12 | 动画库 |
| **路由** | React Router | 7.9 | 路由管理 |
| **HTTP** | Axios | 1.12 | 请求库 |

#### 基础设施

| 类别 | 技术 | 用途 |
|------|------|------|
| **容器化** | Docker | 应用容器 |
| **编排** | Docker Compose | 服务编排 |
| **反向代理** | Nginx | 负载均衡+静态资源 |
| **运行时** | Java 21 | 后端运行环境 |
| **包管理** | Maven | 后端依赖管理 |

### 2.3 数据库设计

**核心表：**

```sql
-- 用户表
tb_user (id, username, password, email, role, ...)

-- 博客表
tb_blog (id, title, content, author_id, category_id, status, ...)

-- 评论表
tb_comment (id, blog_id, user_id, parent_id, content, ...)

-- 点赞表
tb_user_like (id, user_id, target_type, target_id, status, ...)

-- 通知表
tb_notification (id, receiver_id, sender_id, type, is_read, ...)

-- 关注关系表
tb_user_follow (id, follower_id, followee_id, ...)
```

**索引设计：**
- 复合索引：`idx_receiver_read_time (receiver_id, is_read, create_time DESC)`
- 唯一索引：`uk_user_target (user_id, target_id, target_type)`
- 覆盖索引：查询字段都在索引中，避免回表

---

## 3. 核心功能

### 3.1 功能清单

| 功能模块 | 具体功能 | 技术实现 |
|---------|---------|---------|
| **用户系统** | 注册、登录、权限控制 | Spring Security + JWT |
| **内容管理** | Markdown 编辑、发布、草稿 | React Markdown |
| **全文搜索** | 实时搜索建议、高亮显示 | Elasticsearch + IK 分词 |
| **互动功能** | 点赞、评论、收藏、关注 | Redis ZSet + 异步持久化 |
| **实时通知** | 点赞、评论、关注通知 | Kafka + WebSocket |
| **AI 助手** | 智能问答、内容辅助 | Spring AI + GLM-4 |
| **数据统计** | 个人主页、文章分析 | Redis 计数 + MySQL 聚合 |

### 3.2 实时通知系统（重点功能）

**架构设计：**

```
用户操作（点赞/评论）
    │
    ↓
业务层发布事件 (NotificationEvent)
    │
    ↓
Kafka 生产者 (异步发送)
    │
    ↓
Kafka Topic (持久化)
    │
    ↓
Kafka 消费者 (监听)
    │
    ├──→ MySQL (持久化通知记录)
    │
    └──→ WebSocket (实时推送给在线用户)
```

**为什么用 Kafka？**
1. **解耦**：业务层和通知层解耦
2. **削峰**：高峰期消息积压，慢慢消费
3. **可靠**：消息持久化，不会丢失
4. **可重放**：出问题可以重新消费

---

## 4. 技术亮点

### 4.1 分布式锁防止并发问题

**问题**：用户快速双击点赞按钮，可能重复点赞

**解决方案**：Redis 分布式锁 + Lua 脚本

```java
@DistributedLock(key = "'like:' + #blogId + ':' + #userId", expire = 30)
public Boolean toggleLike(Long blogId, Long userId) {
    // 业务逻辑
}
```

**实现要点：**
- `SET NX EX` 原子性加锁
- UUID value 防止误删
- Lua 脚本原子性解锁
- SpEL 支持动态 key

### 4.2 滑动窗口限流算法

**问题**：防止恶意刷接口

**解决方案**：Redis ZSet 实现滑动窗口

```java
@RateLimit(key = "ip", limit = 100, window = 60)
public Result<?> api() { }

@GlobalRateLimit(limit = 100, window = 60)
@RestController
public class BlogController { }
```

**优势：**
- 比固定窗口更平滑
- 不存在边界双倍流量问题
- 支持方法级和类级限流

### 4.3 Redis 读写分离架构

**高频操作场景**：点赞、评论计数

**架构设计：**

```
用户点赞
    │
    ↓
Redis ZSet (写入，1-2ms)
    │
    ├──→ 返回给用户 (快速响应)
    │
    └──→ 发布 LikeEvent (异步)
            │
            ↓
        EventListener (线程池异步)
            │
            ↓
        MySQL (持久化，10-50ms)
```

**数据一致性保证：**
1. 事件重试机制
2. 定时任务对比修复
3. 缓存预热恢复

### 4.4 全文搜索优化

**技术选型**：Elasticsearch + IK 中文分词

**索引设计：**
```json
{
  "title": {
    "type": "text",
    "analyzer": "ik_max_word",      // 索引：最细粒度
    "search_analyzer": "ik_smart"   // 搜索：智能分词
  }
}
```

**功能实现：**
- 实时搜索建议（边输入边搜索）
- 关键词高亮
- 分类筛选

### 4.5 雪花算法分布式 ID

**问题**：为分库分表做准备

**实现：**
```
64位ID结构：
1位符号 + 41位时间戳 + 10位机器ID + 12位序列号
```

**优势：**
- 趋势递增（B+Tree 友好）
- 本地生成（无网络开销）
- 支持分布式（1024 个节点）

**时钟回拨处理：**
- 检测回拨立即抛异常
- 小范围回拨等待追上

---

## 5. 设计模式

### 5.1 应用的设计模式总览

| 设计模式 | 应用场景 | 代码位置 |
|---------|----------|----------|
| **工厂模式** | Redis Key 统一生成 | `RedisKeyFactory` |
| **观察者模式** | 事件驱动解耦 | `LikeEvent` + `EventListener` |
| **代理模式** | AOP 切面 | `RateLimitAspect`, `DistributedLockAspect` |
| **策略模式** | 通知类型处理 | `NotificationType` 枚举 |
| **模板方法** | MyBatis Plus 基类 | `ServiceImpl` |
| **单例模式** | Spring Bean | 所有 `@Service` |
| **建造者模式** | 事件构建 | `NotificationEvent` 静态方法 |
| **门面模式** | 缓存统一接口 | `UnifiedCacheService` |

### 5.2 工厂模式 - RedisKeyFactory

**作用**：统一管理 Redis Key

```java
public enum RedisKeyFactory {
    BLOG_DETAIL("blog:detail:%s", 30, TimeUnit.MINUTES),
    BLOG_LIKES_SET("blog:likes:%s", 7, TimeUnit.DAYS),
    
    public String getKey(Object... args) {
        return PROJECT_PREFIX + String.format(pattern, args);
    }
}
```

**优势：**
- 命名规范统一
- TTL 集中管理
- 类型安全（编译检查）

### 5.3 观察者模式 - 事件驱动

**作用**：解耦业务逻辑

```java
// 发布事件
eventPublisher.publishEvent(new LikeEvent(this, blogId, userId, true));

// 监听事件
@EventListener
@Async("commonAsyncExecutor")
public void handleLikeEvent(LikeEvent event) {
    // 异步持久化
}
```

**优势：**
- 解耦：Redis 层和 MySQL 层分离
- 异步：不阻塞主流程
- 可扩展：加监听器即可扩展功能

### 5.4 代理模式 - AOP 切面

**作用**：横切关注点

```java
@Aspect
@Component
public class RateLimitAspect {
    @Around("@annotation(RateLimit)")
    public Object around(ProceedingJoinPoint point) {
        // 前置：限流检查
        // 执行：原方法
        // 后置：清理
    }
}
```

**应用场景：**
- 接口限流（`RateLimitAspect`）
- 分布式锁（`DistributedLockAspect`）
- 审计日志（`AuditLogAspect`）

### 5.5 门面模式 - UnifiedCacheService

**作用**：简化 Redis 操作

```java
public interface UnifiedCacheService {
    void set(RedisKeyFactory keyFactory, Object value, Object... args);
    <T> T get(RedisKeyFactory keyFactory, Class<T> clazz, Object... args);
    Boolean addToZSet(RedisKeyFactory keyFactory, Object value, double score, Object... args);
}
```

**优势：**
- 屏蔽 RedisTemplate 复杂性
- 自动管理 Key 和 TTL
- 异常降级处理

---

## 6. 性能优化

### 6.1 缓存优化

| 优化点 | 方案 | 效果 |
|-------|------|------|
| **点赞计数** | Redis ZSet + 异步同步 | 响应时间 1-2ms |
| **博客详情** | Redis String 缓存 30min | 缓存命中率 >90% |
| **热门文章** | Redis 缓存 10min | QPS 提升 10x |
| **缓存穿透** | 空值缓存 | 防止数据库被击穿 |
| **缓存击穿** | 分布式锁 | 防止热点 key 失效 |

### 6.2 数据库优化

| 优化点 | 方案 | 效果 |
|-------|------|------|
| **索引设计** | 复合索引覆盖查询 | 查询性能提升 5x |
| **分页优化** | 子查询先限制再 JOIN | 解决 LIMIT 陷阱 |
| **连接池** | HikariCP 默认配置 | 连接复用 |
| **慢查询** | 定期分析 slow log | 及时发现问题 |

### 6.3 并发优化

| 优化点 | 方案 | 效果 |
|-------|------|------|
| **分布式锁** | Redis + Lua 脚本 | 防止重复点赞 |
| **接口限流** | 滑动窗口算法 | 防止恶意攻击 |
| **线程池** | 自定义线程池配置 | 异步任务不阻塞 |
| **乐观锁** | CAS 更新 | 避免死锁 |

### 6.4 搜索优化

| 优化点 | 方案 | 效果 |
|-------|------|------|
| **全文搜索** | Elasticsearch | 毫秒级响应 |
| **中文分词** | IK 分词器 | 准确率提升 |
| **搜索建议** | 边输入边搜索 | 用户体验好 |
| **高亮显示** | ES highlight | 关键词突出 |

---

## 7. 项目难点

### 7.1 难点一：MyBatis 一对多查询的 LIMIT 陷阱

**问题描述：**

查询博客列表，每篇博客关联多个标签。期望返回 6 篇博客，实际只返回 4 篇。

**原因分析：**

```sql
SELECT b.*, t.* 
FROM tb_blog b
LEFT JOIN tb_blog_tag bt ON b.id = bt.blog_id
LEFT JOIN tb_tag t ON bt.tag_id = t.id
LIMIT 6  -- LIMIT 作用于 JOIN 后的行数，不是博客数
```

一篇有 4 个标签的博客会产生 4 行，LIMIT 6 只取了 6 行，实际只有部分博客。

**解决方案：**

使用子查询先限制博客数量：

```sql
SELECT b.*, t.*
FROM (
    SELECT * FROM tb_blog 
    WHERE deleted = 0 AND status = 1
    ORDER BY publish_time DESC
    LIMIT 6  -- 先限制博客数量
) b
LEFT JOIN tb_blog_tag bt ON b.id = bt.blog_id
LEFT JOIN tb_tag t ON bt.tag_id = t.id
```

**经验总结：**

> LIMIT + JOIN + collection 映射，三者结合要小心。
> LIMIT 作用于 JOIN 后的行数，不是最终对象数。

### 7.2 难点二：Docker 容器访问宿主机服务

**问题描述：**

Spring Boot 应用在容器内，MySQL 和 Redis 在宿主机。配置 `localhost:3306` 连接失败。

**原因分析：**

容器有独立网络命名空间，容器内的 `localhost` 指向容器自己，不是宿主机。

**解决方案：**

```yaml
# docker-compose.yml
services:
  backend:
    extra_hosts:
      - "host.docker.internal:host-gateway"

# application.yml
spring:
  datasource:
    url: jdbc:mysql://host.docker.internal:3306/myblog
```

**经验总结：**

> Docker 网络隔离是常见坑。记住三种方案：
> 1. host.docker.internal（推荐）
> 2. 宿主机 IP（如 172.17.0.1）
> 3. network_mode: host（失去隔离）

### 7.3 难点三：通知系统 ID 类型匹配

**问题描述：**

WebSocket 推送通知时，`userId` 是 Long，但 session 的 key 是 String，导致找不到用户连接。

**原因分析：**

```java
// 存储时用的 String
sessions.put(userId.toString(), session);

// 查找时用的 Long
sessions.get(receiverId);  // receiverId 是 Long，找不到
```

**解决方案：**

统一使用 String：

```java
// 一致使用 toString()
String userIdStr = receiverId.toString();
WebSocketSession session = sessions.get(userIdStr);
```

**经验总结：**

> Map 的 key 类型要一致，Long 和 String 不会自动转换。
> 建议统一用 String，避免类型问题。

### 7.4 难点四：缓存一致性

**问题描述：**

用户点赞后，Redis 已更新，但 MySQL 写入失败，数据不一致怎么办？

**解决方案：**

三层保障机制：

```java
// 1. 事件重试
@EventListener
@Transactional
@Retryable(maxAttempts = 3)
public void handleLikeEvent(LikeEvent event) { }

// 2. 定时任务对比修复
@Scheduled(cron = "0 0 */1 * * ?")  // 每小时
public void syncRedisToMysql() {
    // 对比 Redis 和 MySQL，修复差异
}

// 3. 缓存预热
public void initBlogLikes(Long blogId) {
    // 从 MySQL 恢复 Redis 数据
}
```

**经验总结：**

> 最终一致性：允许短暂不一致，通过兜底机制保证最终一致。

### 7.5 难点五：时钟回拨问题

**问题描述：**

使用雪花算法生成 ID 时，如果服务器时间回拨，可能生成重复 ID。

**解决方案：**

```java
public synchronized long nextId() {
    long currentTimestamp = getCurrentTimestamp();
    
    // 检测时钟回拨
    if (currentTimestamp < lastTimestamp) {
        long offset = lastTimestamp - currentTimestamp;
        if (offset <= 5) {
            // 小范围回拨，等待追上
            Thread.sleep(offset << 1);
            currentTimestamp = getCurrentTimestamp();
        }
        if (currentTimestamp < lastTimestamp) {
            throw new RuntimeException("时钟回拨，拒绝生成ID");
        }
    }
    // ...
}
```

**经验总结：**

> 时钟回拨是分布式 ID 的经典问题。
> 解决方案：检测+等待、拒绝服务、预留位。

---

## 8. 面试问答

### 8.1 项目整体

**Q1：为什么做这个项目？**

> 我想深入实践主流技术栈，特别是 Spring Boot 生态和分布式相关技术。
> 博客系统功能全面，涵盖了认证授权、缓存、搜索、消息队列、实时通信等多个技术点，
> 同时也能作为个人作品集展示。整个项目从设计到部署都是我独立完成的。

**Q2：项目有多少用户？**

> 目前主要是自己使用和给朋友展示，日均 PV 约 1000+。
> 虽然用户量不大，但我在架构设计上是按照生产级标准来做的，
> 比如引入了缓存、消息队列、全文搜索等，可以支持更大的并发量。

**Q3：这个项目的创新点在哪？**

> 1. **事件驱动架构**：引入 Kafka 消息队列，解耦业务逻辑
> 2. **读写分离设计**：高频操作直接写 Redis，异步同步 MySQL
> 3. **实时通知系统**：Kafka + WebSocket 双通道推送
> 4. **AI 能力集成**：Spring AI + GLM-4 实现智能助手
> 5. **完善的性能优化**：分布式锁、限流、缓存、异步处理

### 8.2 技术架构

**Q4：为什么选择前后端分离？**

> 1. **职责分离**：前端专注UI，后端专注业务逻辑
> 2. **并行开发**：前后端可以独立开发和部署
> 3. **技术选型灵活**：前端可以随时切换框架
> 4. **支持多端**：同一套 API 可以给 Web、App 使用

**Q5：为什么用 Kafka 而不是 RabbitMQ？**

> 选型考虑：
> - **Kafka**：高吞吐、持久化强、支持重放，适合事件流
> - **RabbitMQ**：灵活路由、低延迟，适合业务消息
> 
> 通知系统的场景更像事件流（点赞、评论等操作日志），
> 需要消息持久化和可重放能力，所以选 Kafka。
> 
> 如果未来需要延迟队列或复杂路由，会考虑引入 RabbitMQ。

**Q6：如何保证系统的高可用？**

> 目前是单机部署，但架构上做了高可用准备：
> 
> 1. **无状态设计**：使用 JWT，可以随时横向扩展
> 2. **数据持久化**：所有数据都有持久化，Redis 只做缓存
> 3. **异常降级**：Redis/ES 异常时降级到数据库
> 4. **健康检查**：Docker Health Check 自动重启异常容器
> 
> 如果要做高可用，可以：
> - Nginx 负载均衡多个后端实例
> - MySQL 主从复制 + 读写分离
> - Redis 哨兵模式
> - Kafka 集群部署

### 8.3 缓存设计

**Q7：如何防止缓存穿透、击穿、雪崩？**

> **缓存穿透**（查询不存在的数据）：
> - 方案：缓存空值，TTL 设短一点（5分钟）
> - 布隆过滤器（如果数据量大）
> 
> **缓存击穿**（热点 key 失效）：
> - 方案：分布式锁，只允许一个线程查数据库
> - 热点数据永不过期
> 
> **缓存雪崩**（大量 key 同时失效）：
> - 方案：TTL 加随机值，避免同时过期
> - Redis 持久化（RDB + AOF）

**Q8：Redis 和 MySQL 数据不一致怎么办？**

> 采用**最终一致性**方案：
> 
> 1. **事件重试**：写入失败自动重试 3 次
> 2. **定时任务**：每小时对比 Redis 和 MySQL，自动修复
> 3. **缓存预热**：应用启动时从 MySQL 加载热点数据到 Redis
> 4. **兜底查询**：Redis 缺失时降级查数据库
> 
> 允许短暂不一致（几分钟内），但保证最终一致。

### 8.4 并发控制

**Q9：分布式锁如何避免死锁？**

> 三个关键机制：
> 
> 1. **自动过期**：SET key value NX EX seconds，即使宕机也会自动释放
> 2. **唯一标识**：value 使用 UUID，释放时验证，防止误删别人的锁
> 3. **原子操作**：用 Lua 脚本保证验证+删除的原子性
> 
> ```java
> // 加锁
> SET lock:key uuid NX EX 30
> 
> // 解锁（Lua 脚本）
> if redis.call('get', KEYS[1]) == ARGV[1] then
>     return redis.call('del', KEYS[1])
> end
> ```

**Q10：如何防止接口被恶意刷？**

> 三层防护：
> 
> 1. **全局限流**：`@GlobalRateLimit` 类级注解，默认 100次/分钟
> 2. **方法级限流**：重要接口单独配置，如登录 5次/5分钟
> 3. **IP 黑名单**：异常 IP 自动加入黑名单
> 
> 使用滑动窗口算法，比固定窗口更平滑：
> 
> ```java
> @RateLimit(key = "ip", limit = 5, window = 300)
> public Result<?> login() { }
> ```

### 8.5 数据库设计

**Q11：为什么用 MyBatis Plus 而不是 JPA？**

> 选型考虑：
> 
> - **MyBatis Plus**：SQL 可控、性能优、国内生态好
> - **JPA**：简洁、学习曲线平、跨数据库
> 
> 我的场景：
> 1. 需要写复杂 SQL（多表 JOIN、子查询）
> 2. 需要性能优化（手动控制 SQL）
> 3. 只用 MySQL，不需要跨数据库
> 
> 所以选 MyBatis Plus，同时享受基础 CRUD 的便利。

**Q12：如何设计索引？**

> 遵循几个原则：
> 
> 1. **最左前缀**：`(a, b, c)` 可以用 `a`、`(a,b)`、`(a,b,c)` 查询
> 2. **覆盖索引**：查询字段都在索引中，避免回表
> 3. **区分度高**：唯一值多的字段放前面
> 4. **避免索引失效**：不用函数、不用 `!=`、用 `LIMIT`
> 
> 示例：
> ```sql
> -- 通知查询优化
> CREATE INDEX idx_receiver_read_time 
>     ON tb_notification (receiver_id, is_read, create_time DESC);
> 
> -- 覆盖查询：SELECT * WHERE receiver_id=? AND is_read=0 ORDER BY create_time DESC
> ```

### 8.6 性能优化

**Q13：做了哪些性能优化？**

> 主要从三个层面：
> 
> **1. 缓存层**
> - 点赞直接写 Redis，响应时间从 50ms 降到 2ms
> - 博客详情缓存 30 分钟，缓存命中率 >90%
> 
> **2. 并发层**
> - 分布式锁防止重复点赞
> - 接口限流防止恶意攻击
> - 异步线程池处理耗时操作
> 
> **3. 存储层**
> - Elasticsearch 全文搜索，毫秒级响应
> - 数据库复合索引，查询性能提升 5 倍
> - 雪花算法 ID，为分库分表做准备

**Q14：如何验证优化效果？**

> 1. **压测**：JMeter 测试 QPS 和响应时间
>    - 点赞接口：优化前 200 QPS，优化后 5000+ QPS
> 
> 2. **慢查询日志**：监控 MySQL slow log
>    - 优化前：10+ 条慢查询/天
>    - 优化后：基本没有慢查询
> 
> 3. **Redis 监控**：
>    - 缓存命中率：>90%
>    - 内存使用：稳定在 100MB 左右
> 
> 4. **用户体验**：
>    - 页面加载时间：< 1s
>    - 点赞响应时间：< 100ms
>    - 搜索响应时间：< 200ms

### 8.7 AI 集成

**Q15：如何集成 AI 能力？**

> 使用 Spring AI 框架集成 GLM-4 大模型：
> 
> ```java
> @Service
> public class AIAssistantService {
>     private final ChatClient chatClient;
>     
>     public String chat(String message) {
>         return chatClient.prompt()
>             .user(message)
>             .call()
>             .content();
>     }
> }
> ```
> 
> **功能实现：**
> 1. 智能问答：回答用户提问
> 2. 标题生成：根据内容生成标题
> 3. 内容润色：优化文章表达
> 4. 关键词提取：自动提取标签
> 5. 摘要生成：生成文章摘要
> 
> **限流保护：**
> ```java
> @RateLimit(key = "ai_chat", limit = 20, window = 60)
> ```

### 8.8 部署运维

**Q16：如何部署到生产环境？**

> 使用 Docker 容器化部署：
> 
> **1. 本地构建**
> ```bash
> # 后端
> ./mvnw clean package -DskipTests
> 
> # 前端
> npm run build
> ```
> 
> **2. 上传到服务器**
> ```bash
> scp target/*.jar root@server:/app/myblog/
> scp -r dist/* root@server:/app/myblog/frontend/
> ```
> 
> **3. 服务器部署**
> ```bash
> docker-compose -f docker-compose.prod.yml up -d
> ```
> 
> **4. 健康检查**
> ```bash
> curl http://localhost:8081/actuator/health
> ```
> 
> 整个过程自动化成脚本，一键部署，3 分钟完成更新。

**Q17：如何监控系统状态？**

> **当前监控方案：**
> 
> 1. **Docker 健康检查**：自动重启异常容器
> 2. **日志收集**：Logback 记录所有操作
> 3. **手动巡检**：定期查看 `docker stats` 和日志
> 
> **可以改进的地方：**
> 
> 1. **Prometheus + Grafana**：可视化监控
> 2. **ELK Stack**：日志聚合分析
> 3. **SkyWalking**：链路追踪
> 4. **告警系统**：异常自动告警

---

## 📝 总结

### 项目价值

1. **技术广度**：涵盖后端主流技术栈
2. **技术深度**：深入理解分布式、缓存、搜索等
3. **工程能力**：完整的设计、开发、部署流程
4. **问题解决**：遇到问题，分析原因，提出解决方案

### 面试建议

1. **准备项目演示**：提前打开在线地址
2. **准备架构图**：画出系统架构和核心流程
3. **准备难点解析**：每个难点的问题、原因、方案
4. **准备数据支撑**：QPS、响应时间、优化效果
5. **准备扩展思路**：如果让你优化，你会怎么做

### 面试话术技巧

1. **STAR 法则**：Situation → Task → Action → Result
2. **数据说话**：用具体数字展示优化效果
3. **对比分析**：说清楚为什么选 A 不选 B
4. **承认不足**：坦诚项目的局限性和改进空间
5. **展示思考**：不只是做了什么，更重要的是为什么这么做

---

**祝面试顺利！🎉**
