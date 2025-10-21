package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户点赞记录实体
 * 用于防止重复点赞
 */
@Data
@TableName("tb_user_like")
public class UserLike {

    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 点赞目标类型：blog-博客，comment-评论
     */
    private String targetType;

    /**
     * 点赞目标ID
     */
    private Long targetId;

    /**
     * 点赞状态：1-点赞，0-取消点赞
     */
    private Integer status;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}