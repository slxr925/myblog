package com.ryan.myblog.common;

/**
 * 用户角色枚举
 */
public enum Role {
    USER(0, "普通用户"),
    ADMIN(1, "管理员");
    
    private final int code;
    private final String description;
    
    Role(int code, String description) {
        this.code = code;
        this.description = description;
    }
    
    public int getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
    
    public static Role fromCode(int code) {
        for (Role role : values()) {
            if (role.code == code) {
                return role;
            }
        }
        throw new IllegalArgumentException("无效的角色代码: " + code);
    }
}