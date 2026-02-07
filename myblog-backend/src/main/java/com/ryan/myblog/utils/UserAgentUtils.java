package com.ryan.myblog.utils;

/**
 * 简单的User-Agent解析工具
 */
public class UserAgentUtils {

    private UserAgentUtils() {}

    public static String toDeviceLabel(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown";
        }
        String ua = userAgent.toLowerCase();
        String os = "Unknown OS";
        if (ua.contains("windows")) os = "Windows";
        else if (ua.contains("mac os")) os = "macOS";
        else if (ua.contains("android")) os = "Android";
        else if (ua.contains("iphone") || ua.contains("ios")) os = "iOS";
        else if (ua.contains("linux")) os = "Linux";

        String browser = "Unknown Browser";
        if (ua.contains("edg")) browser = "Edge";
        else if (ua.contains("chrome")) browser = "Chrome";
        else if (ua.contains("safari") && !ua.contains("chrome")) browser = "Safari";
        else if (ua.contains("firefox")) browser = "Firefox";

        return os + " · " + browser;
    }
}
