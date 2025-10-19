package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.dto.BlogSaveDTO;
import com.ryan.myblog.entity.Blog;
import com.ryan.myblog.entity.BlogTag;
import com.ryan.myblog.entity.UserLike;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.BlogTagMapper;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.mapper.UserLikeMapper;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.CacheService;
import com.ryan.myblog.service.CacheConsistencyService;
import com.ryan.myblog.utils.SecurityUtils;
import com.ryan.myblog.vo.BlogDetailVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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
    private final CacheService cacheService;
    private final CacheConsistencyService cacheConsistencyService;
    private final SecurityUtils securityUtils;
    
    @Override
    @Transactional
    public void saveBlog(BlogSaveDTO blogSaveDTO, Long authorId) {
        // 创建博客实体
        Blog blog = new Blog();
        blog.setTitle(blogSaveDTO.getTitle());
        blog.setSummary(blogSaveDTO.getSummary());
        blog.setContent(blogSaveDTO.getContent());
        blog.setCoverImg(blogSaveDTO.getCoverImg());
        blog.setAuthorId(authorId);
        blog.setCategoryId(blogSaveDTO.getCategoryId());
        blog.setStatus(blogSaveDTO.getStatus());
        blog.setIsTop(blogSaveDTO.getIsTop());
        blog.setViewCount(0);
        blog.setLikeCount(0);
        blog.setCommentCount(0);
        
        if (blogSaveDTO.getStatus() == 1) { // 已发布
            blog.setPublishTime(LocalDateTime.now());
        }
        
        // 保存博客
        blogMapper.insert(blog);
        
        // 保存标签关联
        if (blogSaveDTO.getTagIds() != null && !blogSaveDTO.getTagIds().isEmpty()) {
            saveBlogTags(blog.getId(), blogSaveDTO.getTagIds());
        }
        
        // 清除相关缓存
        clearBlogCaches();
    }
    
    @Override
    @Transactional
    public void updateBlog(Long id, BlogSaveDTO blogSaveDTO, Long authorId) {
        // 检查博客是否存在且属于当前用户
        Blog existBlog = blogMapper.selectById(id);
        if (existBlog == null) {
            throw new RuntimeException("博客不存在");
        }
        if (!existBlog.getAuthorId().equals(authorId)) {
            throw new RuntimeException("无权限修改此博客");
        }
        
        // 更新博客信息
        existBlog.setTitle(blogSaveDTO.getTitle());
        existBlog.setSummary(blogSaveDTO.getSummary());
        existBlog.setContent(blogSaveDTO.getContent());
        existBlog.setCoverImg(blogSaveDTO.getCoverImg());
        existBlog.setCategoryId(blogSaveDTO.getCategoryId());
        existBlog.setStatus(blogSaveDTO.getStatus());
        existBlog.setIsTop(blogSaveDTO.getIsTop());
        
        if (blogSaveDTO.getStatus() == 1 && existBlog.getPublishTime() == null) {
            existBlog.setPublishTime(LocalDateTime.now());
        }
        
        blogMapper.updateById(existBlog);
        
        // 更新标签关联
        blogTagMapper.deleteByBlogId(id);
        if (blogSaveDTO.getTagIds() != null && !blogSaveDTO.getTagIds().isEmpty()) {
            saveBlogTags(id, blogSaveDTO.getTagIds());
        }
        
        // 清除缓存
        clearBlogCache(id);
        clearBlogCaches();
        
        // 更新缓存版本
        cacheConsistencyService.updateCacheVersion("blog:*");
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
    }
    
    @Override
    public IPage<BlogDetailVO> getBlogPage(PageRequest pageRequest, Long categoryId, 
                                          Long tagId, String keyword, Integer status) {
        Page<BlogDetailVO> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        
        IPage<BlogDetailVO> result = blogMapper.selectBlogPage(page, categoryId, tagId, keyword, status);
        
        // 为每个博客设置标签信息
        result.getRecords().forEach(blog -> {
            blog.setTags(tagMapper.selectTagsByBlogId(blog.getId()));
        });
        
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
        // 简化版本，直接增加阅读量
        blogMapper.incrementViewCount(id);
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
    public void publishBlog(Long id, Long authorId) {
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }
        if (!blog.getAuthorId().equals(authorId)) {
            throw new RuntimeException("无权限发布此博客");
        }
        
        blog.setStatus(1);
        blog.setPublishTime(LocalDateTime.now());
        blogMapper.updateById(blog);
        
        // 清除相关缓存
        clearBlogCache(id);
        clearBlogCaches();
        
        // 更新缓存版本
        cacheConsistencyService.updateCacheVersion("blog:*");
    }
    
    @Override
    public void unpublishBlog(Long id, Long authorId) {
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }
        if (!blog.getAuthorId().equals(authorId)) {
            throw new RuntimeException("无权限下线此博客");
        }
        
        blog.setStatus(2);
        blogMapper.updateById(blog);
        
        // 清除相关缓存
        clearBlogCache(id);
        clearBlogCaches();
        
        // 发布缓存失效通知
        cacheConsistencyService.publishCacheInvalidation("blog:*", "博客下线");
    }
    
    /**
     * 保存博客标签关联
     */
    private void saveBlogTags(Long blogId, List<Long> tagIds) {
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
        
        // 查询相关博客
        List<BlogDetailVO> relatedBlogs = blogMapper.selectRelatedBlogs(
            blogId, currentBlog.getCategoryId(), tagIds, limit
        );
        
        // 为每个博客设置标签信息
        relatedBlogs.forEach(blog -> {
            blog.setTags(tagMapper.selectTagsByBlogId(blog.getId()));
        });
        
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
            hotBlogs = blogMapper.selectHotBlogs(limit);
            hotBlogs.forEach(blog -> {
                blog.setTags(tagMapper.selectTagsByBlogId(blog.getId()));
            });
            
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
            latestBlogs = blogMapper.selectLatestBlogs(limit);
            latestBlogs.forEach(blog -> {
                blog.setTags(tagMapper.selectTagsByBlogId(blog.getId()));
            });
            
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