package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户通知设置实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_notification_setting")
public class NotificationSetting {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 是否开启评论通知
     */
    @TableField("enable_comment")
    private Boolean enableComment;

    /**
     * 是否开启点赞通知
     */
    @TableField("enable_like")
    private Boolean enableLike;

    /**
     * 是否开启关注通知
     */
    @TableField("enable_follow")
    private Boolean enableFollow;

    /**
     * 是否开启收藏通知
     */
    @TableField("enable_collection")
    private Boolean enableCollection;

    /**
     * 是否开启系统通知
     */
    @TableField("enable_system")
    private Boolean enableSystem;

    /**
     * 是否开启新文章通知
     */
    @TableField("enable_new_article")
    private Boolean enableNewArticle;

    /**
     * 是否开启@提及通知
     */
    @TableField("enable_mention")
    private Boolean enableMention;

    /**
     * 是否开启统计通知
     */
    @TableField("enable_stats")
    private Boolean enableStats;

    /**
     * 是否开启WebSocket推送
     */
    @TableField("enable_websocket")
    private Boolean enableWebsocket;

    /**
     * 是否开启浏览器通知
     */
    @TableField("enable_browser")
    private Boolean enableBrowser;

    /**
     * 总开关：是否开启所有通知
     */
    @TableField("enable_all")
    private Boolean enableAll;

    /**
     * 创建时间
     */
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
