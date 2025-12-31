package com.ryan.myblog.model.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 通知设置DTO
 * 用于接收前端更新通知设置的请求
 */
@Data
@Schema(description = "通知设置请求对象")
public class NotificationSettingDTO {

    /**
     * 是否开启评论通知
     * 当文章被评论或评论被回复时收到通知
     */
    @Schema(description = "是否开启评论通知", example = "true")
    private Boolean enableComment;

    /**
     * 是否开启点赞通知
     * 当文章或评论被点赞时收到通知
     */
    @Schema(description = "是否开启点赞通知", example = "true")
    private Boolean enableLike;

    /**
     * 是否开启关注通知
     * 当被其他用户关注时收到通知
     */
    @Schema(description = "是否开启关注通知", example = "true")
    private Boolean enableFollow;

    /**
     * 是否开启收藏通知
     * 当文章被收藏时收到通知
     */
    @Schema(description = "是否开启收藏通知", example = "true")
    private Boolean enableCollection;

    /**
     * 是否开启系统通知
     * 接收管理员公告、账户安全提醒等
     */
    @Schema(description = "是否开启系统通知", example = "true")
    private Boolean enableSystem;

    /**
     * 是否开启新文章通知
     * 当关注的作者发布新文章时收到通知
     */
    @Schema(description = "是否开启新文章通知", example = "true")
    private Boolean enableNewArticle;

    /**
     * 是否开启@提及通知
     * 当在评论中被@时收到通知
     */
    @Schema(description = "是否开启@提及通知", example = "true")
    private Boolean enableMention;

    /**
     * 是否开启统计通知
     * 接收周报/月报、互动里程碑通知
     */
    @Schema(description = "是否开启统计通知", example = "true")
    private Boolean enableStats;

    /**
     * 是否开启WebSocket实时推送
     * 关闭后需要手动刷新页面查看通知
     */
    @Schema(description = "是否开启WebSocket实时推送", example = "true")
    private Boolean enableWebsocket;

    /**
     * 是否开启浏览器通知
     * 开启后可在浏览器接收桌面通知（需要浏览器授权）
     */
    @Schema(description = "是否开启浏览器通知", example = "true")
    private Boolean enableBrowser;

    /**
     * 总开关：是否开启所有通知
     * 关闭后将不接收任何通知
     */
    @Schema(description = "是否开启所有通知（总开关）", example = "true")
    private Boolean enableAll;
}
