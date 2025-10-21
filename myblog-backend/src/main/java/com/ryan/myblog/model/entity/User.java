package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_user")
public class User {
    
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    
    /**
     * 用户名
     */
    @TableField("username")
    private String username;
    
    /**
     * 密码
     */
    @TableField("password")
    private String password;
    
    /**
     * 邮箱
     */
    @TableField("email")
    private String email;
    
    /**
     * 昵称
     */
    @TableField("nickname")
    private String nickname;
    
    /**
     * 头像地址
     */
    @TableField("avatar")
    private String avatar;
    
    /**
     * 个人简介
     */
    @TableField("bio")
    private String bio;
    
    /**
     * 用户状态：0-正常，1-禁用
     */
    @TableField("status")
    private Integer status;
    
    /**
     * 用户角色：0-普通用户，1-管理员
     */
    @TableField("role")
    private Integer role;
    
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
    // @TableLogic  // 暂时注释掉逻辑删除，用于调试分页问题
    @TableField("deleted")
    private Integer deleted;
}