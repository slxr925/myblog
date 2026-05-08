package com.ryan.myblog.ai.observability;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageResult;
import com.ryan.myblog.mapper.AiRequestLogMapper;
import com.ryan.myblog.mapper.AiToolCallMapper;
import com.ryan.myblog.model.entity.AiRequestLog;
import com.ryan.myblog.model.entity.AiToolCall;
import com.ryan.myblog.model.vo.AiObservabilityStatsVO;
import com.ryan.myblog.model.vo.AiRequestLogVO;
import com.ryan.myblog.model.vo.AiToolCallVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiObservabilityServiceImpl implements AiObservabilityService {

    private static final int MAX_TEXT_CHARS = 1000;

    private final AiRequestLogMapper aiRequestLogMapper;
    private final AiToolCallMapper aiToolCallMapper;

    @Override
    public void recordRequest(AiRequestEvent event) {
        try {
            AiRequestLog log = new AiRequestLog();
            log.setRequestId(event.requestId());
            log.setConversationId(event.conversationId());
            log.setUserId(event.userId());
            log.setAction(event.action());
            log.setStatus(event.status());
            log.setPromptKey(event.promptKey());
            log.setPromptVersion(event.promptVersion());
            log.setModel(event.model());
            log.setPromptChars(event.promptChars());
            log.setResultChars(event.resultChars());
            log.setToolCallCount(event.toolCallCount());
            log.setElapsedMs(event.elapsedMs());
            log.setErrorMessage(truncate(event.errorMessage()));
            aiRequestLogMapper.insert(log);
        } catch (Exception e) {
            log.warn("记录AI请求日志失败: {}", e.getMessage());
        }
    }

    @Override
    public void recordToolCall(AiToolCallEvent event) {
        try {
            AiToolCall call = new AiToolCall();
            call.setConversationId(event.conversationId());
            call.setMessageId(event.messageId());
            call.setToolName(event.toolName());
            call.setArgumentsJson(truncate(event.argumentsJson()));
            call.setResultSummary(truncate(event.resultSummary()));
            call.setStatus(event.status());
            call.setElapsedMs(event.elapsedMs());
            call.setErrorMessage(truncate(event.errorMessage()));
            aiToolCallMapper.insert(call);
        } catch (Exception e) {
            log.warn("记录AI工具调用失败: {}", e.getMessage());
        }
    }

    @Override
    public PageResult<AiRequestLogVO> listRequests(int page, int size, String status) {
        Page<AiRequestLog> requestPage = aiRequestLogMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<AiRequestLog>()
                        .eq(hasText(status), AiRequestLog::getStatus, status)
                        .orderByDesc(AiRequestLog::getCreateTime));
        List<AiRequestLogVO> records = requestPage.getRecords().stream().map(this::toRequestVO).toList();
        return PageResult.of(records, requestPage.getTotal(), requestPage.getCurrent(), requestPage.getSize());
    }

    @Override
    public PageResult<AiToolCallVO> listToolCalls(int page, int size, String status) {
        Page<AiToolCall> callPage = aiToolCallMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<AiToolCall>()
                        .eq(hasText(status), AiToolCall::getStatus, status)
                        .orderByDesc(AiToolCall::getCreateTime));
        List<AiToolCallVO> records = callPage.getRecords().stream().map(this::toToolCallVO).toList();
        return PageResult.of(records, callPage.getTotal(), callPage.getCurrent(), callPage.getSize());
    }

    @Override
    public AiObservabilityStatsVO getStats(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(Math.max(1, days));
        List<AiRequestLog> requests = aiRequestLogMapper.selectList(new LambdaQueryWrapper<AiRequestLog>()
                .ge(AiRequestLog::getCreateTime, since));
        List<AiToolCall> calls = aiToolCallMapper.selectList(new LambdaQueryWrapper<AiToolCall>()
                .ge(AiToolCall::getCreateTime, since));
        long success = requests.stream().filter(item -> "success".equalsIgnoreCase(item.getStatus())).count();
        long errors = requests.stream().filter(item -> "error".equalsIgnoreCase(item.getStatus())).count();
        double avg = requests.stream()
                .filter(item -> item.getElapsedMs() != null)
                .mapToLong(AiRequestLog::getElapsedMs)
                .average()
                .orElse(0.0d);
        long toolErrors = calls.stream().filter(item -> "error".equalsIgnoreCase(item.getStatus())).count();
        return AiObservabilityStatsVO.builder()
                .requestCount((long) requests.size())
                .successCount(success)
                .errorCount(errors)
                .averageElapsedMs(avg)
                .toolCallCount((long) calls.size())
                .toolErrorCount(toolErrors)
                .build();
    }

    private AiRequestLogVO toRequestVO(AiRequestLog log) {
        return AiRequestLogVO.builder()
                .id(log.getId())
                .requestId(log.getRequestId())
                .conversationId(log.getConversationId())
                .userId(log.getUserId())
                .action(log.getAction())
                .status(log.getStatus())
                .promptKey(log.getPromptKey())
                .promptVersion(log.getPromptVersion())
                .model(log.getModel())
                .promptChars(log.getPromptChars())
                .resultChars(log.getResultChars())
                .toolCallCount(log.getToolCallCount())
                .elapsedMs(log.getElapsedMs())
                .errorMessage(log.getErrorMessage())
                .createTime(log.getCreateTime())
                .build();
    }

    private AiToolCallVO toToolCallVO(AiToolCall call) {
        return AiToolCallVO.builder()
                .id(call.getId())
                .conversationId(call.getConversationId())
                .messageId(call.getMessageId())
                .toolName(call.getToolName())
                .argumentsJson(call.getArgumentsJson())
                .resultSummary(call.getResultSummary())
                .status(call.getStatus())
                .elapsedMs(call.getElapsedMs())
                .errorMessage(call.getErrorMessage())
                .createTime(call.getCreateTime())
                .build();
    }

    private static String truncate(String text) {
        if (text == null || text.length() <= MAX_TEXT_CHARS) {
            return text;
        }
        return text.substring(0, MAX_TEXT_CHARS);
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
