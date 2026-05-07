package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.OpenAiConfigUpdateDTO;
import com.ryan.myblog.model.vo.OpenAiConfigVO;
import com.ryan.myblog.model.vo.RagStatusVO;
import com.ryan.myblog.service.BlogRagService;
import com.ryan.myblog.service.OpenAiRuntimeConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 后台OpenAI运行期配置接口。
 */
@RestController
@RequestMapping("/api/admin/openai-config")
@RequiredArgsConstructor
@Slf4j
public class AdminOpenAiConfigController {

    private final OpenAiRuntimeConfigService openAiRuntimeConfigService;
    private final BlogRagService blogRagService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<OpenAiConfigVO> getConfig() {
        return Result.success("获取OpenAI配置成功", enrichRagStatus(openAiRuntimeConfigService.getConfig()));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<OpenAiConfigVO> updateConfig(@Valid @RequestBody OpenAiConfigUpdateDTO updateDTO) {
        try {
            OpenAiConfigVO config = enrichRagStatus(openAiRuntimeConfigService.updateConfig(updateDTO));
            return Result.success("OpenAI配置已更新", config);
        } catch (Exception e) {
            log.error("更新OpenAI配置失败", e);
            return Result.error("更新OpenAI配置失败: " + e.getMessage());
        }
    }

    @PostMapping("/rag/rebuild")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<RagStatusVO> rebuildRagIndex() {
        return Result.success("RAG索引重建任务已提交", blogRagService.rebuildAllAsync());
    }

    private OpenAiConfigVO enrichRagStatus(OpenAiConfigVO config) {
        try {
            RagStatusVO status = blogRagService.getStatus();
            config.setRagAvailable(status.getAvailable());
            config.setRagIndexName(status.getIndexName());
            config.setRagChunkCount(status.getChunkCount());
            config.setRagRebuilding(status.getRebuilding());
            config.setRagLastRebuildAt(status.getLastRebuildAt());
        } catch (Exception e) {
            log.warn("获取RAG状态失败: {}", e.getMessage());
        }
        return config;
    }
}
