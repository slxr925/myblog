package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.model.dto.BlogSaveDTO;
import com.ryan.myblog.model.dto.LikeResultDTO;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.BlogTag;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.entity.UserLike;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.model.entity.Tag;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.BlogTagMapper;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.mapper.UserLikeMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.mapper.CategoryMapper;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.CacheService;
import com.ryan.myblog.service.CacheConsistencyService;
import com.ryan.myblog.service.SearchService;
import com.ryan.myblog.service.TagService;
import com.ryan.myblog.converter.BlogDocumentConverter;
import com.ryan.myblog.utils.SecurityUtils;
import com.ryan.myblog.model.vo.BlogDetailVO;
import com.ryan.myblog.model.vo.BlogListVO;
import com.ryan.myblog.model.vo.TagVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.concurrent.CompletableFuture;

/**
 * 博客服务实现类（简化版）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BlogServiceImpl implements BlogService {
    
    private final BlogMapper blogMapper;
    private final BlogTagMapper blogTagMapper;
    private final TagMapper tagMapper;
    private final UserLikeMapper userLikeMapper;
    private final UserMapper userMapper;
    private final CategoryMapper categoryMapper;
    private final CacheService cacheService;
    private final CacheConsistencyService cacheConsistencyService;
    private final SearchService searchService;
    private final TagService tagService;
    private final BlogDocumentConverter blogDocumentConverter;
    private final SecurityUtils securityUtils;
    private final RedisTemplate<String, Object> redisTemplate;
    
    @Override
    @Transactional
    public BlogDetailVO saveBlog(BlogSaveDTO blogSaveDTO, Long authorId) {
        validateBlogCategory(blogSaveDTO);

        // 创建博客实体
        Blog blog = new Blog();
        blog.setTitle(blogSaveDTO.getTitle());
        blog.setSummary(blogSaveDTO.getSummary());
        blog.setContent(blogSaveDTO.getContent());
        blog.setCoverImg(blogSaveDTO.getCoverImg());
        blog.setAuthorId(authorId);
        blog.setCategoryId(blogSaveDTO.getCategoryId());
        blog.setStatus(blogSaveDTO.getStatus());
        Integer visibility = blogSaveDTO.getVisibility() != null ? blogSaveDTO.getVisibility() : 1;
        blog.setVisibility(visibility);
        blog.setIsTop(blogSaveDTO.getIsTop());
        blog.setViewCount(0);
        blog.setLikeCount(0);
        blog.setCommentCount(0);
        blog.setStatusChangedTime(LocalDateTime.now());
        
        if (blogSaveDTO.getStatus() == 1) { // 已发布
            blog.setPublishTime(LocalDateTime.now());
        }
        
        // 保存博客
        blogMapper.insert(blog);
        
        // 保存标签关联
        List<Long> tagIds = resolveTagIds(blogSaveDTO);
        saveBlogTags(blog.getId(), tagIds);
        
        // 清除相关缓存
        clearBlogCaches();

        // 同步到Elasticsearch（仅已发布的博客）
        if (blog.getStatus() == 1 && searchService.isAvailable()) {
            try {
                syncBlogToElasticsearch(blog);
            } catch (Exception e) {
                log.error("同步博客到Elasticsearch失败: {}", blog.getId(), e);
            }
        }

        BlogDetailVO detail = blogMapper.selectBlogDetail(blog.getId());
        if (detail != null) {
            detail.setTags(tagMapper.selectTagsByBlogId(blog.getId()));
        }
        return detail;
    }
    
    @Override
    @Transactional
    public BlogDetailVO updateBlog(Long id, BlogSaveDTO blogSaveDTO, Long authorId) {
        validateBlogCategory(blogSaveDTO);

        // 检查博客是否存在且属于当前用户
        Blog existBlog = blogMapper.selectById(id);
        if (existBlog == null) {
            throw new RuntimeException("博客不存在");
        }
        if (!existBlog.getAuthorId().equals(authorId)) {
            throw new RuntimeException("无权限修改此博客");
        }
        
        Integer previousStatus = existBlog.getStatus();

        // 更新博客信息
        existBlog.setTitle(blogSaveDTO.getTitle());
        existBlog.setSummary(blogSaveDTO.getSummary());
        existBlog.setContent(blogSaveDTO.getContent());
        existBlog.setCoverImg(blogSaveDTO.getCoverImg());
        existBlog.setCategoryId(blogSaveDTO.getCategoryId());
        existBlog.setStatus(blogSaveDTO.getStatus());
        Integer visibility = blogSaveDTO.getVisibility() != null ? blogSaveDTO.getVisibility() : existBlog.getVisibility();
        existBlog.setVisibility(visibility != null ? visibility : 1);
        existBlog.setIsTop(blogSaveDTO.getIsTop());
        
        if (!Objects.equals(previousStatus, blogSaveDTO.getStatus())) {
            existBlog.setStatusChangedTime(LocalDateTime.now());
        }

        if (blogSaveDTO.getStatus() == 1 && existBlog.getPublishTime() == null) {
            existBlog.setPublishTime(LocalDateTime.now());
        }
        
        blogMapper.updateById(existBlog);
        
        // 更新标签关联
        blogTagMapper.deleteByBlogId(id);
        List<Long> tagIds = resolveTagIds(blogSaveDTO);
        saveBlogTags(id, tagIds);
        
        // 清除缓存
        clearBlogCache(id);
        clearBlogCaches();

        // 更新缓存版本
        cacheConsistencyService.updateCacheVersion("blog:*");

        // 同步到Elasticsearch（仅已发布的博客）
        if (existBlog.getStatus() == 1 && searchService.isAvailable()) {
            try {
                syncBlogToElasticsearch(existBlog);
            } catch (Exception e) {
                log.error("同步博客更新到Elasticsearch失败: {}", existBlog.getId(), e);
            }
        } else if (existBlog.getStatus() != 1) {
            // 如果博客不再是已发布状态，从ES删除 - 不阻塞主流程
            try {
            deleteBlogFromElasticsearch(existBlog.getId());
            } catch (Exception e) {
                log.error("从ES删除博客索引失败(不影响主流程): {}", existBlog.getId(), e);
            }
        }

        BlogDetailVO detail = blogMapper.selectBlogDetail(id);
        if (detail != null) {
            detail.setTags(tagMapper.selectTagsByBlogId(id));
        }
        return detail;
    }

    @Override
    @Transactional
    public void deleteBlog(Long id, Long operatorId) {
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }

        // 权限检查：管理员可以删除任意博客，普通用户只能删除自己的博客
        boolean hasPermission = checkBlogPermission(blog.getAuthorId(), operatorId);
        if (!hasPermission) {
            log.warn("用户 {} 尝试删除博客 {} 失败，权限不足", operatorId, id);
            throw new RuntimeException("无权限删除此博客");
        }

        // 记录删除操作
        log.info("用户 {} 删除博客 {} (作者: {}, 标题: {})",
                 operatorId, id, blog.getAuthorId(), blog.getTitle());

        blogMapper.deleteById(id);
        blogTagMapper.deleteByBlogId(id);

        // 清除缓存
        clearBlogCache(id);
        clearBlogCaches();

        // 发布缓存失效通知
        cacheConsistencyService.publishCacheInvalidation("blog:*", "博客删除");

        // 从ES删除索引 - 不阻塞主流程
        try {
        deleteBlogFromElasticsearch(id);
        } catch (Exception e) {
            log.error("从ES删除博客索引失败(不影响主流程): {}", id, e);
        }
    }
    
    @Override
    public IPage<BlogDetailVO> getBlogPage(PageRequest pageRequest, Long categoryId,
                                          Long tagId, String keyword, Integer status) {
        Page<BlogDetailVO> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());

        // 使用新的查询方法，已经包含标签信息，无需额外查询
        IPage<BlogDetailVO> result = blogMapper.selectBlogPage(page, categoryId, tagId, keyword, status);

        return result;
    }
    
    @Override
    public BlogDetailVO getBlogDetail(Long id) {
        return getBlogDetail(id, null);
    }

    @Override
    public BlogDetailVO getBlogDetail(Long id, Long userId) {
        // 先从缓存中获取
        String cacheKey = "blog:detail:" + id;
        BlogDetailVO blog = cacheService.get(cacheKey, BlogDetailVO.class);

        if (blog == null) {
            // 缓存中没有，从数据库查询
            blog = blogMapper.selectBlogDetail(id);
            if (blog == null) {
                throw new RuntimeException("博客不存在");
            }

            // 设置标签信息
            blog.setTags(tagMapper.selectTagsByBlogId(id));

            // 存入缓存，设置30分钟过期
            cacheService.set(cacheKey, blog, 1800);
        }

        // 查询用户点赞状态
        if (userId != null) {
            UserLike userLike = userLikeMapper.selectByUserAndTarget(userId, "blog", id);
            blog.setIsLiked(userLike != null && userLike.getStatus() == 1);
        } else {
            blog.setIsLiked(false);
        }

        return blog;
    }
    
    @Override
    public void incrementViewCount(Long id) {
        // 使用Redis进行浏览量去重，防止同一用户短时间内重复计数
        String viewKey = "blog:view:" + id;
        String today = LocalDateTime.now().toLocalDate().toString();

        try {
            // 尝试设置今日访问标记，30分钟过期
            Boolean isNewView = redisTemplate.opsForValue().setIfAbsent(
                viewKey + ":" + today, "1", 30, TimeUnit.MINUTES
            );

            if (Boolean.TRUE.equals(isNewView)) {
                // 只有新的访问才增加浏览量
                blogMapper.incrementViewCount(id);
                log.debug("博客 {} 浏览量 +1 (新访问)", id);
            } else {
                log.debug("博客 {} 浏览量未增加 (重复访问)", id);
            }
        } catch (Exception e) {
            // 如果Redis出现异常，降级到直接增加浏览量
            log.warn("Redis浏览量去重失败，降级处理: {}", e.getMessage());
            blogMapper.incrementViewCount(id);
        }
    }
    
    @Override
    @Transactional
    public Boolean toggleLike(Long id, Long userId) {
        // 检查博客是否存在
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }

        // 查找用户点赞记录
        UserLike existingLike = userLikeMapper.selectByUserAndTarget(userId, "blog", id);

        if (existingLike == null) {
            // 首次点赞，创建点赞记录
            UserLike newLike = new UserLike();
            newLike.setUserId(userId);
            newLike.setTargetType("blog");
            newLike.setTargetId(id);
            newLike.setStatus(1);
            newLike.setCreateTime(java.time.LocalDateTime.now());
            newLike.setUpdateTime(java.time.LocalDateTime.now());

            userLikeMapper.insert(newLike);

            // 增加博客点赞数
            blogMapper.incrementLikeCount(id);

            log.info("用户 {} 首次点赞博客 {}", userId, id);
        } else {
            // 切换点赞状态
            Integer oldStatus = existingLike.getStatus();
            Integer newStatus = oldStatus == 1 ? 0 : 1;
            existingLike.setStatus(newStatus);
            existingLike.setUpdateTime(java.time.LocalDateTime.now());

            userLikeMapper.updateById(existingLike);

            // 更新博客点赞数
            if (oldStatus == 1) {
                // 之前是点赞，现在取消点赞
                blogMapper.decrementLikeCount(id);
                log.info("用户 {} 取消点赞博客 {}", userId, id);
            } else {
                // 之前是取消点赞，现在重新点赞
                blogMapper.incrementLikeCount(id);
                log.info("用户 {} 重新点赞博客 {}", userId, id);
            }
        }

        // 清除相关缓存
        cacheService.delete("blog:detail:" + id);
        cacheService.deleteByPattern("blog:page:*");

        // 返回操作后的点赞状态
        if (existingLike == null) {
            // 首次点赞，状态为true
            return true;
        } else {
            // 切换状态，返回新状态
            return existingLike.getStatus() == 1;
        }
    }

    @Override
    @Transactional
    public LikeResultDTO toggleLikeWithDetails(Long id, Long userId) {
        // 检查博客是否存在
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }

        // 查找用户点赞记录
        UserLike existingLike = userLikeMapper.selectByUserAndTarget(userId, "blog", id);
        Boolean finalIsLiked;

        if (existingLike == null) {
            // 首次点赞，创建点赞记录
            UserLike newLike = new UserLike();
            newLike.setUserId(userId);
            newLike.setTargetType("blog");
            newLike.setTargetId(id);
            newLike.setStatus(1);
            newLike.setCreateTime(java.time.LocalDateTime.now());
            newLike.setUpdateTime(java.time.LocalDateTime.now());

            userLikeMapper.insert(newLike);
            blogMapper.incrementLikeCount(id);
            finalIsLiked = true;

            log.info("用户 {} 首次点赞博客 {}", userId, id);
        } else {
            // 切换点赞状态
            Integer oldStatus = existingLike.getStatus();
            Integer newStatus = oldStatus == 1 ? 0 : 1;
            existingLike.setStatus(newStatus);
            existingLike.setUpdateTime(java.time.LocalDateTime.now());

            userLikeMapper.updateById(existingLike);

            // 更新博客点赞数
            if (oldStatus == 1) {
                // 之前是点赞，现在取消点赞
                blogMapper.decrementLikeCount(id);
                log.info("用户 {} 取消点赞博客 {}", userId, id);
            } else {
                // 之前是取消点赞，现在重新点赞
                blogMapper.incrementLikeCount(id);
                log.info("用户 {} 重新点赞博客 {}", userId, id);
            }
            finalIsLiked = newStatus == 1;
        }

        // 清除相关缓存
        cacheService.delete("blog:detail:" + id);
        cacheService.deleteByPattern("blog:page:*");
        cacheService.deleteByPattern("blog:hot:*");
        cacheService.deleteByPattern("blog:latest:*");

        // 获取更新后的博客数据
        Blog updatedBlog = blogMapper.selectById(id);

        return new LikeResultDTO(finalIsLiked, updatedBlog.getLikeCount(), updatedBlog.getViewCount());
    }
    
    @Override
    public void publishBlog(Long id, Long authorId) {
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }
        if (!checkBlogPermission(blog.getAuthorId(), authorId)) {
            throw new RuntimeException("无权限发布此博客");
        }
        
        blog.setStatus(1);
        blog.setVisibility(1);
        blog.setPublishTime(LocalDateTime.now());
        blog.setStatusChangedTime(LocalDateTime.now());
        blogMapper.updateById(blog);
        log.info("用户 {} 发布博客 {}", authorId, id);
        
        // 清除相关缓存
        clearBlogCache(id);
        clearBlogCaches();
        
        // 更新缓存版本
        cacheConsistencyService.updateCacheVersion("blog:*");

        // 同步到Elasticsearch
        if (searchService.isAvailable()) {
            try {
                syncBlogToElasticsearch(blog);
            } catch (Exception e) {
                log.error("同步发布的博客到Elasticsearch失败: {}", blog.getId(), e);
            }
        }
    }

    @Override
    public void unpublishBlog(Long id, Long authorId) {
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }
        if (!checkBlogPermission(blog.getAuthorId(), authorId)) {
            throw new RuntimeException("无权限下线此博客");
        }
        
        blog.setStatus(2);
        blog.setStatusChangedTime(LocalDateTime.now());
        blogMapper.updateById(blog);
        log.info("用户 {} 将博客 {} 下线", authorId, id);
        
        // 清除相关缓存
        clearBlogCache(id);
        clearBlogCaches();
        
        // 发布缓存失效通知
        cacheConsistencyService.publishCacheInvalidation("blog:*", "博客下线");

        // 从ES删除索引（因为博客不再是已发布状态）- 异步操作,不阻塞主流程
        try {
        deleteBlogFromElasticsearch(id);
        } catch (Exception e) {
            log.error("从ES删除博客索引失败(不影响主流程): {}", id, e);
        }
    }
    
    /**
     * 保存博客标签关联
     */
    private void saveBlogTags(Long blogId, List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            return;
        }
        List<BlogTag> blogTags = tagIds.stream()
                .map(tagId -> {
                    BlogTag blogTag = new BlogTag();
                    blogTag.setBlogId(blogId);
                    blogTag.setTagId(tagId);
                    blogTag.setCreateTime(LocalDateTime.now());
                    return blogTag;
                })
                .collect(Collectors.toList());
        
        blogTagMapper.insertBatch(blogTags);
    }
    
    @Override
    public List<BlogDetailVO> getRelatedBlogs(Long blogId, int limit) {
        // 获取当前博客信息
        Blog currentBlog = blogMapper.selectById(blogId);
        if (currentBlog == null) {
            return List.of();
        }

        // 获取当前博客的标签
        List<Long> tagIds = tagMapper.selectTagsByBlogId(blogId)
                .stream()
                .map(tag -> tag.getId())
                .collect(Collectors.toList());

        // 使用新的查询方法，已经包含标签信息
        List<BlogDetailVO> relatedBlogs = blogMapper.selectRelatedBlogsWithTags(
            blogId, currentBlog.getCategoryId(), tagIds, limit
        );

        return relatedBlogs;
    }
    
    @Override
    public BlogDetailVO getPreviousBlog(Long blogId, Long categoryId) {
        BlogDetailVO previousBlog = blogMapper.selectPreviousBlog(blogId, categoryId);
        if (previousBlog != null) {
            previousBlog.setTags(tagMapper.selectTagsByBlogId(previousBlog.getId()));
        }
        return previousBlog;
    }
    
    @Override
    public BlogDetailVO getNextBlog(Long blogId, Long categoryId) {
        BlogDetailVO nextBlog = blogMapper.selectNextBlog(blogId, categoryId);
        if (nextBlog != null) {
            nextBlog.setTags(tagMapper.selectTagsByBlogId(nextBlog.getId()));
        }
        return nextBlog;
    }
    
    @Override
    @SuppressWarnings("unchecked")
    public List<BlogDetailVO> getHotBlogs(int limit) {
        String cacheKey = "blog:hot:" + limit;
        List<BlogDetailVO> hotBlogs = cacheService.get(cacheKey, List.class);

        if (hotBlogs == null) {
            // 使用新的查询方法，已经包含标签信息
            hotBlogs = blogMapper.selectHotBlogsWithTags(limit);

            // 缓存热门博客，设置30分钟过期
            cacheService.set(cacheKey, hotBlogs, 1800);
        }

        return hotBlogs;
    }
    
    @Override
    @SuppressWarnings("unchecked")
    public List<BlogDetailVO> getLatestBlogs(int limit) {
        String cacheKey = "blog:latest:" + limit;
        List<BlogDetailVO> latestBlogs = cacheService.get(cacheKey, List.class);

        if (latestBlogs == null) {
            // 使用新的查询方法，已经包含标签信息
            latestBlogs = blogMapper.selectLatestBlogsWithTags(limit);

            // 缓存最新博客，设置10分钟过期
            cacheService.set(cacheKey, latestBlogs, 600);
        }

        return latestBlogs;
    }
    
    @Override
    public List<BlogDetailVO> getBlogsByCategory(Long categoryId, int limit) {
        List<BlogDetailVO> blogs = blogMapper.selectBlogsByCategory(categoryId, limit);
        blogs.forEach(blog -> {
            blog.setTags(tagMapper.selectTagsByBlogId(blog.getId()));
        });
        return blogs;
    }
    
    @Override
    public List<BlogDetailVO> getBlogsByTags(List<Long> tagIds, Long excludeBlogId, int limit) {
        if (tagIds == null || tagIds.isEmpty()) {
            return List.of();
        }
        
        List<BlogDetailVO> blogs = blogMapper.selectBlogsByTags(tagIds, excludeBlogId, limit);
        blogs.forEach(blog -> {
            blog.setTags(tagMapper.selectTagsByBlogId(blog.getId()));
        });
        return blogs;
    }

    /**
     * 根据请求中的标签信息生成Tag ID
     */
    private List<Long> resolveTagIds(BlogSaveDTO blogSaveDTO) {
        if (blogSaveDTO.getTagIds() != null && !blogSaveDTO.getTagIds().isEmpty()) {
            return blogSaveDTO.getTagIds();
        }

        if (blogSaveDTO.getTags() != null && !blogSaveDTO.getTags().isEmpty()) {
            return tagService.saveTagsIfNotExist(blogSaveDTO.getTags())
                    .stream()
                    .map(Tag::getId)
                    .collect(Collectors.toList());
        }

        return List.of();
    }

    /**
     * 状态为发布时必须选择分类
     */
    private void validateBlogCategory(BlogSaveDTO blogSaveDTO) {
        if (blogSaveDTO.getStatus() != null
                && blogSaveDTO.getStatus() == 1
                && blogSaveDTO.getCategoryId() == null) {
            throw new RuntimeException("发布文章前请先选择分类");
        }
    }

    /**
     * 转换为博客列表VO
     */
    private BlogListVO convertToBlogListVO(Blog blog) {
        BlogListVO vo = new BlogListVO();
        vo.setId(blog.getId());
        vo.setTitle(blog.getTitle());
        vo.setSummary(blog.getSummary());
        vo.setCoverImage(blog.getCoverImg()); // 使用正确的字段名
        vo.setAuthorId(blog.getAuthorId());
        vo.setCategoryId(blog.getCategoryId());
        vo.setStatus(blog.getStatus());
        vo.setVisibility(blog.getVisibility());
        vo.setIsTop(blog.getIsTop() != null && blog.getIsTop() == 1); // 转换Integer为Boolean
        vo.setViewCount(blog.getViewCount() != null ? blog.getViewCount().longValue() : 0L); // 转换Integer为Long
        vo.setLikeCount(blog.getLikeCount() != null ? blog.getLikeCount().longValue() : 0L);
        vo.setCommentCount(blog.getCommentCount() != null ? blog.getCommentCount().longValue() : 0L);
        vo.setPublishTime(blog.getPublishTime());
        vo.setCreateTime(blog.getCreateTime());
        vo.setUpdateTime(blog.getUpdateTime());
        vo.setStatusChangedTime(blog.getStatusChangedTime());

        // 获取作者信息
        if (blog.getAuthorId() != null) {
            User author = userMapper.selectById(blog.getAuthorId());
            if (author != null) {
                vo.setAuthorNickname(author.getNickname());
                vo.setAuthorAvatar(author.getAvatar());
            }
        }

        // 获取分类信息
        if (blog.getCategoryId() != null) {
            Category category = categoryMapper.selectById(blog.getCategoryId());
            if (category != null) {
                vo.setCategoryName(category.getName());
            }
        }

        // 获取标签信息
        List<BlogTag> blogTags = blogTagMapper.selectList(
                new LambdaQueryWrapper<BlogTag>().eq(BlogTag::getBlogId, blog.getId())
        );
        if (!blogTags.isEmpty()) {
            List<Long> tagIds = blogTags.stream().map(BlogTag::getTagId).collect(Collectors.toList());
            List<Tag> tags = tagMapper.selectBatchIds(tagIds);
            List<TagVO> tagVOs = tags.stream().map(tag -> {
                TagVO tagVO = new TagVO();
                tagVO.setId(tag.getId());
                tagVO.setName(tag.getName());
                return tagVO;
            }).collect(Collectors.toList());
            vo.setTags(tagVOs); // 使用正确的setter方法名
        }

        return vo;
    }

    @Override
    public List<BlogListVO> getAllPublicBlogs() {
        return blogMapper.selectList(new LambdaQueryWrapper<Blog>()
                .eq(Blog::getStatus, 1) // 只查询已发布的博客
                .orderByDesc(Blog::getIsTop) // 置顶的在前
                .orderByDesc(Blog::getPublishTime) // 按发布时间倒序
        ).stream().map(this::convertToBlogListVO).collect(Collectors.toList());
    }

    @Override
    public List<BlogDetailVO> getDraftsByAuthor(Long authorId) {
        List<BlogDetailVO> drafts = blogMapper.selectDraftsByAuthor(authorId);
        drafts.forEach(draft -> draft.setTags(tagMapper.selectTagsByBlogId(draft.getId())));
        return drafts;
    }

    @Override
    public IPage<BlogDetailVO> getBlogsByAuthor(PageRequest pageRequest, Long authorId, Integer status) {
        Page<BlogDetailVO> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        IPage<BlogDetailVO> result = blogMapper.selectBlogsByAuthor(page, authorId, status);
        result.getRecords().forEach(blog -> blog.setTags(tagMapper.selectTagsByBlogId(blog.getId())));
        return result;
    }

    @Override
    public void updateBlogStatus(Long id, Integer status, Long operatorId) {
        if (status == null) {
            throw new RuntimeException("状态不能为空");
        }
        if (status == 1) {
            publishBlog(id, operatorId);
            return;
        }
        if (status == 2) {
            unpublishBlog(id, operatorId);
            return;
        }

        // 草稿状态或其他情况，直接更新
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }

        if (!checkBlogPermission(blog.getAuthorId(), operatorId)) {
            throw new RuntimeException("无权限更新该博客状态");
        }

        blog.setStatus(0);
        blog.setStatusChangedTime(LocalDateTime.now());
        blogMapper.updateById(blog);

        // 草稿不应该在ES中出现 - 不阻塞主流程
        try {
        deleteBlogFromElasticsearch(id);
        } catch (Exception e) {
            log.error("从ES删除博客索引失败(不影响主流程): {}", id, e);
        }
    }

    @Override
    public List<BlogListVO> searchBlogs(String keyword, Integer limit) {
        if (StringUtils.isBlank(keyword)) {
            return List.of();
        }

        String trimmedKeyword = keyword.trim();
        int resultLimit = limit != null && limit > 0 ? limit : 20;

        // 使用MySQL全文索引搜索（性能优化）
        try {
            List<Blog> results = blogMapper.selectList(new QueryWrapper<Blog>()
                    .apply("MATCH(title, summary, content) AGAINST({0} IN BOOLEAN MODE)", trimmedKeyword)
                    .eq("status", 1)
                    .eq("deleted", 0)
                    .orderByDesc("is_top")
                    .orderByDesc("publish_time")
                    .last("LIMIT " + resultLimit));
            
            log.debug("全文索引搜索 - 关键词: '{}', 结果数量: {}", trimmedKeyword, results.size());
            return convertToBlogListVOs(results);
        } catch (Exception e) {
            log.warn("全文索引搜索失败，降级到LIKE搜索: {}", e.getMessage());
            
            // 降级：使用LIKE搜索
            String[] keywords = trimmedKeyword.split("\\s+");
            LambdaQueryWrapper<Blog> queryWrapper = createPublishedBlogQuery();

            if (keywords.length == 1) {
                queryWrapper.and(wrapper -> wrapper
                        .like(Blog::getTitle, trimmedKeyword)
                        .or().like(Blog::getSummary, trimmedKeyword)
                        .or().like(Blog::getContent, trimmedKeyword)
                );
            } else {
                queryWrapper.and(outerWrapper -> {
                    for (int i = 0; i < keywords.length; i++) {
                        String kw = keywords[i].trim();
                        if (kw.isEmpty()) continue;
                        if (i == 0) {
                            outerWrapper.and(wrapper -> wrapper
                                    .like(Blog::getTitle, kw)
                                    .or().like(Blog::getSummary, kw)
                                    .or().like(Blog::getContent, kw)
                            );
                        } else {
                            outerWrapper.or(wrapper -> wrapper
                                    .like(Blog::getTitle, kw)
                                    .or().like(Blog::getSummary, kw)
                                    .or().like(Blog::getContent, kw)
                            );
                        }
                    }
                });
            }

            List<Blog> fallbackResults = executeSearchQuery(queryWrapper, limit, "LIKE降级搜索", trimmedKeyword);
            return convertToBlogListVOs(fallbackResults);
        }
    }

    @Override
    public List<BlogListVO> searchBlogsByTag(String tagName, Integer limit) {
        if (StringUtils.isBlank(tagName)) {
            return List.of();
        }

        // 查找有博客关联的标签
        List<Long> blogIds = findBlogIdsByTagName(tagName);
        if (blogIds.isEmpty()) {
            return List.of();
        }

        LambdaQueryWrapper<Blog> queryWrapper = createPublishedBlogQuery()
                .in(Blog::getId, blogIds);

        List<Blog> matchingBlogs = executeSearchQuery(queryWrapper, limit, "标签搜索", tagName);
        return convertToBlogListVOs(matchingBlogs);
    }

    /**
     * 创建已发布博客的基础查询条件
     */
    private LambdaQueryWrapper<Blog> createPublishedBlogQuery() {
        return new LambdaQueryWrapper<Blog>()
                .eq(Blog::getStatus, 1)
                .eq(Blog::getDeleted, 0);
    }

    /**
     * 执行搜索查询（统一排序和限制）
     */
    private List<Blog> executeSearchQuery(LambdaQueryWrapper<Blog> queryWrapper, Integer limit, 
                                          String searchType, String searchTerm) {
        int resultLimit = limit != null && limit > 0 ? limit : 20;
        queryWrapper.orderByDesc(Blog::getIsTop)
                .orderByDesc(Blog::getPublishTime)
                .last("LIMIT " + resultLimit);

        List<Blog> results = blogMapper.selectList(queryWrapper);
        log.debug("{} - 条件: '{}', 结果数量: {}", searchType, searchTerm, results.size());
        return results;
    }

    /**
     * 根据标签名查找关联的博客ID列表
     */
    private List<Long> findBlogIdsByTagName(String tagName) {
        List<Tag> tags = tagMapper.selectList(new LambdaQueryWrapper<Tag>()
                .eq(Tag::getName, tagName)
                .orderByDesc(Tag::getCreateTime));

        for (Tag tag : tags) {
            List<BlogTag> blogTags = blogTagMapper.selectList(new LambdaQueryWrapper<BlogTag>()
                    .eq(BlogTag::getTagId, tag.getId()));
            if (!blogTags.isEmpty()) {
                return blogTags.stream().map(BlogTag::getBlogId).collect(Collectors.toList());
            }
        }
        return List.of();
    }

    /**
     * 批量转换为BlogListVO
     */
    private List<BlogListVO> convertToBlogListVOs(List<Blog> blogs) {
        return blogs.stream().map(this::convertToBlogListVO).collect(Collectors.toList());
    }

    /**
     * 清除单个博客缓存
     */
    private void clearBlogCache(Long blogId) {
        cacheService.delete("blog:detail:" + blogId);
    }
    
    /**
     * 清除博客相关缓存
     */
    private void clearBlogCaches() {
        // 清除热门博客缓存
        cacheService.deleteByPattern("blog:hot:*");
        // 清除最新博客缓存
        cacheService.deleteByPattern("blog:latest:*");
        // 清除分类相关缓存
        cacheService.deleteByPattern("blog:category:*");
        // 清除标签相关缓存
        cacheService.deleteByPattern("blog:tags:*");
    }

    /**
     * 同步博客到Elasticsearch
     */
    private void syncBlogToElasticsearch(Blog blog) {
        if (!searchService.isAvailable()) {
            log.warn("Elasticsearch不可用，跳过同步博客: {}", blog.getId());
            return;
        }

        // 异步执行，避免阻塞主流程
        CompletableFuture.runAsync(() -> {
        try {
            // 获取作者信息
            User author = userMapper.selectById(blog.getAuthorId());
            // 获取分类信息
            Category category = categoryMapper.selectById(blog.getCategoryId());
            // 获取标签信息
            List<Tag> tags = getBlogTags(blog.getId());

            // 转换为ES文档
            var document = blogDocumentConverter.convertToDocument(blog, author, category, tags);

            // 索引到ES
            searchService.indexBlog(document);

            log.info("成功同步博客到ES: {}", blog.getId());
        } catch (Exception e) {
                log.error("异步同步博客到ES失败: {}", blog.getId(), e);
        }
        });
    }

    /**
     * 从ES删除博客索引
     */
    private void deleteBlogFromElasticsearch(Long blogId) {
        if (!searchService.isAvailable()) {
            log.warn("Elasticsearch不可用，跳过删除索引: {}", blogId);
            return;
        }

        // 异步执行删除，避免阻塞主流程
        CompletableFuture.runAsync(() -> {
            try {
                searchService.deleteIndex(blogId.toString());
                log.info("成功从ES删除博客索引: {}", blogId);
            } catch (Exception e) {
                log.error("异步从ES删除博客索引失败: {}", blogId, e);
            }
        });
    }

    /**
     * 获取博客的标签列表
     */
    private List<Tag> getBlogTags(Long blogId) {
        List<Long> tagIds = blogTagMapper.selectList(
                new LambdaQueryWrapper<BlogTag>()
                        .eq(BlogTag::getBlogId, blogId)
        ).stream().map(BlogTag::getTagId).collect(Collectors.toList());

        if (tagIds.isEmpty()) {
            return List.of();
        }

        return tagMapper.selectBatchIds(tagIds);
    }

    /**
     * 检查博客操作权限
     * 管理员可以操作任意博客，普通用户只能操作自己的博客
     */
    private boolean checkBlogPermission(Long blogAuthorId, Long operatorId) {
        // 如果是作者本人，有权限
        if (blogAuthorId.equals(operatorId)) {
            return true;
        }

        // 如果是管理员，有权限
        return securityUtils.isAdmin();
    }
}