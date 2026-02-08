package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.common.RedisKeyFactory;
import com.ryan.myblog.event.NotificationEvent;
import com.ryan.myblog.model.dto.CommentSaveDTO;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.Comment;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.entity.UserLike;
import com.ryan.myblog.mapper.CommentMapper;
import com.ryan.myblog.mapper.UserLikeMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.CommentService;
import com.ryan.myblog.service.CommentCountService;
import com.ryan.myblog.service.CacheService;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.service.UnifiedCacheService;
import com.ryan.myblog.utils.SecurityUtils;
import com.ryan.myblog.model.vo.CommentVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 评论服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentMapper commentMapper;
    private final UserMapper userMapper;
    private final UserLikeMapper userLikeMapper;
    private final CommentCountService commentCountService;
    private final CacheService cacheService;
    private final SecurityUtils securityUtils;
    private final BlogMapper blogMapper;
    private final UnifiedCacheService unifiedCacheService;
    private final UserService userService;
    private final BlogService blogService;
    private final ApplicationEventPublisher eventPublisher;
    private final com.ryan.myblog.service.UserBlockService userBlockService;

    @Override
    @Transactional
    public void saveComment(CommentSaveDTO commentSaveDTO, Long userId) {
        validateCommentSpam(commentSaveDTO, userId);

        Comment comment = new Comment();
        comment.setBlogId(commentSaveDTO.getBlogId());
        comment.setUserId(userId);
        comment.setContent(commentSaveDTO.getContent());

        Comment parentComment = null;

        // 处理父评论ID：如果为0，则设置为null（顶级评论）
        if (commentSaveDTO.getParentId() != null && commentSaveDTO.getParentId() > 0) {
            parentComment = commentMapper.selectById(commentSaveDTO.getParentId());
            if (parentComment == null) {
                throw new RuntimeException("父评论不存在");
            }
            if (!parentComment.getBlogId().equals(commentSaveDTO.getBlogId())) {
                throw new RuntimeException("父评论不属于该博客");
            }
            comment.setParentId(parentComment.getId());
        } else {
            comment.setParentId(null);
        }

        Long replyUserId = commentSaveDTO.getReplyUserId();
        if (comment.getParentId() != null && replyUserId == null && parentComment != null) {
            replyUserId = parentComment.getUserId();
        }
        comment.setReplyUserId(replyUserId);
        comment.setStatus(1); // 默认通过审核，如需要审核可设为0
        comment.setCreateTime(LocalDateTime.now());
        comment.setUpdateTime(LocalDateTime.now());

        commentMapper.insert(comment);

        // 更新 Redis 评论数 (+1)
        commentCountService.incrementCommentCount(commentSaveDTO.getBlogId());

        // 发送通知
        publishCommentNotification(comment, userId);
        publishMentionNotifications(comment, userId);

        // 清除博客列表缓存
        clearBlogCaches();
    }

    /**
     * 发布评论通知
     */
    private void publishCommentNotification(Comment comment, Long senderId) {
        try {
            Blog blog = blogMapper.selectById(comment.getBlogId());
            if (blog == null)
                return;

            User sender = userMapper.selectById(senderId);
            String senderName = sender != null ? sender.getNickname() : "有人";

            log.info("准备处理通知逻辑: senderId={}, authorId={}, isParent={}", senderId, blog.getAuthorId(),
                    comment.getParentId() != null);
            if (comment.getParentId() != null) {
                // 回复评论 - 通知被回复者
                Comment parentComment = commentMapper.selectById(comment.getParentId());
                if (parentComment != null && !parentComment.getUserId().equals(senderId)) {
                    log.info("发送回复通知给 userId={}", parentComment.getUserId());
                    NotificationEvent event = NotificationEvent.replyEvent(
                            this,
                            parentComment.getUserId(),
                            senderId,
                            comment.getContent(),
                            comment.getId(),
                            java.util.Map.of(
                                    "blogId", blog.getId(),
                                    "blogTitle", blog.getTitle(),
                                    "commentContent", comment.getContent().length() > 100
                                            ? comment.getContent().substring(0, 100) + "..."
                                            : comment.getContent()));
                    eventPublisher.publishEvent(event);
                }
            } else {
                // 顶级评论 - 通知文章作者
                if (!blog.getAuthorId().equals(senderId)) {
                    log.info("发送文章评论通知给作者 userId={}", blog.getAuthorId());
                    NotificationEvent event = NotificationEvent.commentEvent(
                            this,
                            blog.getAuthorId(),
                            senderId,
                            blog.getTitle(),
                            comment.getContent(),
                            blog.getId(),
                            java.util.Map.of(
                                    "commentContent", comment.getContent().length() > 100
                                            ? comment.getContent().substring(0, 100) + "..."
                                            : comment.getContent()));
                    eventPublisher.publishEvent(event);
                    log.info("事件已发布");
                } else {
                    log.info("作者给自己评论，不发通知: authorId={}, senderId={}", blog.getAuthorId(), senderId);
                }
            }
        } catch (Exception e) {
            log.warn("发送评论通知失败: {}", e.getMessage(), e);
        }
    }

    /**
     * @提及通知
     */
    private void publishMentionNotifications(Comment comment, Long senderId) {
        try {
            if (comment.getContent() == null || comment.getContent().isBlank()) {
                return;
            }
            java.util.Set<String> mentions = extractMentions(comment.getContent());
            if (mentions.isEmpty()) {
                return;
            }
            for (String name : mentions) {
                User mentioned = userMapper.selectByUsername(name);
                if (mentioned == null) {
                    mentioned = userMapper.selectByNickname(name);
                }
                if (mentioned == null || mentioned.getId().equals(senderId)) {
                    continue;
                }
                NotificationEvent event = NotificationEvent.mentionEvent(
                        this,
                        mentioned.getId(),
                        senderId,
                        comment.getContent(),
                        comment.getId(),
                        java.util.Map.of("blogId", comment.getBlogId(), "mention", name));
                eventPublisher.publishEvent(event);
            }
        } catch (Exception e) {
            log.warn("发送@提及通知失败: {}", e.getMessage(), e);
        }
    }

    private java.util.Set<String> extractMentions(String content) {
        java.util.Set<String> result = new java.util.HashSet<>();
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("@([\\w\\-\\u4e00-\\u9fa5]{1,20})");
        java.util.regex.Matcher matcher = pattern.matcher(content);
        while (matcher.find()) {
            result.add(matcher.group(1));
        }
        return result;
    }

    private void validateCommentSpam(CommentSaveDTO commentSaveDTO, Long userId) {
        if (userId == null) {
            return;
        }
        String content = commentSaveDTO.getContent() != null ? commentSaveDTO.getContent().trim() : "";
        if (content.isEmpty()) {
            throw new RuntimeException("评论内容不能为空");
        }
        String hash = Integer.toHexString(content.hashCode());
        String duplicateKey = String.format("comment:spam:%d:%d:%s", userId, commentSaveDTO.getBlogId(), hash);
        if (cacheService.exists(duplicateKey)) {
            throw new RuntimeException("请不要重复提交相同内容");
        }
        cacheService.set(duplicateKey, 1, 60);

        String rateKey = String.format("comment:rate:%d", userId);
        long count = cacheService.increment(rateKey);
        if (count == 1) {
            cacheService.expire(rateKey, 60);
        }
        if (count > 10) {
            throw new RuntimeException("评论过于频繁，请稍后再试");
        }
    }

    @Override
    public List<CommentVO> getCommentTree(Long blogId, Integer status) {
        // 查询所有评论
        LambdaQueryWrapper<Comment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Comment::getBlogId, blogId);
        if (status != null) {
            wrapper.eq(Comment::getStatus, status);
        }
        wrapper.orderByAsc(Comment::getCreateTime);

        List<Comment> comments = commentMapper.selectList(wrapper);
        if (CollectionUtils.isEmpty(comments)) {
            return new ArrayList<>();
        }

        // 屏蔽用户过滤
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            List<Long> blockedUserIds = userBlockService.getBlockedUserIds(currentUserId);
            if (!blockedUserIds.isEmpty()) {
                comments = comments.stream()
                        .filter(comment -> !blockedUserIds.contains(comment.getUserId()))
                        .collect(Collectors.toList());
            }
        }

        // 获取所有用户信息
        List<Long> userIds = extractCommentUserIds(comments);

        List<User> users = userMapper.selectBatchIds(userIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        // 转换为VO
        List<CommentVO> commentVOs = comments.stream()
                .map(comment -> convertToVO(comment, userMap))
                .collect(Collectors.toList());

        // 构建树形结构
        return buildCommentFlatTree(commentVOs);
    }

    @Override
    public IPage<CommentVO> getCommentPage(PageRequest pageRequest, Long blogId, Integer status, String keyword) {
        Page<Comment> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        IPage<Comment> commentPage = commentMapper.selectCommentPage(page, blogId, status, keyword);

        if (CollectionUtils.isEmpty(commentPage.getRecords())) {
            return new Page<>(pageRequest.getPage(), pageRequest.getSize());
        }

        // 屏蔽用户过滤
        Long currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId != null) {
            List<Long> blockedUserIds = userBlockService.getBlockedUserIds(currentUserId);
            if (!blockedUserIds.isEmpty()) {
                commentPage.setRecords(commentPage.getRecords().stream()
                        .filter(comment -> !blockedUserIds.contains(comment.getUserId()))
                        .collect(Collectors.toList()));
            }
        }

        // 获取用户信息
        List<Long> userIds = extractCommentUserIds(commentPage.getRecords());

        List<User> users = userMapper.selectBatchIds(userIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        // 转换为VO
        List<CommentVO> commentVOs = commentPage.getRecords().stream()
                .map(comment -> convertToVO(comment, userMap))
                .collect(Collectors.toList());

        Page<CommentVO> voPage = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        voPage.setRecords(commentVOs);
        voPage.setTotal(commentPage.getTotal());

        return voPage;
    }

    @Override
    public IPage<CommentVO> getCommentTreePage(PageRequest pageRequest, Long blogId, Integer status) {
        Page<Comment> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        IPage<Comment> rootPage = commentMapper.selectRootCommentPage(page, blogId, status);

        if (CollectionUtils.isEmpty(rootPage.getRecords())) {
            return new Page<>(pageRequest.getPage(), pageRequest.getSize());
        }

        // 屏蔽用户过滤
        Long currentUserId = SecurityUtils.getCurrentUserId();
        List<Long> blockedUserIds = currentUserId != null
            ? userBlockService.getBlockedUserIds(currentUserId)
            : Collections.emptyList();
        if (!blockedUserIds.isEmpty()) {
            rootPage.setRecords(rootPage.getRecords().stream()
                .filter(comment -> !blockedUserIds.contains(comment.getUserId()))
                .collect(Collectors.toList()));
        }

        List<Long> rootIds = rootPage.getRecords().stream()
                .map(Comment::getId)
                .collect(Collectors.toList());

        if (rootIds.isEmpty()) {
            Page<CommentVO> emptyPage = new Page<>(pageRequest.getPage(), pageRequest.getSize());
            emptyPage.setTotal(rootPage.getTotal());
            return emptyPage;
        }

        List<Comment> descendantComments = fetchAllDescendants(rootIds, blogId, status);

        List<Comment> allComments = new ArrayList<>();
        allComments.addAll(rootPage.getRecords());
        allComments.addAll(descendantComments);

        if (!blockedUserIds.isEmpty()) {
            allComments = allComments.stream()
                    .filter(comment -> !blockedUserIds.contains(comment.getUserId()))
                    .collect(Collectors.toList());
        }

        List<Long> userIds = extractCommentUserIds(allComments);
        List<User> users = userMapper.selectBatchIds(userIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        List<CommentVO> commentVOs = allComments.stream()
                .map(comment -> convertToVO(comment, userMap))
                .collect(Collectors.toList());

        List<CommentVO> rootCommentVOs = buildCommentFlatTree(commentVOs);

        Page<CommentVO> voPage = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        voPage.setRecords(rootCommentVOs);
        voPage.setTotal(rootPage.getTotal());

        return voPage;
    }

    @Override
    public void auditComment(Long id, Integer status, Long operatorId) {
        Comment comment = commentMapper.selectById(id);
        if (comment == null) {
            throw new RuntimeException("评论不存在");
        }

        comment.setStatus(status);
        comment.setUpdateTime(LocalDateTime.now());
        commentMapper.updateById(comment);
    }

    @Override
    @Transactional
    public void deleteComment(Long id, Long operatorId) {
        Comment comment = commentMapper.selectById(id);
        if (comment == null) {
            throw new RuntimeException("评论不存在");
        }

        // 检查权限：只有评论者本人或管理员可以删除
        User operator = userMapper.selectById(operatorId);
        if (!comment.getUserId().equals(operatorId) &&
                (operator == null || operator.getRole() != 1)) {
            throw new RuntimeException("无权限删除此评论");
        }

        commentMapper.deleteById(id);

        // 更新 Redis 评论数 (-1)
        commentCountService.decrementCommentCount(comment.getBlogId());

        // 清除博客列表缓存
        clearBlogCaches();
    }

    @Override
    @Transactional
    public void toggleCommentLike(Long id, Long userId) {
        // 检查评论是否存在
        Comment comment = commentMapper.selectById(id);
        if (comment == null) {
            throw new RuntimeException("评论不存在");
        }

        // 查询用户点赞记录
        UserLike existingLike = userLikeMapper.selectByUserAndTarget(userId, "comment", id);

        if (existingLike == null) {
            // 第一次点赞，创建点赞记录
            UserLike newLike = new UserLike();
            newLike.setUserId(userId);
            newLike.setTargetType("comment");
            newLike.setTargetId(id);
            newLike.setStatus(1); // 点赞
            newLike.setCreateTime(LocalDateTime.now());
            newLike.setUpdateTime(LocalDateTime.now());
            userLikeMapper.insert(newLike);

            log.info("用户 {} 点赞评论 {}", userId, id);
        } else {
            // 已有点赞记录，切换状态
            Integer newStatus = existingLike.getStatus() == 1 ? 0 : 1;
            existingLike.setStatus(newStatus);
            existingLike.setUpdateTime(LocalDateTime.now());
            userLikeMapper.updateById(existingLike);

            // 记录日志
            if (newStatus == 1) {
                log.info("用户 {} 重新点赞评论 {}", userId, id);
            } else {
                log.info("用户 {} 取消点赞评论 {}", userId, id);
            }
        }
    }

    @Override
    public CommentVO getCommentById(Long id) {
        Comment comment = commentMapper.selectById(id);
        if (comment == null) {
            return null;
        }

        List<Long> userIds = new ArrayList<>();
        userIds.add(comment.getUserId());
        if (comment.getReplyUserId() != null) {
            userIds.add(comment.getReplyUserId());
        }
        List<User> users = userMapper.selectBatchIds(userIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        return convertToVO(comment, userMap);
    }

    @Override
    public Long countCommentsByBlogId(Long blogId) {
        LambdaQueryWrapper<Comment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Comment::getBlogId, blogId);
        wrapper.eq(Comment::getStatus, 1); // 只统计已通过审核的评论
        return commentMapper.selectCount(wrapper);
    }

    @Override
    public IPage<CommentVO> getCommentsByUser(PageRequest pageRequest, Long userId) {
        Page<Comment> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        IPage<Comment> commentPage = commentMapper.selectCommentsByUser(page, userId);

        if (CollectionUtils.isEmpty(commentPage.getRecords())) {
            return new Page<>(pageRequest.getPage(), pageRequest.getSize());
        }

        // 获取用户信息
        List<Long> userIds = extractCommentUserIds(commentPage.getRecords());

        List<User> users = userMapper.selectBatchIds(userIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        // 转换为VO
        List<CommentVO> commentVOs = commentPage.getRecords().stream()
                .map(comment -> {
                    CommentVO vo = convertToVO(comment, userMap);
                    // 设置博客标题（已在SQL查询中获取）
                    vo.setBlogTitle(comment.getBlogTitle());
                    return vo;
                })
                .collect(Collectors.toList());

        Page<CommentVO> voPage = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        voPage.setRecords(commentVOs);
        voPage.setTotal(commentPage.getTotal());

        return voPage;
    }

    /**
     * 将Comment实体转换为CommentVO
     */
    private CommentVO convertToVO(Comment comment, Map<Long, User> userMap) {
        CommentVO vo = new CommentVO();
        vo.setId(comment.getId());
        vo.setBlogId(comment.getBlogId());
        vo.setUserId(comment.getUserId());
        vo.setParentId(comment.getParentId());
        vo.setReplyUserId(comment.getReplyUserId());
        vo.setContent(comment.getContent());

        // 实时查询点赞数
        Long likeCountLong = userLikeMapper.countByTarget("comment", comment.getId());
        vo.setLikeCount(likeCountLong != null ? likeCountLong.intValue() : 0);

        // 查询当前用户是否点赞了该评论
        Long currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId != null) {
            // 检查当前用户是否点赞
            UserLike userLike = userLikeMapper.selectByUserAndTarget(
                    currentUserId,
                    "comment",
                    comment.getId());
            vo.setIsLiked(userLike != null && userLike.getStatus() == 1);
        } else {
            vo.setIsLiked(false);
        }

        vo.setCreateTime(comment.getCreateTime());

        // 设置用户信息
        User user = userMap.get(comment.getUserId());
        if (user != null) {
            vo.setUsername(user.getUsername());
            vo.setNickname(user.getNickname());
            vo.setAvatar(user.getAvatar());
        }

        // 设置回复用户昵称
        if (comment.getReplyUserId() != null) {
            User replyUser = userMap.get(comment.getReplyUserId());
            if (replyUser != null) {
                vo.setReplyUserNickname(replyUser.getNickname());
            }
        }

        return vo;
    }

    /**
     * 构建评论树形结构
     */
    private List<CommentVO> buildCommentFlatTree(List<CommentVO> comments) {
        Map<Long, CommentVO> commentMap = comments.stream()
                .collect(Collectors.toMap(CommentVO::getId, comment -> comment));
        List<CommentVO> roots = comments.stream()
                .filter(comment -> comment.getParentId() == null)
                .collect(Collectors.toList());

        Map<Long, List<CommentVO>> replyMap = comments.stream()
                .filter(comment -> comment.getParentId() != null)
                .map(comment -> Map.entry(resolveRootId(comment, commentMap), comment))
                .filter(entry -> entry.getKey() != null)
                .collect(Collectors.groupingBy(Map.Entry::getKey,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));

        for (CommentVO root : roots) {
            List<CommentVO> replies = replyMap.getOrDefault(root.getId(), new ArrayList<>());
            replies.sort((left, right) -> {
                if (left.getCreateTime() == null && right.getCreateTime() == null) {
                    return 0;
                }
                if (left.getCreateTime() == null) {
                    return -1;
                }
                if (right.getCreateTime() == null) {
                    return 1;
                }
                return left.getCreateTime().compareTo(right.getCreateTime());
            });
            root.setReplies(replies);
            root.setReplyCount(replies.size());
            root.setChildren(null);
        }

        return roots;
    }

    private Long resolveRootId(CommentVO comment, Map<Long, CommentVO> commentMap) {
        CommentVO current = comment;
        int guard = 0;
        while (current != null && current.getParentId() != null && guard < 20) {
            current = commentMap.get(current.getParentId());
            guard += 1;
        }
        return current != null ? current.getId() : null;
    }

    private List<Long> extractCommentUserIds(List<Comment> comments) {
        return comments.stream()
                .flatMap(comment -> {
                    List<Long> ids = new ArrayList<>();
                    ids.add(comment.getUserId());
                    if (comment.getReplyUserId() != null) {
                        ids.add(comment.getReplyUserId());
                    }
                    return ids.stream();
                })
                .distinct()
                .collect(Collectors.toList());
    }

    private List<Comment> fetchRepliesByParentIds(List<Long> parentIds, Long blogId, Integer status) {
        if (parentIds == null || parentIds.isEmpty()) {
            return new ArrayList<>();
        }
        LambdaQueryWrapper<Comment> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(Comment::getParentId, parentIds);
        wrapper.eq(Comment::getBlogId, blogId);
        if (status != null) {
            wrapper.eq(Comment::getStatus, status);
        }
        wrapper.orderByAsc(Comment::getCreateTime);
        return commentMapper.selectList(wrapper);
    }

    private List<Comment> fetchAllDescendants(List<Long> rootIds, Long blogId, Integer status) {
        List<Comment> result = new ArrayList<>();
        List<Long> parentIds = new ArrayList<>(rootIds);
        while (!parentIds.isEmpty()) {
            List<Comment> batch = fetchRepliesByParentIds(parentIds, blogId, status);
            if (batch.isEmpty()) {
                break;
            }
            result.addAll(batch);
            parentIds = batch.stream()
                    .map(Comment::getId)
                    .collect(Collectors.toList());
        }
        return result;
    }

    /**
     * 清除博客列表相关缓存
     */
    private void clearBlogCaches() {
        unifiedCacheService.deleteByPattern(RedisKeyFactory.BLOG_LATEST_LIST);
        unifiedCacheService.deleteByPattern(RedisKeyFactory.BLOG_HOT_LIST);
        cacheService.deleteByPattern("blog:page:*");
    }
}
