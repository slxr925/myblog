package com.ryan.myblog.arthas;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

/**
 * Arthas HTTP API 客户端
 * 通过执行Arthas命令获取JVM诊断数据
 */
@Component
@Slf4j
public class ArthasApiClient {

    @Value("${arthas.httpPort:8563}")
    private int arthasPort;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 执行Arthas命令并返回原始输出
     * 
     * @param command Arthas命令（如 "dashboard", "thread", "jvm"）
     * @return 命令执行结果的原始文本
     */
    public String executeCommand(String command) {
        try {
            // 使用arthas-client命令行工具执行命令
            // 注意：这里简化实现，实际生产环境建议使用Arthas HTTP API
            String arthasCmd = String.format("curl -s http://localhost:%d/api -d 'action=exec&command=%s'",
                    arthasPort, command);

            Process process = Runtime.getRuntime().exec(new String[] { "/bin/sh", "-c", arthasCmd });
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            process.waitFor();

            return output.toString();
        } catch (Exception e) {
            log.error("执行Arthas命令失败: {}", command, e);
            return null;
        }
    }

    /**
     * 获取JVM基本信息
     */
    public Map<String, Object> getJvmInfo() {
        try {
            String output = executeCommand("jvm");
            return parseJvmOutput(output);
        } catch (Exception e) {
            log.error("获取JVM信息失败", e);
            return new HashMap<>();
        }
    }

    /**
     * 获取线程信息
     */
    public Map<String, Object> getThreadInfo() {
        try {
            String output = executeCommand("thread");
            return parseThreadOutput(output);
        } catch (Exception e) {
            log.error("获取线程信息失败", e);
            return new HashMap<>();
        }
    }

    /**
     * 获取Dashboard数据
     */
    public Map<String, Object> getDashboardData() {
        try {
            String output = executeCommand("dashboard -n 1");
            return parseDashboardOutput(output);
        } catch (Exception e) {
            log.error("获取Dashboard数据失败", e);
            return new HashMap<>();
        }
    }

    /**
     * 解析JVM命令输出
     */
    private Map<String, Object> parseJvmOutput(String output) {
        Map<String, Object> result = new HashMap<>();
        if (output == null || output.isEmpty()) {
            return result;
        }

        // 简化解析，提取关键信息
        // 实际实现需要根据Arthas输出格式详细解析
        result.put("raw", output);
        return result;
    }

    /**
     * 解析线程命令输出
     */
    private Map<String, Object> parseThreadOutput(String output) {
        Map<String, Object> result = new HashMap<>();
        if (output == null || output.isEmpty()) {
            return result;
        }

        result.put("raw", output);
        return result;
    }

    /**
     * 解析Dashboard命令输出
     */
    private Map<String, Object> parseDashboardOutput(String output) {
        Map<String, Object> result = new HashMap<>();
        if (output == null || output.isEmpty()) {
            return result;
        }

        result.put("raw", output);
        return result;
    }
}
