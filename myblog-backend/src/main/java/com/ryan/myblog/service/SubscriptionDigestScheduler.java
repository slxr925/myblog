package com.ryan.myblog.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.event.NotificationEvent;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.UserFollowMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.entity.UserFollow;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 订阅周报任务
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionDigestScheduler {

    private final UserFollowMapper userFollowMapper;
    private final UserMapper userMapper;
    private final BlogMapper blogMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Scheduled(cron = "0 0 9 ? * MON", zone = "Asia/Shanghai")
    public void sendWeeklyDigest() {
        List<UserFollow> follows = userFollowMapper.selectList(new LambdaQueryWrapper<UserFollow>()
                .eq(UserFollow::getDeleted, 0));

        if (follows.isEmpty()) {
            return;
        }

        Map<Long, List<Long>> followeesByFollower = follows.stream()
                .collect(Collectors.groupingBy(
                        UserFollow::getFollowerId,
                        Collectors.mapping(UserFollow::getFolloweeId, Collectors.collectingAndThen(Collectors.toList(),
                                list -> list.stream().distinct().toList()))));

        Set<Long> followeeIds = follows.stream()
                .map(UserFollow::getFolloweeId)
                .collect(Collectors.toSet());

        LocalDateTime since = LocalDateTime.now().minusDays(7);
        List<Blog> recentBlogs = blogMapper.selectList(new LambdaQueryWrapper<Blog>()
                .in(Blog::getAuthorId, followeeIds)
                .eq(Blog::getStatus, 1)
                .eq(Blog::getDeleted, 0)
                .ge(Blog::getPublishTime, since)
                .orderByDesc(Blog::getPublishTime));

        if (recentBlogs.isEmpty()) {
            log.debug("周报摘要跳过，本周没有新文章");
            return;
        }

        Map<Long, String> authorNames = userMapper.selectBatchIds(followeeIds).stream()
                .collect(Collectors.toMap(
                        User::getId,
                        user -> StringUtils.defaultIfBlank(user.getNickname(), user.getUsername()),
                        (left, right) -> left));

        Map<Long, List<Blog>> blogsByAuthor = recentBlogs.stream()
                .collect(Collectors.groupingBy(Blog::getAuthorId));

        for (Map.Entry<Long, List<Long>> entry : followeesByFollower.entrySet()) {
            Long followerId = entry.getKey();
            List<Blog> digestBlogs = entry.getValue().stream()
                    .flatMap(authorId -> blogsByAuthor.getOrDefault(authorId, List.of()).stream())
                    .sorted(Comparator.comparing(Blog::getPublishTime, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();

            if (digestBlogs.isEmpty()) {
                continue;
            }

            int total = digestBlogs.size();
            String preview = digestBlogs.stream()
                    .limit(3)
                    .map(Blog::getTitle)
                    .collect(Collectors.joining(" / "));

            Map<String, Object> extraData = new HashMap<>();
            extraData.put("count", total);
            extraData.put("range", "7d");
            extraData.put("articles", digestBlogs.stream()
                    .limit(5)
                    .map(blog -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("blogId", blog.getId());
                        item.put("title", blog.getTitle());
                        item.put("authorId", blog.getAuthorId());
                        item.put("authorName", authorNames.getOrDefault(blog.getAuthorId(), "未知作者"));
                        item.put("publishTime", blog.getPublishTime());
                        return item;
                    })
                    .toList());

            String content = String.format("过去 7 天，你关注的作者发布了 %d 篇新文章。%s", total, preview);
            eventPublisher.publishEvent(NotificationEvent.weeklyDigestEvent(this, followerId, content, extraData));
        }

        log.info("周报摘要任务完成: followers={}, recentBlogs={}", followeesByFollower.size(), recentBlogs.size());
    }
}
