# MyBlog 设计模式应用指南

> 本文档总结了项目中使用的设计模式，用于面试技术深度展示

## 📊 设计模式总览

| 设计模式 | 应用场景 | 核心类 |
|---------|----------|--------|
| **工厂模式** | Redis Key 统一生成 | `RedisKeyFactory` |
| **观察者模式** | 事件驱动解耦 | `LikeEvent`, `NotificationEvent` |
| **代理模式** | AOP 切面 | `RateLimitAspect`, `DistributedLockAspect` |
| **策略模式** | 通知类型处理 | `NotificationEvent` 类型枚举 |
| **模板方法** | MyBatis Plus 基类 | `ServiceImpl` 模板类 |
| **单例模式** | Spring Bean | 所有 `@Service`, `@Component` |
| **建造者模式** | 事件构建 | `NotificationEvent` 静态工厂方法 |
| **门面模式** | 缓存统一接口 | `UnifiedCacheService` |
| **装饰器模式** | 缓存增强 | `CacheConsistencyService` |

---

## 1️⃣ 工厂模式（Factory Pattern）

### 应用一：`RedisKeyFactory`

```java
// 统一管理 Redis Key 的生成
public enum RedisKeyFactory {
    BLOG_DETAIL("blog:detail:%s", 30, TimeUnit.MINUTES, "博客详情缓存"),
    BLOG_LIKES_SET("blog:likes:%s", 7, TimeUnit.DAYS, "博客点赞集合"),
    CAPTCHA_CODE("captcha:code:%s", 5, TimeUnit.MINUTES, "验证码"),
    // ...

    public String getKey(Object... args) {
        return PROJECT_PREFIX + String.format(pattern, args);
    }
}
```

### 应用二：`CaptchaCodeGenerator`（v2.0.0 新增）

```java
// 验证码生成器工厂
@Component
public class CaptchaCodeGenerator {

    public CaptchaDTO generate() {
        // 1. 生成唯一 ID（工厂模式）
        String captchaId = UUID.randomUUID().toString();

        // 2. 生成验证码文本
        String code = generateRandomCode(4);

        // 3. 绘制验证码图片
        String imageBase64 = drawCaptchaImage(code);

        // 4. 存储到 Redis（使用工厂管理 key）
        unifiedCacheService.set(
            RedisKeyFactory.CAPTCHA_CODE,
            code,
            captchaId
        );

        return new CaptchaDTO(captchaId, imageBase64);
    }
}
```

### 面试话术

> **问：为什么要用工厂模式管理 Redis Key？**
>
> 答：主要解决三个问题：
> 1. **命名规范化**：避免各处代码硬编码 key，统一格式 `myblog:module:function:id`
> 2. **TTL 统一管理**：每个 Key 的过期时间在一处定义，便于调优
> 3. **类型安全**：enum 自带编译检查，避免拼写错误
>
> **问：验证码系统如何设计的？**
>
> 答：采用工厂模式 + 缓存 + 图形生成：
> 1. **工厂模式**：统一管理验证码 Redis Key 和过期时间
> 2. **Base64 编码**：图片直接返回前端，无需存储文件
> 3. **唯一 ID 绑定**：每次生成新 ID，防止重放攻击
> 4. **自动过期**：Redis 5 分钟自动过期，减少数据库压力

---

## 2️⃣ 观察者模式（Observer Pattern）

### 应用：Spring Event 事件机制

```java
// 事件定义
public class LikeEvent extends ApplicationEvent {
    private final Long blogId;
    private final Long userId;
    private final boolean isLike;
}

// 事件发布
eventPublisher.publishEvent(new LikeEvent(this, blogId, userId, true));

// 事件监听
@EventListener
@Async("commonAsyncExecutor")
public void handleLikeEvent(LikeEvent event) {
    // 异步持久化到数据库
}
```

### 面试话术

> **问：为什么用事件驱动而不是直接调用？**
>
> 答：解耦 + 异步 + 可扩展：
> 1. **解耦**：Redis 操作和 MySQL 操作分离，互不依赖
> 2. **异步**：主流程只操作 Redis（1-2ms），数据库写入异步完成
> 3. **可扩展**：未来加新功能（如发通知），只需加新的 Listener

---

## 3️⃣ 代理模式（Proxy Pattern）

### 应用：AOP 切面

```java
// 分布式锁切面
@Aspect
@Component
public class DistributedLockAspect {
    
    @Around("@annotation(distributedLock)")
    public Object around(ProceedingJoinPoint point, DistributedLock distributedLock) {
        // 前置：获取锁
        boolean locked = tryLock(lockKey, lockValue, expire);
        try {
            return point.proceed();  // 执行原方法
        } finally {
            // 后置：释放锁
            unlock(lockKey, lockValue);
        }
    }
}
```

### 项目中的 AOP 切面

| 切面 | 功能 | 技术点 |
|-----|------|-------|
| `RateLimitAspect` | 接口限流 | 滑动窗口算法 |
| `DistributedLockAspect` | 分布式锁 | SpEL + Lua 脚本 |
| `AuditLogAspect` | 审计日志 | 操作记录 |

### 面试话术

> **问：为什么用 AOP 实现限流/锁？**
>
> 答：非侵入式横切关注点：
> 1. **不修改业务代码**：一个注解搞定，业务逻辑保持干净
> 2. **统一管理**：限流规则集中配置，便于全局调整
> 3. **可插拔**：关闭切面不影响业务功能

---

## 4️⃣ 策略模式（Strategy Pattern）

### 应用：通知类型处理

```java
public enum NotificationType {
    COMMENT,      // 评论通知
    LIKE,         // 点赞通知  
    FOLLOW,       // 关注通知
    COLLECTION,   // 收藏通知
    SYSTEM,       // 系统通知
    NEW_ARTICLE,  // 新文章通知
    MENTION,      // @提及通知
    STATS         // 统计通知
}

// 根据类型创建不同的通知事件
public static NotificationEvent likeEvent(...) { ... }
public static NotificationEvent commentEvent(...) { ... }
public static NotificationEvent followEvent(...) { ... }
```

### 面试话术

> **问：如何扩展新的通知类型？**
>
> 答：只需三步：
> 1. 在 `NotificationType` 枚举中添加新类型
> 2. 在 `NotificationEvent` 中添加静态工厂方法
> 3. 在前端添加对应的展示逻辑
>
> 无需修改核心处理流程，符合开闭原则。

---

## 5️⃣ 门面模式（Facade Pattern）

### 应用：`UnifiedCacheService`

```java
/**
 * 统一缓存服务 - 封装所有 Redis 操作
 */
public interface UnifiedCacheService {
    // String 操作
    void set(RedisKeyFactory keyFactory, Object value, Object... args);
    <T> T get(RedisKeyFactory keyFactory, Class<T> clazz, Object... args);
    
    // Set 操作
    Long addToSet(RedisKeyFactory keyFactory, Object[] values, Object... args);
    
    // ZSet 操作
    Boolean addToZSet(RedisKeyFactory keyFactory, Object value, double score, Object... args);
    
    // Hash 操作
    void hashPut(RedisKeyFactory keyFactory, String field, Object value, Object... args);
}
```

### 面试话术

> **问：为什么要封装 RedisTemplate？**
>
> 答：屏蔽复杂性，提供简洁接口：
> 1. **自动管理 Key**：结合 `RedisKeyFactory`，不用手动拼接
> 2. **自动管理 TTL**：过期时间从工厂获取，不用每次指定
> 3. **异常降级**：Redis 异常时自动降级，不影响业务
> 4. **类型安全**：泛型方法，避免强制转换

---

## 6️⃣ 模板方法模式（Template Method）

### 应用：MyBatis Plus `ServiceImpl`

```java
// 基类提供通用实现
public class ServiceImpl<M extends BaseMapper<T>, T> implements IService<T> {
    @Override
    public boolean save(T entity) {
        return SqlHelper.retBool(getBaseMapper().insert(entity));
    }
    
    @Override
    public boolean updateById(T entity) {
        return SqlHelper.retBool(getBaseMapper().updateById(entity));
    }
    // ...
}

// 子类继承并扩展
@Service
public class BlogServiceImpl extends ServiceImpl<BlogMapper, Blog> 
    implements BlogService {
    
    // 只实现特定业务逻辑
    public BlogDetailVO getBlogDetail(Long id) {
        // 自定义实现
    }
}
```

---

## 7️⃣ 建造者模式（Builder Pattern）

### 应用：`NotificationEvent` 静态工厂方法

```java
public class NotificationEvent extends ApplicationEvent {
    
    // 静态工厂方法 - 链式构建
    public static NotificationEvent likeEvent(
            Object source,
            Long receiverId,
            Long senderId,
            String title,
            Long resourceId,
            Map<String, Object> extraData) {
        
        NotificationEvent event = new NotificationEvent(source);
        event.receiverId = receiverId;
        event.senderId = senderId;
        event.type = NotificationType.LIKE;
        event.title = title;
        event.resourceId = resourceId;
        event.extraData = extraData;
        return event;
    }
}
```

---

## 8️⃣ 装饰器模式（Decorator Pattern）

### 应用：`CacheConsistencyService`

```java
/**
 * 缓存一致性服务 - 在基础缓存操作上增强
 * 
 * 增强功能：
 * - 版本控制
 * - 跨实例通知
 * - 一致性检查
 */
public interface CacheConsistencyService {
    Long getCacheVersion(String key);
    void updateCacheVersion(String key);
    void publishCacheInvalidation(String pattern, String reason);
    boolean isCacheValid(String key, Long version);
}
```

---

## 🎯 面试总结

### 设计模式三连问

**Q1：项目中用了哪些设计模式？**

> 主要使用了8种：工厂、观察者、代理、策略、模板方法、单例、建造者、门面。
> 其中最核心的是**观察者模式**（事件驱动）和**代理模式**（AOP切面）。

**Q2：为什么选择这些模式？**

> 遵循 SOLID 原则：
> - **单一职责**：每个类只做一件事（AOP 切面分离横切关注点）
> - **开闭原则**：扩展新功能不修改原有代码（策略模式添加通知类型）
> - **依赖倒置**：依赖接口而非实现（门面模式封装 Redis）

**Q3：如果让你重新设计，会做什么改进？**

> 可以考虑：
> 1. 引入**责任链模式**处理请求校验流程
> 2. 使用**状态模式**管理博客状态转换
> 3. 用**享元模式**复用热点数据对象
