package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.model.entity.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 评论Mapper接口
 */
@Mapper
public interface CommentMapper extends BaseMapper<Comment> {

        /**
         * 分页查询评论列表（包含用户信息）
         */
        IPage<Comment> selectCommentPage(Page<Comment> page,
                        @Param("blogId") Long blogId,
                        @Param("status") Integer status,
                        @Param("keyword") String keyword);

        /**
         * 根据用户ID分页查询评论列表（包含博客标题）
         */
        IPage<Comment> selectCommentsByUser(IPage<Comment> page,
                        @Param("userId") Long userId);

        /**
         * 统计博客的评论数
         * 
         * @param blogId 博客ID
         * @return 评论数
         */
        Integer countByBlogId(@Param("blogId") Long blogId);
}