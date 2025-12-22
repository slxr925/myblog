package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 评论VO
 */
@Data
public class CommentVO {

    private Long id;

    /**
     * 博客ID
     */
    private Long blogId;

    /**
     * 博客标题
     */
    private String blogTitle;

    /**
     * 评论者ID
     */
    private Long userId;

    /**
     * 评论者用户名
     */
    private String username;

    /**
     * 评论者昵称
     */
    private String nickname;

    /**
     * 评论者头像
     */
    private String avatar;

    /**
     * 父评论ID
     */
    private Long parentId;

    /**
     * 回复目标用户ID
     */
    private Long replyUserId;

    /**
     * 回复目标用户昵称
     */
    private String replyUserNickname;

    /**
     * 评论内容
     */
    private String content;

    /**
     * 评论状态：0-待审核，1-已通过，2-已拒绝
     */
    private Integer status;

    /**
     * 点赞数
     */
    private Integer likeCount;

    /**
     * 当前用户是否点赞（需要登录）
     */
    private Boolean isLiked;

    /**
     * 回复数量
     */
    private Integer replyCount;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 子评论列表
     */
    private List<CommentVO> children;

    /**
     * 回复列表（用于前端展示）
     */
    private List<CommentVO> replies;
}