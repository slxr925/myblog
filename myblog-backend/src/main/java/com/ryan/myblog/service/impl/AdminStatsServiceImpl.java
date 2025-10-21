package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.model.dto.AdminStatsDTO;
import com.ryan.myblog.model.dto.DailyStatsDTO;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.Comment;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.entity.UserLike;
import com.ryan.myblog.model.entity.VisitLog;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.CommentMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.mapper.UserLikeMapper;
import com.ryan.myblog.mapper.VisitLogMapper;
import com.ryan.myblog.service.AdminStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 管理员统计服务实现类
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AdminStatsServiceImpl implements AdminStatsService {

    private final UserMapper userMapper;
    private final BlogMapper blogMapper;
    private final CommentMapper commentMapper;
    private final UserLikeMapper userLikeMapper;
    private final VisitLogMapper visitLogMapper;

    @Override
    public AdminStatsDTO getAdminStats() {
        AdminStatsDTO stats = new AdminStatsDTO();

        try {
            // 获取总用户数
            LambdaQueryWrapper<User> userQuery = new LambdaQueryWrapper<>();
            Long totalUsers = userMapper.selectCount(userQuery);
            stats.setTotalUsers(totalUsers != null ? totalUsers : 0L);

            // 获取总文章数
            LambdaQueryWrapper<Blog> blogQuery = new LambdaQueryWrapper<>();
            Long totalBlogs = blogMapper.selectCount(blogQuery);
            stats.setTotalBlogs(totalBlogs != null ? totalBlogs : 0L);

            // 获取总评论数
            LambdaQueryWrapper<Comment> commentQuery = new LambdaQueryWrapper<>();
            Long totalComments = commentMapper.selectCount(commentQuery);
            stats.setTotalComments(totalComments != null ? totalComments : 0L);

            // 获取总点赞数
            LambdaQueryWrapper<UserLike> likeQuery = new LambdaQueryWrapper<>();
            likeQuery.eq(UserLike::getStatus, 1); // 只统计有效点赞
            Long totalLikes = userLikeMapper.selectCount(likeQuery);
            stats.setTotalLikes(totalLikes != null ? totalLikes : 0L);

            // 获取今日开始时间
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

            // 获取今日新增用户数
            LambdaQueryWrapper<User> todayUserQuery = new LambdaQueryWrapper<>();
            todayUserQuery.between(User::getCreateTime, todayStart, todayEnd);
            Long todayNewUsers = userMapper.selectCount(todayUserQuery);
            stats.setTodayNewUsers(todayNewUsers != null ? todayNewUsers : 0L);

            // 获取今日新增文章数
            LambdaQueryWrapper<Blog> todayBlogQuery = new LambdaQueryWrapper<>();
            todayBlogQuery.between(Blog::getCreateTime, todayStart, todayEnd);
            Long todayNewBlogs = blogMapper.selectCount(todayBlogQuery);
            stats.setTodayNewBlogs(todayNewBlogs != null ? todayNewBlogs : 0L);

            // 获取今日新增评论数
            LambdaQueryWrapper<Comment> todayCommentQuery = new LambdaQueryWrapper<>();
            todayCommentQuery.between(Comment::getCreateTime, todayStart, todayEnd);
            Long todayNewComments = commentMapper.selectCount(todayCommentQuery);
            stats.setTodayNewComments(todayNewComments != null ? todayNewComments : 0L);

            // 计算今日访问量 - 使用访问日志表统计真实访问量
            LambdaQueryWrapper<VisitLog> todayVisitQuery = new LambdaQueryWrapper<>();
            todayVisitQuery.between(VisitLog::getVisitTime, todayStart, todayEnd);
            Long todayViews = visitLogMapper.selectCount(todayVisitQuery);
            stats.setTodayViews(todayViews != null ? todayViews : 0L);

            // 获取时间段统计数据
            stats.setWeeklyStats(getWeeklyStats());
            stats.setMonthlyStats(getMonthlyStats());

            log.info("获取管理员统计数据成功: {}", stats);

        } catch (Exception e) {
            log.error("获取管理员统计数据失败", e);
            // 返回默认值
            stats.setTotalUsers(0L);
            stats.setTotalBlogs(0L);
            stats.setTotalComments(0L);
            stats.setTotalLikes(0L);
            stats.setTodayViews(0L);
            stats.setTodayNewUsers(0L);
            stats.setTodayNewBlogs(0L);
            stats.setTodayNewComments(0L);
            stats.setWeeklyStats(new ArrayList<>());
            stats.setMonthlyStats(new ArrayList<>());
        }

        return stats;
    }

    @Override
    public List<DailyStatsDTO> getDailyStats(LocalDate startDate, LocalDate endDate) {
        List<DailyStatsDTO> dailyStatsList = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        try {
            LocalDate currentDate = startDate;
            while (!currentDate.isAfter(endDate)) {
                DailyStatsDTO dailyStats = new DailyStatsDTO();
                dailyStats.setDate(currentDate.format(formatter));

                LocalDateTime dayStart = currentDate.atStartOfDay();
                LocalDateTime dayEnd = LocalDateTime.of(currentDate, LocalTime.MAX);

                // 统计当日新增用户数
                LambdaQueryWrapper<User> userQuery = new LambdaQueryWrapper<>();
                userQuery.between(User::getCreateTime, dayStart, dayEnd);
                Long newUsers = userMapper.selectCount(userQuery);
                dailyStats.setNewUsers(newUsers != null ? newUsers : 0L);

                // 统计当日新增文章数
                LambdaQueryWrapper<Blog> blogQuery = new LambdaQueryWrapper<>();
                blogQuery.between(Blog::getCreateTime, dayStart, dayEnd);
                Long newBlogs = blogMapper.selectCount(blogQuery);
                dailyStats.setNewBlogs(newBlogs != null ? newBlogs : 0L);

                // 统计当日新增评论数
                LambdaQueryWrapper<Comment> commentQuery = new LambdaQueryWrapper<>();
                commentQuery.between(Comment::getCreateTime, dayStart, dayEnd);
                Long newComments = commentMapper.selectCount(commentQuery);
                dailyStats.setNewComments(newComments != null ? newComments : 0L);

                // 访问量暂时使用模拟数据
                dailyStats.setTotalViews(0L);

                dailyStatsList.add(dailyStats);
                currentDate = currentDate.plusDays(1);
            }

            log.info("获取每日统计数据成功，时间范围：{} 到 {}，共 {} 天",
                    startDate, endDate, dailyStatsList.size());

        } catch (Exception e) {
            log.error("获取每日统计数据失败，时间范围：{} 到 {}", startDate, endDate, e);
        }

        return dailyStatsList;
    }

    @Override
    public List<DailyStatsDTO> getWeeklyStats() {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(6); // 最近7天
        return getDailyStats(startDate, endDate);
    }

    @Override
    public List<DailyStatsDTO> getMonthlyStats() {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(29); // 最近30天
        return getDailyStats(startDate, endDate);
    }
}