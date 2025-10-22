package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 博客分类实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_category")
public class Category {
    
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    
    /**
     * 分类名称
     */
    @TableField("name")
    private String name;
    
    /**
     * 分类描述
     */
    @TableField("description")
    private String description;
    
    /**
     * 分类图标
     */
    @TableField("icon")
    private String icon;
    
    /**
     * 排序
     */
    @TableField("sort")
    private Integer sort;

    /**
     * 文章数量（临时字段，不存储到数据库）
     */
    @TableField(exist = false)
    private Long blogCount;

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
    
    /**
     * 是否删除：0-未删除，1-已删除
     */
    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}