package com.ryan.myblog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Token响应DTO
 * 包含access token和refresh token
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {
    
    /**
     * 访问令牌（短期有效）
     */
    private String accessToken;
    
    /**
     * 刷新令牌（长期有效）
     */
    private String refreshToken;
    
    /**
     * 访问令牌类型
     */
    private String tokenType = "Bearer";
    
    /**
     * 访问令牌过期时间（秒）
     */
    private Long expiresIn;
    
    public TokenResponse(String accessToken, String refreshToken, Long expiresIn) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.tokenType = "Bearer";
    }
}




