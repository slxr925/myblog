-- 新增实用开发踩坑和工具体验文章
-- 执行前请备份数据库

-- 先添加一些新标签
INSERT INTO tb_tag (name, color, deleted, create_time, update_time) VALUES
('踩坑记录', '#ff4d4f', 0, NOW(), NOW()),
('工具推荐', '#52c41a', 0, NOW(), NOW()),
('效率提升', '#1890ff', 0, NOW(), NOW()),
('调试技巧', '#fa8c16', 0, NOW(), NOW()),
('配置问题', '#eb2f96', 0, NOW(), NOW());

-- 文章1: MyBatis踩坑
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('MyBatis 一对多查询的 LIMIT 陷阱：我是怎么被坑了一天的', 
'记录一次 MyBatis 使用 LEFT JOIN + collection 映射时遇到的 LIMIT 失效问题，以及最终的解决方案。',
'## 问题背景

上周在开发博客首页时，遇到了一个诡异的问题：明明请求 6 篇文章，接口却返回了 4 篇。

```java
// 期望返回 6 篇
List<BlogDetailVO> blogs = blogMapper.selectLatestBlogsWithTags(6);
// 实际只返回 4 篇
```

## 问题排查

### 第一反应：是不是缓存问题？

清空 Redis 缓存后，问题依旧。排除缓存。

### 第二反应：看看 SQL

打开 MyBatis 日志，发现执行的 SQL 是这样的：

```sql
SELECT DISTINCT b.*, t.id as tag_id, t.name as tag_name
FROM tb_blog b
LEFT JOIN tb_blog_tag bt ON b.id = bt.blog_id
LEFT JOIN tb_tag t ON bt.tag_id = t.id
WHERE b.deleted = 0 AND b.status = 1
ORDER BY b.publish_time DESC
LIMIT 6
```

SQL 看起来没问题啊？

### 真相大白

仔细看返回的行数：`Total: 15`。

原来一篇有 4 个标签的文章会产生 4 行数据！LIMIT 6 作用在 JOIN 后的结果上，所以：
- 第一篇文章（4个标签）= 4 行
- 第二篇文章（2个标签）= 2 行  
- 一共 6 行，但只有 2 篇文章

MyBatis 的 `collection` 映射会把相同 ID 的行合并成一个对象，所以最终只返回了部分文章。

## 解决方案

使用**子查询**，先限制文章数量，再 JOIN 标签：

```sql
SELECT b.*, t.id as tag_id, t.name as tag_name
FROM (
    SELECT blog.* 
    FROM tb_blog blog
    WHERE blog.deleted = 0 AND blog.status = 1
    ORDER BY blog.publish_time DESC
    LIMIT 6  -- 在子查询中先限制文章数量
) b
LEFT JOIN tb_blog_tag bt ON b.id = bt.blog_id
LEFT JOIN tb_tag t ON bt.tag_id = t.id
ORDER BY b.publish_time DESC
```

## 经验总结

1. **LIMIT + JOIN + collection 是个坑**：LIMIT 作用于 JOIN 后的行数，不是最终对象数
2. **子查询救命**：先在子查询中筛选主表，再关联从表
3. **开启 MyBatis 日志**：生产环境关掉，开发环境一定要开，能省很多排查时间

希望这篇踩坑记录能帮到遇到同样问题的你！', 
1, 4, 1, 1, 0, 342, 28, 5, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NOW(), 0);

-- 文章2: Docker 网络踩坑
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('Docker 容器访问宿主机服务的三种方式（附踩坑记录）', 
'容器内访问宿主机的 MySQL、Redis 总是连不上？这篇文章帮你彻底搞懂 Docker 网络。',
'## 场景

部署博客系统时，MySQL 和 Redis 装在宿主机上，Spring Boot 应用跑在 Docker 容器里。

配置文件写的是 `localhost:3306`，结果容器启动就报错：

```
Connection refused: localhost:3306
```

## 为什么 localhost 不行？

容器有自己独立的网络命名空间，容器里的 `localhost` 指向的是容器自己，不是宿主机。

## 三种解决方案

### 方案一：使用 host.docker.internal（推荐）

Docker Desktop（Mac/Windows）自带这个特殊域名：

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://host.docker.internal:3306/myblog
```

Linux 下需要手动添加：

```yaml
# docker-compose.yml
services:
  backend:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### 方案二：使用宿主机 IP

获取 Docker 网桥的网关 IP（通常是 `172.17.0.1`）：

```bash
docker network inspect bridge | grep Gateway
# "Gateway": "172.17.0.1"
```

```yaml
spring:
  datasource:
    url: jdbc:mysql://172.17.0.1:3306/myblog
```

### 方案三：使用 host 网络模式

最简单粗暴，容器直接共享宿主机网络：

```yaml
services:
  backend:
    network_mode: host
```

缺点：失去网络隔离，端口冲突风险。

## 踩坑记录

### 坑1：MySQL 绑定了 127.0.0.1

即使用了正确的 IP，还是连不上？检查 MySQL 配置：

```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
bind-address = 0.0.0.0  # 不要用 127.0.0.1
```

### 坑2：防火墙拦截

```bash
# 检查端口是否开放
sudo ufw allow 3306
```

### 坑3：Redis 保护模式

```conf
# redis.conf
protected-mode no
bind 0.0.0.0
```

## 我的最终配置

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      MYSQL_HOST: 172.17.0.1
      MYSQL_PORT: 13306
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

这个问题卡了我半天，希望能帮到你少走弯路！', 
1, 2, 1, 1, 0, 567, 45, 12, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NOW(), 0);

-- 文章3: IDEA 效率插件
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('2024 年我离不开的 10 个 IDEA 插件（附配置技巧）', 
'用了 5 年 IDEA，这些插件真的能大幅提升开发效率。不是广告，纯个人体验分享。',
'## 为什么写这篇

用 IDEA 五年了，插件装了一堆，但真正每天都用的其实就这几个。今天整理分享一下。

## 必装插件

### 1. GitHub Copilot ⭐⭐⭐⭐⭐

现在写代码真的离不开它了。不只是自动补全，它能理解上下文：

- 写注释，它帮你生成代码
- 写方法名，它猜你要干什么
- 写测试，它知道你要测哪个方法

**Tips**: 按 `Tab` 接受建议，`Alt+]` 看下一个建议。

### 2. Key Promoter X ⭐⭐⭐⭐⭐

每次用鼠标点菜单，它会弹窗告诉你快捷键。用了一个月，快捷键全记住了。

### 3. Rainbow Brackets ⭐⭐⭐⭐

括号配对用不同颜色，嵌套多的时候特别有用。

```java
if (a && (b || (c && d))) {  // 每层括号不同颜色
    // ...
}
```

### 4. MyBatisX ⭐⭐⭐⭐⭐

做 Java 后端必装：
- Mapper 接口和 XML 一键跳转
- 自动生成 CRUD 代码
- SQL 语法检查

### 5. GitToolBox ⭐⭐⭐⭐

在编辑器里直接看每行代码的 Git Blame，谁写的一目了然（主要用来甩锅）。

## 效率插件

### 6. String Manipulation

字符串各种转换：驼峰、下划线、大小写、排序、去重...

快捷键 `Alt+M` 打开菜单。

### 7. GenerateAllSetter

`new` 一个对象后，`Alt+Enter` 一键生成所有 setter 调用。写单元测试救命。

### 8. .ignore

管理 `.gitignore` 文件，提供各种模板。

## 外观插件

### 9. One Dark Theme

暗色主题，护眼。配合 JetBrains Mono 字体使用。

### 10. Atom Material Icons

文件图标美化，不同文件类型一眼区分。

## 我的配置技巧

### 关闭不用的插件

`Settings > Plugins > Installed`，禁用不常用的，启动速度快很多。

### 增加内存

```
# idea64.vmoptions
-Xms1024m
-Xmx4096m
```

### 自动导入优化

```
Settings > Editor > General > Auto Import
- Add unambiguous imports on the fly ✓
- Optimize imports on the fly ✓
```

这些插件帮我每天至少省 30 分钟，希望对你也有帮助！', 
1, 1, 1, 1, 0, 892, 76, 23, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW(), NOW(), 0);

-- 文章4: 前端调试技巧
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('Chrome DevTools 调试技巧：这些功能你可能从没用过', 
'用了多年 Chrome 开发者工具，最近才发现这些隐藏功能。整理分享，建议收藏。',
'## 前言

Chrome DevTools 打开方式人人都会（F12），但很多强大功能藏得很深。

## Console 进阶

### 1. console.table()

展示数组/对象，比 `console.log` 清晰 100 倍：

```javascript
const users = [
  { name: "张三", age: 25 },
  { name: "李四", age: 30 }
];
console.table(users);
```

### 2. console.time() / console.timeEnd()

精确测量代码执行时间：

```javascript
console.time("fetch");
await fetch("/api/data");
console.timeEnd("fetch"); // fetch: 234.56ms
```

### 3. $0 快速引用

在 Elements 面板选中元素后，Console 里输入 `$0` 就能引用它：

```javascript
$0.style.border = "2px solid red"; // 给选中元素加红框
```

## Network 面板

### 4. 按住 Shift 查看依赖

按住 Shift 悬停在请求上，绿色是依赖它的请求，红色是它依赖的请求。

### 5. 模拟弱网环境

`Network > Throttling` 下拉菜单，选择 Slow 3G 测试弱网表现。

### 6. 复制为 cURL

右键请求 > Copy > Copy as cURL，直接在终端重放请求。

## Sources 面板

### 7. 条件断点

右键行号 > Add conditional breakpoint：

```javascript
// 只在 userId === 123 时断住
userId === 123
```

### 8. 日志断点（Logpoint）

不想打 console.log 又想看变量值？右键 > Add logpoint：

```
用户ID: {userId}, 状态: {status}
```

## Elements 面板

### 9. 强制元素状态

右键元素 > Force state，可以让元素保持 `:hover`、`:focus` 等状态，调试样式超方便。

### 10. 截图

`Cmd+Shift+P` 打开命令面板，输入 `screenshot`：
- Capture full size screenshot：整个页面
- Capture node screenshot：选中的元素

## 我的调试流程

1. **打开 Network 面板**，勾选 Preserve log
2. **复现问题**，观察请求
3. **看 Console 报错**
4. **打断点调试**

这些技巧帮我 debug 效率翻倍，你有什么独门技巧？评论区分享一下！', 
1, 1, 1, 1, 0, 734, 58, 15, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW(), NOW(), 0);

-- 文章5: Git 踩坑
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('Git 操作失误怎么办？这几个命令救过我无数次', 
'手滑 commit 了敏感信息？force push 覆盖了同事代码？别慌，还有救。',
'## 场景一：commit 了不该 commit 的文件

把 `.env` 里的密码 commit 了？

### 救命命令

```bash
# 还没 push 的话
git reset HEAD~1  # 撤销最后一次 commit，保留修改
git reset --soft HEAD~1  # 同上

# 已经 push 了
git revert HEAD  # 创建一个新 commit 来撤销
```

### 完全删除历史中的敏感文件

```bash
# 用 git-filter-repo（推荐）
pip install git-filter-repo
git filter-repo --path .env --invert-paths

# 或者 BFG
bfg --delete-files .env
git push --force
```

## 场景二：改错分支了

在 main 上改了代码才发现应该在 feature 分支...

```bash
# 1. 暂存当前修改
git stash

# 2. 切换到正确分支
git checkout feature

# 3. 恢复修改
git stash pop
```

## 场景三：commit message 写错了

```bash
# 修改最后一次 commit message
git commit --amend -m "新的提交信息"

# 已经 push 了就要 force push
git push --force-with-lease
```

## 场景四：找回删除的分支

删了分支才发现还有用？

```bash
# 查看所有操作历史
git reflog

# 找到删除前的 commit hash，恢复分支
git checkout -b 分支名 abc1234
```

## 场景五：合并冲突太多想放弃

```bash
# 放弃 merge
git merge --abort

# 放弃 rebase
git rebase --abort
```

## 场景六：想看某个文件的历史版本

```bash
# 查看文件的历史
git log --oneline -- path/to/file

# 恢复到某个版本
git checkout abc1234 -- path/to/file
```

## 保命配置

```bash
# 防止误 push 到 main
git config --global branch.main.pushRemote no_push

# force push 前先检查远程有没有其他人的提交
git config --global push.default current
git push --force-with-lease  # 用这个代替 --force
```

## 总结

| 场景 | 命令 |
|------|------|
| 撤销 commit（未 push） | `git reset HEAD~1` |
| 撤销 commit（已 push） | `git revert HEAD` |
| 修改 commit message | `git commit --amend` |
| 找回删除的分支 | `git reflog` |
| 放弃 merge | `git merge --abort` |

这些命令记不住没关系，收藏这篇文章就行！', 
1, 4, 1, 1, 0, 456, 39, 8, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NOW(), 0);

-- 文章6: Spring Boot 配置踩坑
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('Spring Boot 配置加载顺序踩坑：为什么我的配置不生效？', 
'application.yml 改了配置不生效？环境变量覆盖了配置文件？这篇帮你彻底搞懂配置优先级。',
'## 问题

在 `application.yml` 里配置了数据库地址，但启动后总是连接到错误的地址。

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myblog
```

结果连接的是 `172.17.0.1:3306`，百思不得其解。

## 真相

Spring Boot 配置有**优先级**，高优先级会覆盖低优先级。

## 配置加载顺序（从高到低）

1. **命令行参数**：`--spring.datasource.url=xxx`
2. **SPRING_APPLICATION_JSON**：环境变量中的 JSON
3. **JVM 系统属性**：`-Dspring.datasource.url=xxx`
4. **环境变量**：`SPRING_DATASOURCE_URL=xxx`
5. **application-{profile}.yml**：如 `application-prod.yml`
6. **application.yml**

我的问题是 `docker-compose.yml` 里设置了环境变量：

```yaml
environment:
  MYSQL_HOST: 172.17.0.1
```

而我的配置用了占位符：

```yaml
spring:
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:localhost}:3306/myblog
```

环境变量优先级高于 yml 默认值，所以 `172.17.0.1` 覆盖了 `localhost`。

## 环境变量命名规则

Spring Boot 会自动转换环境变量名：

| 配置 | 环境变量 |
|------|---------|
| `spring.datasource.url` | `SPRING_DATASOURCE_URL` |
| `server.port` | `SERVER_PORT` |
| `my-app.feature.enabled` | `MY_APP_FEATURE_ENABLED` |

规则：小写改大写，`.` 和 `-` 改 `_`

## 调试技巧

### 查看所有生效的配置

```yaml
management:
  endpoints:
    web:
      exposure:
        include: env,configprops
```

访问 `/actuator/env` 查看配置来源。

### 打印配置值

```java
@Value("${spring.datasource.url}")
private String datasourceUrl;

@PostConstruct
public void printConfig() {
    log.info("数据库地址: {}", datasourceUrl);
}
```

## 最佳实践

### 1. 多环境配置

```
application.yml           # 公共配置
application-dev.yml       # 开发环境
application-prod.yml      # 生产环境
```

激活方式：`--spring.profiles.active=prod`

### 2. 敏感信息用环境变量

```yaml
spring:
  datasource:
    password: ${MYSQL_PASSWORD}  # 不要写死在配置文件里
```

### 3. 配置分组

```yaml
# 用 --- 分隔多个配置
spring:
  config:
    activate:
      on-profile: dev
server:
  port: 8080
---
spring:
  config:
    activate:
      on-profile: prod
server:
  port: 80
```

希望这篇能帮你避开 Spring Boot 配置的坑！', 
1, 1, 1, 1, 0, 623, 52, 11, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NOW(), 0);

-- 获取新增标签的ID
SET @tag_pit = (SELECT id FROM tb_tag WHERE name = '踩坑记录' LIMIT 1);
SET @tag_tool = (SELECT id FROM tb_tag WHERE name = '工具推荐' LIMIT 1);
SET @tag_eff = (SELECT id FROM tb_tag WHERE name = '效率提升' LIMIT 1);
SET @tag_debug = (SELECT id FROM tb_tag WHERE name = '调试技巧' LIMIT 1);
SET @tag_config = (SELECT id FROM tb_tag WHERE name = '配置问题' LIMIT 1);

-- 获取新文章的ID
SET @blog1 = (SELECT id FROM tb_blog WHERE title LIKE '%MyBatis%LIMIT%' LIMIT 1);
SET @blog2 = (SELECT id FROM tb_blog WHERE title LIKE '%Docker%容器访问宿主机%' LIMIT 1);
SET @blog3 = (SELECT id FROM tb_blog WHERE title LIKE '%IDEA 插件%' LIMIT 1);
SET @blog4 = (SELECT id FROM tb_blog WHERE title LIKE '%Chrome DevTools%' LIMIT 1);
SET @blog5 = (SELECT id FROM tb_blog WHERE title LIKE '%Git 操作失误%' LIMIT 1);
SET @blog6 = (SELECT id FROM tb_blog WHERE title LIKE '%Spring Boot 配置加载%' LIMIT 1);

-- 关联标签
INSERT INTO tb_blog_tag (blog_id, tag_id) VALUES
(@blog1, 3),     -- MySQL
(@blog1, @tag_pit),
(@blog1, 12),    -- 后端

(@blog2, 8),     -- Docker
(@blog2, @tag_pit),
(@blog2, @tag_config),

(@blog3, @tag_tool),
(@blog3, @tag_eff),
(@blog3, 1),     -- Java

(@blog4, 11),    -- 前端
(@blog4, @tag_debug),
(@blog4, @tag_eff),

(@blog5, @tag_pit),
(@blog5, @tag_debug),

(@blog6, 2),     -- Spring Boot
(@blog6, @tag_pit),
(@blog6, @tag_config);

SELECT '文章插入完成！' as status;
