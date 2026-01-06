# 监控系统设计与实现 - 面试指南

> 💡 **面试建议**：监控系统是展示你对生产环境意识、数据准确性关注、以及系统可观测性理解的绝佳机会。重点突出**真实数据采集**和**数据准确性优化**。

---

## 📊 系统概述

### 1分钟电梯演讲

"我在项目中设计并实现了一个**三层架构的监控系统**，涵盖**系统指标、性能指标和业务指标**。系统通过Micrometer监控JVM和HTTP性能，结合数据库查询统计业务数据，最终展示在管理员Dashboard。

**核心亮点**是我发现并修复了5个严重的数据准确性问题，比如用户活跃度统计错误地使用注册用户数而非真实活跃用户，QPS计算完全错误等。通过引入访问日志统计、优化计算逻辑，使监控数据从**不可用变为可靠的决策依据**。

这个经历让我深刻理解了**监控不仅要有，更要准确**的道理。"

---

## 🏗️ 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    监控Dashboard (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 系统指标卡片 │  │ 性能指标卡片 │  │ 业务指标卡片 │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP API
┌─────────────────────────────────────────────────────────────┐
│              后端监控服务 (Spring Boot)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         MonitoringService (业务逻辑层)                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ 系统指标   │  │ 性能指标   │  │ 业务指标   │     │   │
│  │  │ 采集器     │  │ 采集器     │  │ 采集器     │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           ↓                    ↓                    ↓
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │Micrometer│        │  JVM     │        │ Database │
    │ Registry │        │ MXBean   │        │ Queries  │
    └──────────┘        └──────────┘        └──────────┘
```

### 三层监控指标

| 层级 | 指标类型 | 数据来源 | 采集方式 |
|------|---------|---------|---------|
| **系统层** | JVM、CPU、内存、数据库连接池、Redis | Micrometer + MXBean | 实时采集 |
| **性能层** | QPS、响应时间、P95/P99、错误率 | Micrometer HTTP Metrics | 实时采集 |
| **业务层** | 用户活跃度、内容统计、互动数据 | MySQL + 访问日志表 | 数据库查询 |

---

## 💻 技术实现

### 1. 核心技术栈

```java
// 依赖配置
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

**选型理由**：
- **Micrometer**：Spring Boot官方推荐的监控门面，支持多种监控系统
- **Spring Actuator**：提供开箱即用的健康检查和指标暴露
- **访问日志表**：自建表，用于准确统计用户活跃度

### 2. 系统指标采集

**JVM内存监控**：
```java
private long getJvmMemoryUsed() {
    Gauge gauge = meterRegistry.find("jvm.memory.used")
            .tag("area", "heap")
            .gauge();
    return gauge != null ? (long) gauge.value() : 0L;
}
```

**数据库连接池监控**（HikariCP）：
```java
private int getDbConnectionActive() {
    Object hikariPool = dataSource.getClass()
            .getMethod("getHikariPoolMXBean")
            .invoke(dataSource);
    return (int) hikariPool.getClass()
            .getMethod("getActiveConnections")
            .invoke(hikariPool);
}
```

**技术要点**：
- 使用**反射API**获取HikariCP的MXBean
- 优雅处理异常，采集失败返回默认值而非崩溃

### 3. 性能指标采集

**QPS计算（优化后）**：
```java
private double getRequestsPerSecond() {
    Timer timer = meterRegistry.find("http.server.requests").timer();
    if (timer != null) {
        long count = timer.count();
        long uptimeSeconds = ManagementFactory.getRuntimeMXBean()
                .getUptime() / 1000;
        return uptimeSeconds > 0 ? (double) count / uptimeSeconds : 0.0;
    }
    return 0.0;
}
```

**关键改进**：
- ❌ **修复前**：`count / 60` - 完全错误的算法
- ✅ **修复后**：基于JVM运行时间计算平均速率

**P95/P99响应时间**：
```java
private double getP95ResponseTime() {
    Timer timer = meterRegistry.find("http.server.requests").timer();
    try {
        var snapshot = timer.takeSnapshot();
        var percentileValues = snapshot.percentileValues();
        for (var pv : percentileValues) {
            if (pv.percentile() >= 0.95) {
                return pv.value(TimeUnit.MILLISECONDS);
            }
        }
    } catch (Exception ex) {
        // fallback to max
        return timer.max(TimeUnit.MILLISECONDS);
    }
}
```

**技术亮点**：
- 尝试使用**snapshot**获取精确分位数
- 使用**fallback机制**保证系统鲁棒性

### 4. 业务指标采集

**用户活跃度统计（核心优化）** ⭐：

```java
// VisitLogMapper.java - MyBatis查询
@Select("SELECT COUNT(DISTINCT user_id) FROM tb_visit_log " +
        "WHERE user_id IS NOT NULL " +
        "AND visit_time >= #{startTime} " +
        "AND visit_time < #{endTime} " +
        "AND deleted = 0")
Long countDistinctActiveUsers(@Param("startTime") LocalDateTime startTime, 
                               @Param("endTime") LocalDateTime endTime);

// MonitoringServiceImpl.java
private BusinessMetricsVO.UserActivityMetrics getUserActivityMetrics() {
    LocalDateTime todayStart = LocalDate.now().atStartOfDay();
    LocalDateTime todayEnd = now.plusDays(1).toLocalDate().atStartOfDay();
    
    // DAU: 今日有访问记录的去重用户数
    Long dau = visitLogMapper.countDistinctActiveUsers(todayStart, todayEnd);
    
    // WAU: 近7天有访问记录的去重用户数
    Long wau = visitLogMapper.countDistinctActiveUsers(weekAgo, todayEnd);
    
    // MAU: 近30天有访问记录的去重用户数
    Long mau = visitLogMapper.countDistinctActiveUsers(monthAgo, todayEnd);
}
```

**设计思路**：
1. **访问日志表设计**：记录每次页面访问的user_id和时间
2. **去重统计**：使用`COUNT(DISTINCT user_id)`确保用户不重复计数
3. **时间范围查询**：灵活支持不同时间窗口（日/周/月）

**数据对比**：
| 指标 | 修复前（错误） | 修复后（正确） |
|------|--------------|--------------|
| DAU | 统计今日注册用户 | 统计今日有访问记录的用户 |
| WAU | 统计近7天注册用户 | 统计近7天有访问记录的用户 |

---

## 🔧 数据准确性优化实战

### 问题发现过程

**发现方式**：代码审查时发现用户活跃度数据异常

```java
// 原始错误代码
Long dau = userMapper.selectCount(
    new LambdaQueryWrapper<User>()
        .ge(User::getCreateTime, todayStart)  // ❌ 使用创建时间
);
```

**问题分析**：
- `getCreateTime`是用户注册时间，不代表活跃
- 一个今天注册的用户和一个一年前注册但今天没访问的用户，前者算DAU而后者不算
- **数据含义完全错误**

### 5个修复案例

| # | 问题 | 根本原因 | 修复方案 | 技术难点 |
|---|------|---------|---------|---------|
| 1 | DAU/WAU/MAU错误 | 使用注册时间而非活跃时间 | 基于访问日志的`COUNT(DISTINCT user_id)` | MyBatis动态时间范围查询 |
| 2 | QPS完全错误 | `count / 60`无意义 | 基于JVM运行时间计算平均速率 | 理解Micrometer的counter含义 |
| 3 | P95/P99不准确 | 使用max代替分位数 | 尝试snapshot.percentileValues() | 处理Micrometer版本差异 |
| 4 | 错误率始终为0 | `tag("status", "5")`匹配不到 | 遍历所有Timer，匹配4xx/5xx | 字符串前缀匹配 |
| 5 | 每日访问量为0 | 硬编码`0L` | 查询访问日志表真实数据 | 日期范围查询 |

### 修复效果

**修复前**：
- 监控数据不可信，无法用于决策
- 用户活跃度数据含义错误
- QPS数据毫无意义

**修复后**：
- **用户活跃度**：从"注册用户数"变为"真实活跃用户数"
- **QPS**：从"无意义数值"变为"可用的平均速率"
- **错误率**：能正确反映系统健康状况
- **整体**：监控数据成为可靠的决策依据

---

## 🎯 核心原理讲解

### 1. Micrometer工作原理

```
应用代码 → Micrometer门面 → MeterRegistry → 具体监控系统
                                   ↓
                          SimpleMeterRegistry
                          PrometheusMeterRegistry
                          ...
```

**核心概念**：
- **Meter**：度量单位（Counter、Gauge、Timer等）
- **Tag**：标签，用于多维度统计（如按status、uri分组）
- **Registry**：注册表，存储所有Meter

### 2. HTTP指标自动采集

Spring Boot Actuator自动为每个HTTP请求创建Timer：

```java
// 自动创建的Timer
Timer timer = Timer.builder("http.server.requests")
    .tag("uri", "/api/blogs")
    .tag("status", "200")
    .tag("method", "GET")
    .register(registry);

// 每次请求自动记录
timer.record(() -> {
    // 实际的请求处理
});
```

### 3. 分位数计算

**简单理解**：
- P50（中位数）：50%的请求响应时间小于此值
- P95：95%的请求响应时间小于此值（只有5%的请求更慢）
- P99：99%的请求响应时间小于此值

**为什么P95/P99重要**：
- 平均值容易被极端值影响
- P95能反映**绝大多数用户的真实体验**
- P99能发现**偶发的性能问题**

---

## 🎤 面试问答集锦

### Q1: 你的监控系统都监控哪些指标？为什么选择这些？

**回答框架**：
"我设计了三层监控体系：

**系统层**监控JVM、CPU、数据库连接池等基础设施，因为这些是服务稳定性的基础。比如JVM内存使用率超过80%就需要考虑调优或扩容。

**性能层**监控QPS、响应时间、错误率，这些直接关系到用户体验。特别是P95响应时间，能反映95%用户的真实体验。

**业务层**监控用户活跃度、内容发布量、互动数据等，这些是产品健康度的核心指标。比如DAU下降可能意味着产品问题。

选择标准是：**能影响用户体验的必须监控，能支撑决策的优先监控**。"

---

### Q2: 用户活跃度(DAU)是怎么统计的？为什么不直接用登录日志？

**回答要点**：
"我使用**访问日志表**统计，记录每次页面访问的user_id和时间，然后用`COUNT(DISTINCT user_id)`去重统计。

```sql
SELECT COUNT(DISTINCT user_id) 
FROM tb_visit_log 
WHERE visit_time >= '2026-01-06 00:00:00' 
  AND visit_time < '2026-01-07 00:00:00'
  AND user_id IS NOT NULL
```

**为什么不用登录日志**：
1. 用户可能一天登录一次但访问多个页面 - 登录日志无法体现活跃度
2. JWT无状态认证，没有传统的"登录日志"
3. 访问日志更能反映**用户真实的使用行为**

**进一步优化**：还可以根据访问页面类型细分活跃度（浏览型、发布型、互动型）。"

---

### Q3: QPS是怎么计算的？遇到过什么坑？

**回答框架**：
"这是我修复的一个**严重Bug**。

**原始错误代码**：
```java
return timer.count() / 60.0;  // ❌ 完全错误
```

**问题分析**：
- `timer.count()`是**应用启动以来的总请求数**
- 除以60毫无意义，QPS应该是**单位时间内的请求数**
- 这个算法在应用运行1小时和运行1天时结果完全不同

**修复方案**：
```java
long totalRequests = timer.count();
long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
return (double) totalRequests / uptimeSeconds;  // 平均QPS
```

**局限性**：这是**平均QPS**，不是实时QPS。更好的方案是使用**滑动窗口**算法计算最近1分钟的QPS。

**收获**：这让我理解了**监控指标的定义必须清晰**，错误的监控比没有监控更危险。"

---

### Q4: 如何保证监控数据的准确性？

**回答要点**：
"我从三个层面保证：

**1. 数据源正确性**
- 用户活跃度必须基于访问日志，而非注册时间
- 错误率必须统计所有4xx和5xx，而非简单匹配

**2. 计算逻辑正确性**
- QPS要用总请求数除以运行时间，而非固定值
- P95/P99要用分位数算法，而非max

**3. 异常处理**
```java
try {
    return calculateMetric();
} catch (Exception e) {
    log.error("指标采集失败", e);
    return defaultValue;  // 返回默认值而非崩溃
}
```

我还建议**定期人工抽查数据**，比如DAU是否符合实际观察到的用户量。"

---

### Q5: P95响应时间是什么？如何计算的？

**回答框架**：
"P95表示**95%的请求响应时间小于此值**，只有5%的请求更慢。

**计算方法**：
1. 收集所有请求的响应时间：`[10ms, 20ms, 50ms, ...]`
2. 排序：`[10, 20, 30, ..., 500, 1000]`
3. 取第95%位置的值

**为什么重要**：
- **平均值**容易被极端值拉高（比如一个10秒的请求）
- **P95**能反映**大多数用户的真实体验**
- **P99**能发现**尾部延迟问题**

**我的实现**：
```java
var snapshot = timer.takeSnapshot();
var percentileValues = snapshot.percentileValues();
for (var pv : percentileValues) {
    if (pv.percentile() >= 0.95) {
        return pv.value(TimeUnit.MILLISECONDS);
    }
}
```

如果Micrometer版本不支持，fallback使用max。"

---

### Q6: 监控数据如何展示给用户？前端是怎么实现的？

**回答要点**：
"前端用**React + Recharts**实现Dashboard：

**数据流**：
```
后端API → Axios请求 → React State → Recharts图表
```

**关键组件**：
```typescript
interface MonitoringDashboard {
  system: SystemMetrics;      // JVM、CPU、数据库
  performance: PerformanceMetrics;  // QPS、响应时间
  business: BusinessMetrics;   // DAU、内容统计
}
```

**刷新策略**：
- 系统指标：30秒自动刷新
- 业务指标：60秒刷新（数据库查询较重）

**优化点**：
- 使用**useMemo**缓存图表配置，避免重复渲染
- 接口失败时显示上次成功的数据（降级策略）"

---

### Q7: 如果监控系统本身出问题了怎么办？

**回答框架**：
"监控系统的可靠性设计：

**1. 异常不传播**
```java
try {
    return getMetrics();
} catch (Exception e) {
    log.error("监控采集失败", e);
    return defaultMetrics();  // 返回默认值
}
```

**2. 采集失败不影响主业务**
- 监控代码在独立的Service中
- 使用AOP时标记`@Around`不抛异常

**3. 降级策略**
- Redis不可用 → 不统计在线用户，返回0
- 数据库慢 → 增加查询超时，返回缓存数据

**4. 监控的监控**
- Spring Actuator的`/actuator/health`
- 使用外部监控（如阿里云监控）监控应用本身

核心原则：**监控失败不能影响业务**。"

---

### Q8: 你觉得这个监控系统还有哪些可以优化的地方？

**回答要点**（展示思考深度）：
"我认为有几个方向：

**1. 实时性优化**
- 当前QPS是平均值，改用**滑动窗口**算法计算最近1分钟的实时QPS
- 使用WebSocket推送告警，而非轮询

**2. 告警机制**
- 设置阈值（如错误率>5%、P95>1000ms）
- 集成钉钉/邮件/短信通知

**3. 历史数据持久化**
- 当前只有实时数据，应定期持久化到时序数据库（InfluxDB）
- 支持查看历史趋势、同比环比分析

**4. 链路追踪**
- 集成SkyWalking或Zipkin
- 定位慢接口的具体原因（数据库慢？Redis慢？）

**5. 用户行为分析**
- 基于访问日志做漏斗分析
- 统计用户留存率、转化率

这些都是生产环境级别的优化，受限于项目规模暂未实现。"

---

## 📈 亮点总结（面试话术）

### 开场介绍

"我独立设计并实现了这个监控系统，涵盖系统、性能、业务三个层面。**最有成就感的是发现并修复了5个数据准确性问题**，让监控从不可用变为可靠。"

### 技术亮点

1. **多维度监控** - 系统/性能/业务三层，全方位覆盖
2. **数据准确性** - 修复5个严重Bug，体现细节把控
3. **访问日志设计** - 支持灵活的活跃度统计和行为分析
4. **容错机制** - 采集失败不影响主业务
5. **优化思维** - 能识别问题并提出合理的改进方案

### 结束语

"这个项目让我理解了**监控的价值不在于有，而在于准**。错误的监控比没有监控更危险，因为会误导决策。"

---

## 🔗 扩展阅读

- [Micrometer官方文档](https://micrometer.io/docs)
- [Spring Boot Actuator指南](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [监控系统优化Walkthrough](../../brain/walkthrough.md) - 实际修复过程

---

**最后更新：** 2026-01-06  
**作者：** Ryan Xu
