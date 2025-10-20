package com.ryan.myblog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.model.dto.CommentSaveDTO;
import com.ryan.myblog.model.vo.CommentVO;

import java.util.List;

/**
 * 评论服务接口
 */
public interface CommentService {
    
    /**
     * 发布评论
     */
    void saveComment(CommentSaveDTO commentSaveDTO, Long userId);
    
    /**
     * 分页查询评论列表（树形结构）
     */
    List<CommentVO> getCommentTree(Long blogId, Integer status);
    
    /**
     * 分页查询评论列表（平铺结构）
     */
    IPage<CommentVO> getCommentPage(PageRequest pageRequest, Long blogId, Integer status);
    
    /**
     * 审核评论
     */
    void auditComment(Long id, Integer status, Long operatorId);
    
    /**
     * 删除评论
     */
    void deleteComment(Long id, Long operatorId);
    
    /**
     * 点赞/取消点赞评论
     */
    void toggleCommentLike(Long id, Long userId);
    
    /**
     * 获取评论详情
     */
    CommentVO getCommentById(Long id);
    
    /**
     * 根据博客ID统计评论数
     */
    Long countCommentsByBlogId(Long blogId);
}