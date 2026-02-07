package com.ryan.myblog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.model.dto.BlogSaveDTO;
import com.ryan.myblog.model.dto.LikeResultDTO;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.vo.BlogDetailVO;
import com.ryan.myblog.model.vo.BlogListVO;

import java.util.List;

/**
 * 博客服务接口
 */
public interface BlogService {

    /**
     * 保存博客
     */
    BlogDetailVO saveBlog(BlogSaveDTO blogSaveDTO, Long authorId);

    /**
     * 更新博客
     */
    BlogDetailVO updateBlog(Long id, BlogSaveDTO blogSaveDTO, Long authorId);

    /**
     * 删除博客
     * 支持管理员删除任意博客，普通用户只能删除自己的博客
     */
    void deleteBlog(Long id, Long operatorId);

    /**
     * 分页查询博客列表
     */
    IPage<BlogDetailVO> getBlogPage(PageRequest pageRequest, Long categoryId,
            Long tagId, String keyword, Integer status);

    /**
     * 查询博客详情
     */
    BlogDetailVO getBlogDetail(Long id);

    /**
     * 查询博客详情（包含用户点赞状态）
     */
    BlogDetailVO getBlogDetail(Long id, Long userId);

    /**
     * 增加阅读量
     */
    void incrementViewCount(Long id);

    /**
     * 点赞/取消点赞
     * 
     * @return 操作后的点赞状态（true-已点赞，false-未点赞）
     */
    Boolean toggleLike(Long id, Long userId);

    /**
     * 点赞/取消点赞（返回详细信息）
     * 
     * @return 包含点赞状态、点赞数、浏览量的结果
     */
    LikeResultDTO toggleLikeWithDetails(Long id, Long userId);

    /**
     * 发布博客
     */
    void publishBlog(Long id, Long authorId);

    /**
     * 下线博客
     */
    void unpublishBlog(Long id, Long authorId);

    /**
     * 获取相关推荐博客
     */
    List<BlogDetailVO> getRelatedBlogs(Long blogId, int limit);

    /**
     * 获取上一篇博客
     */
    BlogDetailVO getPreviousBlog(Long blogId, Long categoryId);

    /**
     * 获取下一篇博客
     */
    BlogDetailVO getNextBlog(Long blogId, Long categoryId);

    /**
     * 获取热门博客
     */
    List<BlogDetailVO> getHotBlogs(int limit);

    /**
     * 获取最新博客
     */
    List<BlogDetailVO> getLatestBlogs(int limit);

    /**
     * 获取最新博客（简化版）
     */
    List<BlogListVO> getRecentBlogs(int limit);

    /**
     * 根据分类获取推荐博客
     */
    List<BlogDetailVO> getBlogsByCategory(Long categoryId, int limit);

    /**
     * 搜索所有公开博客文章
     * 
     * @param keyword 搜索关键词
     * @param limit   结果限制数量
     * @return 搜索结果列表
     */
    List<BlogListVO> searchBlogs(String keyword, Integer limit);

    /**
     * 根据标签搜索博客文章
     * 
     * @param tagName 标签名称
     * @param limit   结果限制数量
     * @return 搜索结果列表
     */
    List<BlogListVO> searchBlogsByTag(String tagName, Integer limit);

    /**
     * 根据标签获取推荐博客
     */
    List<BlogDetailVO> getBlogsByTags(List<Long> tagIds, Long excludeBlogId, int limit);

    /**
     * 获取所有公开文章
     */
    List<BlogListVO> getAllPublicBlogs();

    /**
     * 获取当前作者的草稿列表
     */
    List<BlogDetailVO> getDraftsByAuthor(Long authorId);

    /**
     * 获取当前作者的文章（支持状态过滤）
     */
    IPage<BlogDetailVO> getBlogsByAuthor(PageRequest pageRequest, Long authorId, Integer status);

    /**
     * 更新博客状态
     */
    void updateBlogStatus(Long id, Integer status, Long operatorId);

    /**
     * 获取用户点赞的博客列表
     */
    IPage<BlogDetailVO> getLikedBlogsByUser(PageRequest pageRequest, Long userId);

    /**
     * 获取关注流博客
     */
    IPage<BlogDetailVO> getFollowingFeed(PageRequest pageRequest, Long userId);

    /**
     * 获取推荐博客
     */
    List<BlogDetailVO> getRecommendedBlogs(Long userId, int limit);

    /**
     * 获取各状态的博客总数（支持关键词过滤）
     * 
     * @param keyword 搜索关键词
     * @return 状态统计Map，key为状态值，value为该状态的博客总数
     */
    java.util.Map<Integer, Long> getBlogStatusCounts(String keyword);
}
