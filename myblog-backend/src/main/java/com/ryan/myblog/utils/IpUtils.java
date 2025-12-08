package com.ryan.myblog.utils;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

/**
 * IP地址工具类
 * 用于获取客户端真实IP地址，支持反向代理
 */
@Slf4j
public class IpUtils {
    
    private static final String UNKNOWN = "unknown";
    private static final String LOCALHOST_IPV4 = "127.0.0.1";
    private static final String LOCALHOST_IPV6 = "0:0:0:0:0:0:0:1";
    private static final int IP_MAX_LENGTH = 15;
    
    /**
     * 获取客户端真实IP地址
     * 支持通过Nginx等反向代理获取真实IP
     */
    public static String getClientIp(HttpServletRequest request) {
        if (request == null) {
            log.warn("HttpServletRequest为空，无法获取IP");
            return UNKNOWN;
        }
        
        String ip = null;
        
        // 1. 尝试从X-Forwarded-For获取（Nginx代理常用）
        ip = request.getHeader("X-Forwarded-For");
        if (isValidIp(ip)) {
            // X-Forwarded-For可能包含多个IP，取第一个
            if (ip.contains(",")) {
                ip = ip.split(",")[0].trim();
            }
            return ip;
        }
        
        // 2. 尝试从X-Real-IP获取（Nginx代理常用）
        ip = request.getHeader("X-Real-IP");
        if (isValidIp(ip)) {
            return ip;
        }
        
        // 3. 尝试从Proxy-Client-IP获取（Apache代理）
        ip = request.getHeader("Proxy-Client-IP");
        if (isValidIp(ip)) {
            return ip;
        }
        
        // 4. 尝试从WL-Proxy-Client-IP获取（WebLogic代理）
        ip = request.getHeader("WL-Proxy-Client-IP");
        if (isValidIp(ip)) {
            return ip;
        }
        
        // 5. 尝试从HTTP_CLIENT_IP获取
        ip = request.getHeader("HTTP_CLIENT_IP");
        if (isValidIp(ip)) {
            return ip;
        }
        
        // 6. 尝试从HTTP_X_FORWARDED_FOR获取
        ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        if (isValidIp(ip)) {
            return ip;
        }
        
        // 7. 最后从RemoteAddr获取（直接连接的IP）
        ip = request.getRemoteAddr();
        if (StringUtils.isBlank(ip)) {
            ip = UNKNOWN;
        }
        
        // 处理localhost
        if (LOCALHOST_IPV6.equals(ip)) {
            ip = LOCALHOST_IPV4;
        }
        
        log.debug("获取到客户端IP: {}", ip);
        return ip;
    }
    
    /**
     * 验证IP地址是否有效
     */
    private static boolean isValidIp(String ip) {
        if (StringUtils.isBlank(ip) || UNKNOWN.equalsIgnoreCase(ip)) {
            return false;
        }
        
        // IP地址长度检查
        if (ip.length() > IP_MAX_LENGTH) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 检查两个IP是否匹配
     * 用于验证token中的IP和当前请求IP是否一致
     */
    public static boolean ipMatches(String ip1, String ip2) {
        if (StringUtils.isBlank(ip1) || StringUtils.isBlank(ip2)) {
            return false;
        }
        
        // 标准化localhost
        if (LOCALHOST_IPV6.equals(ip1)) {
            ip1 = LOCALHOST_IPV4;
        }
        if (LOCALHOST_IPV6.equals(ip2)) {
            ip2 = LOCALHOST_IPV4;
        }
        
        return ip1.equals(ip2);
    }
    
    /**
     * 判断是否为内网IP
     */
    public static boolean isInternalIp(String ip) {
        if (StringUtils.isBlank(ip)) {
            return false;
        }
        
        // localhost
        if (LOCALHOST_IPV4.equals(ip) || LOCALHOST_IPV6.equals(ip)) {
            return true;
        }
        
        // 私有IP段
        String[] internalIpPrefixes = {
            "10.",           // 10.0.0.0/8
            "172.16.",       // 172.16.0.0/12
            "172.17.",
            "172.18.",
            "172.19.",
            "172.20.",
            "172.21.",
            "172.22.",
            "172.23.",
            "172.24.",
            "172.25.",
            "172.26.",
            "172.27.",
            "172.28.",
            "172.29.",
            "172.30.",
            "172.31.",
            "192.168."       // 192.168.0.0/16
        };
        
        for (String prefix : internalIpPrefixes) {
            if (ip.startsWith(prefix)) {
                return true;
            }
        }
        
        return false;
    }
}




