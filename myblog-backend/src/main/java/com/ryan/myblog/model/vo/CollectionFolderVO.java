package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 收藏夹分类VO
 */
@Data
public class CollectionFolderVO {

    /**
     * 分类ID
     */
    private Long id;

    /**
     * 分类名称
     */
    private String name;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 分类描述
     */
    private String description;

    /**
     * 是否默认分类
     */
    private Boolean isDefault;

    /**
     * 排序顺序
     */
    private Integer sortOrder;

    /**
     * 收藏数量
     */
    private Integer collectionCount;

    /**
     * 是否公开
     */
    private Boolean isPublic;

    /**
     * 分享码
     */
    private String shareCode;

    /**
     * 分享过期时间
     */
    private LocalDateTime shareExpireTime;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}
