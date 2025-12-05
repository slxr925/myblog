package com.ryan.myblog.utils;

import com.ryan.myblog.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT工具类
 *
 * 安全特性：
 * 1. 使用配置属性类管理JWT配置
 * 2. 支持密钥强度验证
 * 3. 生产环境强制使用安全密钥
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUtils {

    private final JwtProperties jwtProperties;
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }
    
    /**
     * 生成JWT令牌（向后兼容方法）
     */
    public String generateToken(Long userId, String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpiration() * 1000);
        
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("username", username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    /**
     * 生成Access Token
     * @param userId 用户ID
     * @param username 用户名
     * @param role 用户角色
     * @param ip 客户端IP（仅对管理员绑定）
     */
    public String generateAccessToken(Long userId, String username, Integer role, String ip) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getAccessTokenExpiration() * 1000);
        
        var builder = Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("username", username)
                .claim("role", role)
                .claim("type", "access")
                .setIssuedAt(now)
                .setExpiration(expiryDate);
        
        // 管理员token绑定IP（角色1为管理员）
        if (role != null && role == 1) {
            builder.claim("ip", ip);
            log.debug("生成管理员Access Token，绑定IP: {}", ip);
        }
        
        return builder.signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }
    
    /**
     * 生成Refresh Token
     * 只包含用户ID，用于刷新Access Token
     */
    public String generateRefreshToken(Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getRefreshTokenExpiration() * 1000);
        
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("type", "refresh")
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    /**
     * 从token中获取用户ID
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return Long.parseLong(claims.getSubject());
    }
    
    /**
     * 从token中获取用户名
     */
    public String getUsernameFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("username", String.class);
    }
    
    /**
     * 从token中获取用户角色
     */
    public Integer getRoleFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("role", Integer.class);
    }
    
    /**
     * 从token中获取IP地址
     */
    public String getIpFromToken(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.get("ip", String.class);
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * 获取token类型
     */
    public String getTokenType(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.get("type", String.class);
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * 验证token是否有效
     */
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 验证Access Token并检查IP（管理员专用）
     * @param token JWT token
     * @param currentIp 当前请求的IP
     * @return true if valid
     */
    public boolean validateAccessTokenWithIp(String token, String currentIp) {
        try {
            Claims claims = parseToken(token);
            
            // 检查token类型
            String type = claims.get("type", String.class);
            if (!"access".equals(type)) {
                log.warn("Token类型错误，期望access，实际: {}", type);
                return false;
            }
            
            // 检查是否有IP绑定（管理员token）
            String tokenIp = claims.get("ip", String.class);
            if (tokenIp != null) {
                // 有IP绑定，需要验证
                if (!IpUtils.ipMatches(tokenIp, currentIp)) {
                    log.warn("管理员Token IP不匹配 - Token IP: {}, 当前IP: {}", tokenIp, currentIp);
                    return false;
                }
            }
            
            return true;
        } catch (Exception e) {
            log.error("Token验证失败: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 解析token
     */
    private Claims parseToken(String token) {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}