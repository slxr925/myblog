package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 博客标签实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_tag")
public class Tag {
    
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    
    /**
     * 标签名称
     */
    @TableField("name")
    private String name;
    
    /**
     * 标签颜色
     */
    @TableField("color")
    private String color;
    
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