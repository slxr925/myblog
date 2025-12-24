package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.BrowseHistoryMapper;
import com.ryan.myblog.mapper.CategoryMapper;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.model.entity.BrowseHistory;
import com.ryan.myblog.model.vo.BrowseHistoryVO;
import com.ryan.myblog.service.BrowseHistoryService;
import com.ryan.myblog.service.RedisLikeService;
import com.ryan.myblog.service.CommentCountService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 浏览记录服务实现类
 */
@Slf4j
@Service
public class BrowseHistoryServiceImpl implements BrowseHistoryService {

    @Autowired
    private BrowseHistoryMapper browseHistoryMapper;

    @Autowired
    private BlogMapper blogMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private TagMapper tagMapper;

    @Autowired
    private RedisLikeService redisLikeService;

    @Autowired
    private CommentCountService commentCountService;

    @Override
    public void recordBrowse(Long userId, Long blogId) {
        try {
            // 使用 INSERT ... ON DUPLICATE KEY UPDATE 实现去重
            browseHistoryMapper.insertOrUpdate(userId, blogId);
            log.debug("记录浏览历史: userId={}, blogId={}", userId, blogId);
        } catch (Exception e) {
            log.error("记录浏览历史失败: userId={}, blogId={}", userId, blogId, e);
            // 不抛出异常，避免影响主流程
        }
    }

    @Override
    public List<BrowseHistoryVO> getUserBrowseHistory(Long userId, Integer days) {
        if (userId == null) {
            return new ArrayList<>();
        }

        // 默认查询3天
        if (days == null || days <= 0) {
            days = 3;
        }

        // 计算起始时间
        LocalDateTime startTime = LocalDateTime.now().minusDays(days);

        // 查询浏览记录
        LambdaQueryWrapper<BrowseHistory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BrowseHistory::getUserId, userId)
                .ge(BrowseHistory::getBrowseTime, startTime)
                .orderByDesc(BrowseHistory::getBrowseTime);

        List<BrowseHistory> histories = browseHistoryMapper.selectList(wrapper);

        if (histories.isEmpty()) {
            return new ArrayList<>();
        }

        // 提取文章ID列表
        List<Long> blogIds = histories.stream()
                .map(BrowseHistory::getBlogId)
                .collect(Collectors.toList());

        // 批量查询文章详情信息（包含分类、标签等）
        LambdaQueryWrapper<Blog> blogWrapper = new LambdaQueryWrapper<>();
        blogWrapper.in(Blog::getId, blogIds);
        List<Blog> blogs = blogMapper.selectList(blogWrapper);

        Map<Long, Blog> blogMap = blogs.stream()
                .collect(Collectors.toMap(Blog::getId, blog -> blog));

        // 批量查询点赞数和评论数
        Map<Long, Long> likeCountMap = redisLikeService.batchGetLikeCounts(blogIds);
        Map<Long, Long> commentCountMap = commentCountService.batchGetCommentCounts(blogIds);

        // 组装结果
        List<BrowseHistoryVO> result = new ArrayList<>();
        for (BrowseHistory history : histories) {
            Blog blog = blogMap.get(history.getBlogId());
            if (blog == null) {
                // 文章已被删除，跳过
                continue;
            }

            BrowseHistoryVO vo = new BrowseHistoryVO();
            vo.setId(history.getId());
            vo.setBlogId(blog.getId());
            vo.setTitle(blog.getTitle());
            vo.setSummary(blog.getSummary());
            vo.setCoverImg(blog.getCoverImg());
            vo.setBrowseTime(history.getBrowseTime());
            vo.setViewCount(blog.getViewCount());

            // 设置点赞数
            Long likeCount = likeCountMap.get(blog.getId());
            vo.setLikeCount(likeCount != null ? likeCount.intValue() : 0);

            // 设置评论数
            Long commentCount = commentCountMap.get(blog.getId());
            vo.setCommentCount(commentCount != null ? commentCount.intValue() : 0);

            // 查询分类名称
            if (blog.getCategoryId() != null) {
                Category category = categoryMapper.selectById(blog.getCategoryId());
                vo.setCategoryName(category != null ? category.getName() : null);
            }

            // 查询标签列表
            List<com.ryan.myblog.model.vo.TagVO> tags = tagMapper.selectTagsByBlogId(blog.getId());
            List<String> tagNames = tags.stream()
                    .map(com.ryan.myblog.model.vo.TagVO::getName)
                    .collect(Collectors.toList());
            vo.setTags(tagNames);

            result.add(vo);
        }

        return result;
    }

    @Override
    public int cleanExpiredHistory(Integer days) {
        if (days == null || days <= 0) {
            days = 3;
        }

        LocalDateTime expireTime = LocalDateTime.now().minusDays(days);

        LambdaQueryWrapper<BrowseHistory> wrapper = new LambdaQueryWrapper<>();
        wrapper.lt(BrowseHistory::getBrowseTime, expireTime);

        int count = browseHistoryMapper.delete(wrapper);
        log.info("清理过期浏览记录: 删除了 {} 条记录", count);

        return count;
    }
}
