-- 博客文章种子数据
-- 为本地开发和生产环境生成丰富的测试数据
-- 创建时间: 2025-12-13

USE myblog;

-- ============================================
-- 插入新的高质量技术博客文章
-- ============================================

-- 文章: AI Agent 入门
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('从零构建 AI Agent：LangChain 实战指南', 
'深入理解 AI Agent 的核心概念，通过 LangChain 框架实现一个具备工具调用能力的智能助手。本文涵盖 Agent 架构设计、Prompt Engineering 和实战案例。',
'# 从零构建 AI Agent：LangChain 实战指南

## 前言

随着大语言模型（LLM）的快速发展，AI Agent 已成为当下最热门的技术趋势之一。本文将带你深入理解 Agent 的核心概念，并通过 LangChain 框架构建一个功能完整的智能助手。

## 什么是 AI Agent？

AI Agent 是一个能够**感知环境、做出决策、执行动作**的智能系统。与传统的 LLM 应用不同，Agent 具备以下特点：

1. **自主规划** - 能够分解复杂任务为多个步骤
2. **工具调用** - 可以使用外部工具扩展能力
3. **记忆机制** - 保持上下文连贯性
4. **反思能力** - 能够评估和修正自己的行为

## 核心架构

```python
from langchain.agents import initialize_agent, Tool
from langchain.llms import OpenAI
from langchain.memory import ConversationBufferMemory

# 定义工具
tools = [
    Tool(
        name="Search",
        func=search_tool,
        description="用于搜索互联网信息"
    ),
    Tool(
        name="Calculator",
        func=calculator_tool,
        description="用于数学计算"
    )
]

# 初始化 Agent
agent = initialize_agent(
    tools=tools,
    llm=OpenAI(temperature=0),
    agent="zero-shot-react-description",
    memory=ConversationBufferMemory(),
    verbose=True
)
```

## ReAct 框架

ReAct (Reasoning + Acting) 是目前最流行的 Agent 框架：

```
思考 (Thought) → 行动 (Action) → 观察 (Observation) → 循环
```

这种模式让 Agent 能够在执行前进行推理，根据观察结果调整策略，逐步逼近目标。

## 最佳实践

### 1. Prompt Engineering

好的提示词是 Agent 成功的关键。需要明确定义角色、任务目标和可用工具。

### 2. 错误处理

实现重试机制和降级处理，确保 Agent 的稳定性。

### 3. 成本控制

- 设置最大迭代次数
- 使用缓存减少重复调用
- 选择合适的模型

## 总结

AI Agent 代表了 AI 应用的新范式。通过 LangChain 等框架，我们可以快速构建具备推理和行动能力的智能系统。

---

*如果你对 AI Agent 有任何问题，欢迎在评论区讨论！*',
1, 1, 1, 1, 1, 1234, 89, 23,
TIMESTAMPADD(HOUR, -48, NOW()), NOW());

-- 文章: React 性能优化
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('React 19 性能优化完全指南', 
'深入探讨 React 19 的性能优化技巧，包括 Server Components、Suspense、并发渲染等新特性的最佳实践。',
'# React 19 性能优化完全指南

## 引言

React 19 带来了革命性的性能改进。本文将系统地介绍如何利用这些新特性构建高性能的 React 应用。

## Server Components

React Server Components (RSC) 是 React 19 最重要的特性之一：

```tsx
// app/page.tsx - Server Component
async function BlogList() {
  // 直接在服务端获取数据
  const posts = await db.posts.findMany()
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### 优势

1. **零 Bundle Size** - 服务端组件不会打包到客户端
2. **直接数据访问** - 无需 API 层
3. **更好的 SEO** - 完整的 HTML 渲染

## 并发渲染

### useTransition

```tsx
function SearchResults() {
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  
  const handleChange = (e) => {
    setQuery(e.target.value)
    startTransition(() => {
      fetchResults(e.target.value)
    })
  }
  
  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results />}
    </>
  )
}
```

## 记忆化策略

### React.memo

```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  return <ExpensiveVisualization data={data} />
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id
})
```

## 总结

React 19 的性能优化需要综合运用多种技术：

| 技术 | 适用场景 |
|------|---------|
| Server Components | 静态内容、数据获取 |
| useTransition | 非紧急的 UI 更新 |
| Suspense | 异步数据加载 |
| React.memo | 避免不必要的重渲染 |

希望这些技巧能帮助你构建更快的 React 应用！',
1, 1, 1, 1, 0, 856, 56, 12,
TIMESTAMPADD(HOUR, -72, NOW()), NOW());

-- 文章: Java 虚拟线程
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('Java 21 虚拟线程实战：告别传统线程池', 
'Java 21 正式引入虚拟线程（Virtual Threads），彻底改变了 Java 并发编程模式。本文通过实际案例对比传统线程池和虚拟线程的性能差异。',
'# Java 21 虚拟线程实战：告别传统线程池

## 什么是虚拟线程？

虚拟线程是 Java 21 引入的轻量级线程实现，由 JVM 管理而非操作系统。一个 JVM 可以轻松创建数百万个虚拟线程！

## 传统线程 vs 虚拟线程

### 传统方式

```java
ExecutorService executor = Executors.newFixedThreadPool(200);

for (int i = 0; i < 10000; i++) {
    final int taskId = i;
    executor.submit(() -> {
        Thread.sleep(1000);
        return "Task " + taskId;
    });
}
```

**问题**：线程池大小有限，大量任务需要排队等待。

### 虚拟线程方式

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10000; i++) {
        final int taskId = i;
        executor.submit(() -> {
            Thread.sleep(1000);
            return "Task " + taskId;
        });
    }
}
```

**优势**：每个任务一个虚拟线程，无需排队！

## 性能对比

| 指标 | 传统线程池 (200线程) | 虚拟线程 |
|-----|---------------------|---------|
| 10000 任务完成时间 | ~50秒 | ~1秒 |
| 内存占用 | ~200MB | ~50MB |
| 线程创建开销 | 高 | 极低 |

## Spring Boot 集成

```yaml
spring:
  threads:
    virtual:
      enabled: true
```

就这么简单！Spring Boot 3.2+ 会自动使用虚拟线程处理请求。

## 总结

虚拟线程是 Java 并发编程的重大突破：

1. **超高并发** - 轻松处理百万级并发
2. **简化代码** - 告别复杂的异步回调
3. **降低资源** - 更少的内存占用
4. **无缝集成** - 与现有代码完全兼容

赶紧升级到 Java 21，体验虚拟线程的魅力吧！',
1, 1, 1, 1, 0, 723, 42, 8,
TIMESTAMPADD(HOUR, -96, NOW()), NOW());

-- 文章: MySQL 索引优化
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('MySQL 索引优化实战：从慢查询到毫秒级响应', 
'通过真实案例讲解 MySQL 索引设计原则、EXPLAIN 分析技巧和常见优化策略，帮助你从根本上解决慢查询问题。',
'# MySQL 索引优化实战：从慢查询到毫秒级响应

## 问题背景

最近线上系统出现了严重的慢查询问题，一个简单的列表查询竟然需要 5 秒！

## 案例分析

### 问题 SQL

```sql
SELECT * FROM orders 
WHERE user_id = 123 
  AND status = 1 
  AND create_time > "2024-01-01"
ORDER BY create_time DESC
LIMIT 20;
```

执行时间：5.2秒

### EXPLAIN 分析结果

**全表扫描**！没有使用任何索引。

## 索引设计原则

### 1. 最左前缀原则

```sql
CREATE INDEX idx_user_status_time 
ON orders(user_id, status, create_time);
```

### 2. 选择性原则

高选择性的列应该放在索引前面。

### 3. 覆盖索引

使用覆盖索引时，Extra 显示 "Using index"，无需回表！

## 优化效果

执行时间：**12ms**

## 常见索引陷阱

1. **函数导致索引失效** - 避免在索引列上使用函数
2. **隐式类型转换** - 确保数据类型一致
3. **OR 条件优化** - 考虑使用 UNION 替代

## 总结

| 优化策略 | 效果 |
|---------|------|
| 联合索引 | 避免多个单列索引 |
| 覆盖索引 | 避免回表查询 |
| 避免函数 | 保持索引有效 |

记住：**不是索引越多越好**，每个索引都有维护成本！',
1, 4, 1, 1, 0, 1567, 98, 31,
TIMESTAMPADD(HOUR, -120, NOW()), NOW());

-- 文章: 职业发展
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('程序员如何突破职业瓶颈：技术与管理双线发展', 
'分享从初级开发者到技术负责人的成长经历，探讨技术深度与管理宽度的平衡之道。',
'# 程序员如何突破职业瓶颈：技术与管理双线发展

## 引言

工作五年了，你是否感觉：
- 技术增长变慢？
- 晋升遇到天花板？
- 不知道该走技术还是管理？

今天分享一些个人的成长心得。

## 职业发展阶段

### 第一阶段：技术积累期 (1-3年)

**核心任务**：打好技术基础

- 熟练掌握主流技术栈
- 培养良好的编码习惯
- 学会阅读源码和文档

### 第二阶段：技术成长期 (3-5年)

**核心任务**：建立技术体系

- 掌握架构设计能力
- 理解业务全局
- 带新人、做分享

### 第三阶段：方向选择期 (5年+)

#### 路线A：技术专家

高级工程师 → 技术专家 → 架构师 → 首席架构师

#### 路线B：技术管理

技术骨干 → 技术组长 → 技术经理 → 技术总监

## 核心建议

### 1. 保持技术敏感度

无论走哪条路，都不能放弃技术：

- 每周：阅读技术文章
- 每月：尝试新技术/工具
- 每季度：完成一个小项目

### 2. 培养软技能

- **沟通能力**：清晰表达技术方案
- **写作能力**：文档、博客、周报
- **演讲能力**：技术分享、汇报

### 3. 构建影响力

- 写技术博客
- 参与开源项目
- 技术社区活跃

## 结语

职业发展没有标准答案。无论选择哪条路，都需要：

- 明确目标
- 持续学习
- 勇于挑战
- 保持开放

希望每个程序员都能找到适合自己的发展道路！

---

*你目前处于哪个阶段？有什么困惑？欢迎留言讨论！*',
1, 3, 1, 1, 0, 2341, 156, 45,
TIMESTAMPADD(HOUR, -144, NOW()), NOW());

-- 文章: 微服务架构
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('微服务架构避坑指南：从单体到分布式的演进之路', 
'结合实际项目经验，分享微服务架构设计中的常见问题和解决方案，包括服务拆分、数据一致性、调用链路追踪等核心话题。',
'# 微服务架构避坑指南：从单体到分布式的演进之路

## 前言

微服务架构是当下流行的架构模式，但它并不是银弹。本文分享一些实战中踩过的坑。

## 什么时候需要微服务？

### 单体架构的痛点

- 代码量巨大，编译部署慢
- 团队协作困难，代码冲突频繁
- 技术栈绑定，无法灵活选型
- 局部故障影响整体

### 微服务不是必选项

如果你的团队人数少于 10 人、业务复杂度较低，**单体架构可能是更好的选择**。

## 服务拆分原则

### 1. 业务边界清晰

根据领域驱动设计（DDD）的界限上下文划分。

### 2. 数据独立性

每个服务拥有自己的数据库，禁止直接访问其他服务的数据库。

### 3. 服务粒度适中

**经验法则**：一个服务由 2-3 人维护是合适的大小。

## 常见问题及解决方案

### 问题1：分布式事务

使用 Saga 模式或最终一致性方案。

### 问题2：服务发现

使用 Nacos 或 Consul 实现服务注册与发现。

### 问题3：调用链路追踪

使用 SkyWalking 或 Jaeger。

## 技术选型建议

| 组件 | 推荐方案 |
|-----|---------|
| 服务框架 | Spring Cloud Alibaba |
| 注册中心 | Nacos |
| 网关 | Spring Cloud Gateway |
| 熔断限流 | Sentinel |

## 总结

微服务是一把双刃剑：

**优点**：独立开发/部署/扩展、技术栈灵活、故障隔离

**缺点**：分布式系统复杂性、运维成本高、调试困难

**建议**：从单体开始，逐步演进。

---

*你的团队在微服务实践中遇到了哪些问题？欢迎分享交流！*',
1, 2, 1, 1, 0, 689, 34, 9,
TIMESTAMPADD(HOUR, -168, NOW()), NOW());

-- 文章: 前端工程化
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('2024 前端工程化最佳实践：从 Vite 到 Monorepo', 
'深入探讨现代前端工程化实践，包括 Vite 配置优化、Monorepo 管理、CI/CD 流程和代码规范。',
'# 2024 前端工程化最佳实践：从 Vite 到 Monorepo

## 为什么需要工程化？

现代前端项目复杂度日益增加，工程化能帮助我们：**提高效率、保证质量、降低成本**。

## 构建工具：Vite

### 为什么选择 Vite？

| 对比项 | Webpack | Vite |
|-------|---------|------|
| 开发启动 | 分钟级 | 秒级 |
| HMR 速度 | 秒级 | 毫秒级 |
| 配置复杂度 | 高 | 低 |

### Vite 优化配置

```typescript
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"]
        }
      }
    }
  }
})
```

## Monorepo 实践

### 为什么用 Monorepo？

- 代码复用更方便
- 统一版本管理
- 原子化提交

### 工具选择：pnpm + Turborepo

```
my-monorepo/
├── apps/
│   ├── web/
│   └── admin/
├── packages/
│   ├── ui/
│   └── utils/
└── turbo.json
```

## 代码规范

### ESLint + Prettier

统一代码风格，避免低级错误。

### Git Hooks (Husky + lint-staged)

提交前自动检查和格式化代码。

## 总结

2024 年前端工程化的核心要点：

| 领域 | 推荐方案 |
|-----|---------|
| 构建工具 | Vite |
| 包管理 | pnpm |
| Monorepo | Turborepo |
| 代码规范 | ESLint + Prettier |
| 测试框架 | Vitest |
| CI/CD | GitHub Actions |

工程化是一个持续优化的过程，选择适合团队的方案最重要！',
1, 1, 1, 1, 0, 534, 28, 6,
TIMESTAMPADD(HOUR, -192, NOW()), NOW());

-- ============================================
-- 更新博客标签关联
-- ============================================

-- AI Agent 文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = '从零构建 AI Agent：LangChain 实战指南' 
AND t.name IN ('人工智能', 'AI Agent', 'LangChain', 'Python')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- React 性能优化文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = 'React 19 性能优化完全指南' 
AND t.name IN ('React', '前端')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- Java 虚拟线程文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = 'Java 21 虚拟线程实战：告别传统线程池' 
AND t.name IN ('Java', '后端')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- MySQL 索引优化文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = 'MySQL 索引优化实战：从慢查询到毫秒级响应' 
AND t.name IN ('MySQL', '后端')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- 微服务架构文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = '微服务架构避坑指南：从单体到分布式的演进之路' 
AND t.name IN ('微服务', 'Java', 'Spring Boot', 'Docker')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- 前端工程化文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = '2024 前端工程化最佳实践：从 Vite 到 Monorepo' 
AND t.name IN ('前端', 'React')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- 脚本执行完成提示
SELECT CONCAT('成功插入 ', COUNT(*), ' 篇新文章') AS result 
FROM tb_blog WHERE title IN (
    '从零构建 AI Agent：LangChain 实战指南',
    'React 19 性能优化完全指南',
    'Java 21 虚拟线程实战：告别传统线程池',
    'MySQL 索引优化实战：从慢查询到毫秒级响应',
    '程序员如何突破职业瓶颈：技术与管理双线发展',
    '微服务架构避坑指南：从单体到分布式的演进之路',
    '2024 前端工程化最佳实践：从 Vite 到 Monorepo'
);
