package com.ryan.myblog.ai.memory;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageResult;
import com.ryan.myblog.mapper.AiConversationMapper;
import com.ryan.myblog.mapper.AiMessageMapper;
import com.ryan.myblog.model.entity.AiConversation;
import com.ryan.myblog.model.entity.AiMessage;
import com.ryan.myblog.model.vo.AiConversationVO;
import com.ryan.myblog.model.vo.AiMessageVO;
import com.ryan.myblog.service.CacheService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiConversationMemoryServiceImpl implements AiConversationMemoryService {

    private static final int ACTIVE_STATUS = 1;
    private static final int DELETED_STATUS = 0;
    private static final int RECENT_MESSAGE_LIMIT = 12;
    private static final int SUMMARY_TRIGGER_MESSAGES = 24;
    private static final int SUMMARY_MAX_CHARS = 1800;
    private static final int MESSAGE_MAX_CHARS = 6000;
    private static final long CACHE_TTL_SECONDS = 24 * 60 * 60L;
    private static final String CACHE_PREFIX = "ai:conversation:";

    private final AiConversationMapper aiConversationMapper;
    private final AiMessageMapper aiMessageMapper;
    private final CacheService cacheService;

    @Override
    @Transactional
    public ConversationContext loadOrCreate(String conversationId, Long userId, String firstQuestion) {
        String resolvedId = hasText(conversationId) ? conversationId : UUID.randomUUID().toString();
        AiConversation conversation = findConversation(resolvedId, userId);
        if (conversation == null) {
            conversation = new AiConversation();
            conversation.setConversationId(resolvedId);
            conversation.setUserId(userId);
            conversation.setTitle(buildTitle(firstQuestion));
            conversation.setSummary("");
            conversation.setStatus(ACTIVE_STATUS);
            aiConversationMapper.insert(conversation);
        }
        ConversationCache cached = cacheService.get(cacheKey(resolvedId), ConversationCache.class);
        if (cached != null) {
            return new ConversationContext(resolvedId, userId, cached.getSummary(), cached.getRecentMessages());
        }
        ConversationContext context = loadFromDatabase(conversation);
        cacheContext(context);
        return context;
    }

    @Override
    @Transactional
    public AiMessage appendMessage(String conversationId, String role, String content) {
        AiMessage message = new AiMessage();
        message.setConversationId(conversationId);
        message.setRole(role);
        message.setContent(truncate(content, MESSAGE_MAX_CHARS));
        message.setTokenEstimate(estimateTokens(content));
        aiMessageMapper.insert(message);
        evict(conversationId);
        return message;
    }

    @Override
    @Transactional
    public void refreshConversation(String conversationId, String latestAnswer) {
        AiConversation conversation = findConversationById(conversationId);
        if (conversation == null) {
            return;
        }
        List<AiMessage> messages = selectMessages(conversationId, 200, false);
        if (messages.size() > SUMMARY_TRIGGER_MESSAGES) {
            conversation.setSummary(buildRollingSummary(conversation.getSummary(), messages));
        }
        conversation.setUpdateTime(LocalDateTime.now());
        aiConversationMapper.updateById(conversation);
        cacheContext(loadFromDatabase(conversation));
    }

    @Override
    public PageResult<AiConversationVO> listUserConversations(Long userId, int page, int size) {
        Page<AiConversation> result = aiConversationMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<AiConversation>()
                        .eq(AiConversation::getUserId, userId)
                        .eq(AiConversation::getStatus, ACTIVE_STATUS)
                        .orderByDesc(AiConversation::getUpdateTime));
        return PageResult.of(result.getRecords().stream().map(item -> toVO(item, false)).toList(),
                result.getTotal(), result.getCurrent(), result.getSize());
    }

    @Override
    public AiConversationVO getUserConversation(Long userId, String conversationId) {
        AiConversation conversation = findConversation(conversationId, userId);
        return conversation == null ? null : toVO(conversation, true);
    }

    @Override
    @Transactional
    public void deleteUserConversation(Long userId, String conversationId) {
        AiConversation conversation = findConversation(conversationId, userId);
        if (conversation == null) {
            return;
        }
        conversation.setStatus(DELETED_STATUS);
        aiConversationMapper.updateById(conversation);
        evict(conversationId);
    }

    @Override
    public PageResult<AiConversationVO> listAdminConversations(int page, int size) {
        Page<AiConversation> result = aiConversationMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<AiConversation>()
                        .eq(AiConversation::getStatus, ACTIVE_STATUS)
                        .orderByDesc(AiConversation::getUpdateTime));
        return PageResult.of(result.getRecords().stream().map(item -> toVO(item, false)).toList(),
                result.getTotal(), result.getCurrent(), result.getSize());
    }

    private ConversationContext loadFromDatabase(AiConversation conversation) {
        return new ConversationContext(conversation.getConversationId(), conversation.getUserId(),
                conversation.getSummary(), selectMessages(conversation.getConversationId(), RECENT_MESSAGE_LIMIT, true));
    }

    private List<AiMessage> selectMessages(String conversationId, int limit, boolean asc) {
        List<AiMessage> messages = aiMessageMapper.selectList(new LambdaQueryWrapper<AiMessage>()
                .eq(AiMessage::getConversationId, conversationId)
                .orderByDesc(AiMessage::getCreateTime)
                .last("LIMIT " + Math.max(1, limit)));
        if (asc) {
            Collections.reverse(messages);
        }
        return messages;
    }

    private AiConversation findConversation(String conversationId, Long userId) {
        if (!hasText(conversationId)) {
            return null;
        }
        return aiConversationMapper.selectOne(new LambdaQueryWrapper<AiConversation>()
                .eq(AiConversation::getConversationId, conversationId)
                .eq(userId != null, AiConversation::getUserId, userId)
                .isNull(userId == null, AiConversation::getUserId)
                .eq(AiConversation::getStatus, ACTIVE_STATUS));
    }

    private AiConversation findConversationById(String conversationId) {
        if (!hasText(conversationId)) {
            return null;
        }
        return aiConversationMapper.selectOne(new LambdaQueryWrapper<AiConversation>()
                .eq(AiConversation::getConversationId, conversationId)
                .eq(AiConversation::getStatus, ACTIVE_STATUS));
    }

    private void cacheContext(ConversationContext context) {
        ConversationCache cache = new ConversationCache();
        cache.setConversationId(context.conversationId());
        cache.setSummary(context.summary());
        cache.setRecentMessages(new ArrayList<>(context.recentMessages()));
        cacheService.set(cacheKey(context.conversationId()), cache, CACHE_TTL_SECONDS);
    }

    private void evict(String conversationId) {
        cacheService.delete(cacheKey(conversationId));
    }

    private String buildRollingSummary(String existingSummary, List<AiMessage> messages) {
        StringBuilder summary = new StringBuilder();
        if (hasText(existingSummary)) {
            summary.append(existingSummary).append("\n");
        }
        int keepFrom = Math.max(0, messages.size() - RECENT_MESSAGE_LIMIT);
        for (int i = 0; i < keepFrom; i++) {
            AiMessage msg = messages.get(i);
            summary.append("[").append(msg.getRole()).append("] ")
                    .append(truncate(msg.getContent(), 240))
                    .append("\n");
        }
        return truncate(summary.toString().trim(), SUMMARY_MAX_CHARS);
    }

    private AiConversationVO toVO(AiConversation conversation, boolean includeMessages) {
        return AiConversationVO.builder()
                .conversationId(conversation.getConversationId())
                .userId(conversation.getUserId())
                .title(conversation.getTitle())
                .summary(conversation.getSummary())
                .status(conversation.getStatus())
                .createTime(conversation.getCreateTime())
                .updateTime(conversation.getUpdateTime())
                .messages(includeMessages ? selectMessages(conversation.getConversationId(), 100, true).stream()
                        .map(this::toMessageVO)
                        .toList() : List.of())
                .build();
    }

    private AiMessageVO toMessageVO(AiMessage message) {
        return AiMessageVO.builder()
                .id(message.getId())
                .role(message.getRole())
                .content(message.getContent())
                .tokenEstimate(message.getTokenEstimate())
                .createTime(message.getCreateTime())
                .build();
    }

    private static String buildTitle(String question) {
        String title = truncate(question, 36);
        return hasText(title) ? title : "新的 AI 对话";
    }

    private static int estimateTokens(String content) {
        return Math.max(1, (content == null ? 0 : content.length()) / 4);
    }

    private static String cacheKey(String conversationId) {
        return CACHE_PREFIX + conversationId;
    }

    private static String truncate(String text, int maxChars) {
        if (text == null || text.length() <= maxChars) {
            return text;
        }
        return text.substring(0, maxChars);
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    @Data
    public static class ConversationCache {
        private String conversationId;
        private String summary;
        private List<AiMessage> recentMessages = List.of();
    }
}
