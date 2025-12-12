package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.model.dto.CommentSaveDTO;
import com.ryan.myblog.model.entity.Comment;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.entity.UserLike;
import com.ryan.myblog.mapper.CommentMapper;
import com.ryan.myblog.mapper.UserLikeMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.service.CommentService;
import com.ryan.myblog.service.CacheService;
import com.ryan.myblog.model.vo.CommentVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final BlogMapper blogMapper;
    private final CacheService cacheService;

    @Override
    @Transactional
    public void saveComment(CommentSaveDTO commentSaveDTO, Long userId) {
        Comment comment = new Comment();
        comment.setBlogId(commentSaveDTO.getBlogId());
        comment.setUserId(userId);
        comment.setContent(commentSaveDTO.getContent());

        // 处理父评论ID：如果为0，则设置为null（顶级评论）
        if (commentSaveDTO.getParentId() != null && commentSaveDTO.getParentId() > 0) {
            comment.setParentId(commentSaveDTO.getParentId());
        } else {
            comment.setParentId(null);
        }

        comment.setReplyUserId(commentSaveDTO.getReplyUserId());
        comment.setStatus(1); // 默认通过审核，如需要审核可设为0
        comment.setLikeCount(0);
        comment.setCreateTime(LocalDateTime.now());
        comment.setUpdateTime(LocalDateTime.now());

        commentMapper.insert(comment);

        // 更新博客评论数
        blogMapper.incrementCommentCount(commentSaveDTO.getBlogId());

        // 清除博客列表缓存
        clearBlogCaches();
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

        // 获取所有用户信息
        List<Long> userIds = comments.stream()
                .map(Comment::getUserId)
                .distinct()
                .collect(Collectors.toList());

        List<User> users = userMapper.selectBatchIds(userIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        // 转换为VO
        List<CommentVO> commentVOs = comments.stream()
                .map(comment -> convertToVO(comment, userMap))
                .collect(Collectors.toList());

        // 构建树形结构
        return buildCommentTree(commentVOs);
    }

    @Override
    public IPage<CommentVO> getCommentPage(PageRequest pageRequest, Long blogId, Integer status, String keyword) {
        Page<Comment> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        IPage<Comment> commentPage = commentMapper.selectCommentPage(page, blogId, status, keyword);

        if (CollectionUtils.isEmpty(commentPage.getRecords())) {
            return new Page<>(pageRequest.getPage(), pageRequest.getSize());
        }

        // 获取用户信息
        List<Long> userIds = commentPage.getRecords().stream()
                .map(Comment::getUserId)
                .distinct()
                .collect(Collectors.toList());

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

        Long blogId = comment.getBlogId();
        commentMapper.deleteById(id);

        // 更新博客评论数
        blogMapper.decrementCommentCount(blogId);

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

            // 增加评论点赞数
            commentMapper.incrementLikeCount(id);

            log.info("用户 {} 点赞评论 {}", userId, id);
        } else {
            // 已有点赞记录，切换状态
            Integer newStatus = existingLike.getStatus() == 1 ? 0 : 1;
            existingLike.setStatus(newStatus);
            existingLike.setUpdateTime(LocalDateTime.now());
            userLikeMapper.updateById(existingLike);

            // 更新评论点赞数
            if (newStatus == 1) {
                // 之前是取消点赞，现在重新点赞
                commentMapper.incrementLikeCount(id);
                log.info("用户 {} 重新点赞评论 {}", userId, id);
            } else {
                // 之前是点赞，现在取消点赞
                commentMapper.decrementLikeCount(id);
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

        User user = userMapper.selectById(comment.getUserId());
        Map<Long, User> userMap = Map.of(user.getId(), user);

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
        IPage<Comment> commentPage = commentMapper.selectCommentsByUser(userId, page);

        if (CollectionUtils.isEmpty(commentPage.getRecords())) {
            return new Page<>(pageRequest.getPage(), pageRequest.getSize());
        }

        // 获取用户信息
        List<Long> userIds = commentPage.getRecords().stream()
                .map(Comment::getUserId)
                .distinct()
                .collect(Collectors.toList());

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
        vo.setStatus(comment.getStatus());
        vo.setLikeCount(comment.getLikeCount());
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
    private List<CommentVO> buildCommentTree(List<CommentVO> comments) {
        List<CommentVO> rootComments = new ArrayList<>();
        Map<Long, List<CommentVO>> childrenMap = comments.stream()
                .filter(comment -> comment.getParentId() != null)
                .collect(Collectors.groupingBy(CommentVO::getParentId));

        for (CommentVO comment : comments) {
            if (comment.getParentId() == null) {
                // 根评论
                comment.setChildren(childrenMap.get(comment.getId()));
                rootComments.add(comment);
            }
        }

        return rootComments;
    }

    /**
     * 清除博客列表相关缓存
     */
    private void clearBlogCaches() {
        cacheService.deleteByPattern("blog:latest:*");
        cacheService.deleteByPattern("blog:hot:*");
        cacheService.deleteByPattern("blog:page:*");
    }
}