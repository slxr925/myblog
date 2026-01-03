package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ryan.myblog.common.PageResult;
import com.ryan.myblog.event.NotificationEvent;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.UserCollectionMapper;
import com.ryan.myblog.model.dto.CollectToggleDTO;
import com.ryan.myblog.model.dto.CollectResultDTO;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.UserCollection;
import com.ryan.myblog.model.vo.UserCollectionVO;
import com.ryan.myblog.service.CollectionFolderService;
import com.ryan.myblog.service.UserCollectionService;
import org.springframework.context.ApplicationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户收藏服务实现类
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserCollectionServiceImpl extends ServiceImpl<UserCollectionMapper, UserCollection>
        implements UserCollectionService {

    private final UserCollectionMapper userCollectionMapper;
    private final CollectionFolderService collectionFolderService;
    private final ApplicationEventPublisher eventPublisher;
    private final BlogMapper blogMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CollectResultDTO toggleCollection(Long userId, CollectToggleDTO dto) {
        // 检查是否已收藏
        LambdaQueryWrapper<UserCollection> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserCollection::getUserId, userId)
                .eq(UserCollection::getTargetType, dto.getTargetType())
                .eq(UserCollection::getTargetId, dto.getTargetId())
                .eq(UserCollection::getDeleted, 0);

        UserCollection existing = getOne(wrapper);

        if (existing != null \u0026\u0026 existing.getDeleted() == 0) {
            // 已收藏且未删除 -> 取消收藏
            userCollectionMapper.logicalDelete(existing.getId());
            // 更新原收藏夹计数
            collectionFolderService.updateCollectionCount(existing.getFolderId(), -1);
            return new CollectResultDTO(false, "取消收藏成功");
        } else {
            // 添加收藏（可能是新增或恢复已删除的记录）
            // 如果没有指定文件夹，使用默认文件夹
            Long folderId = dto.getFolderId();
            if (folderId == null) {
                folderId = collectionFolderService.getOrCreateDefaultFolder(userId).getId();
            }

            if (existing != null \u0026\u0026 existing.getDeleted() == 1) {
                // 恢复已删除的收藏记录
                existing.setDeleted(0);
                existing.setFolderId(folderId);
                existing.setNote(dto.getNote());
                existing.setUpdateTime(java.time.LocalDateTime.now());
                updateById(existing);
                log.info("恢复已删除的收藏记录: userId={}, targetId={}, id={}", 
                        userId, dto.getTargetId(), existing.getId());
            } else {
                // 新增收藏记录
                UserCollection collection = new UserCollection();
                collection.setUserId(userId);
                collection.setTargetType(dto.getTargetType());
                collection.setTargetId(dto.getTargetId());
                collection.setFolderId(folderId);
                collection.setNote(dto.getNote());
                save(collection);
            }

            // 更新收藏夹计数
            collectionFolderService.updateCollectionCount(folderId, 1);

            // 发送收藏通知给文章作者
            if ("blog".equals(dto.getTargetType())) {
                publishCollectionNotification(dto.getTargetId(), userId);
            }

            return new CollectResultDTO(true, "收藏成功", folderId);
        }
    }

    @Override
    public boolean checkCollected(Long userId, Long targetId, String targetType) {
        return userCollectionMapper.checkCollected(userId, targetType, targetId) > 0;
    }

    @Override
    public PageResult<UserCollectionVO> getUserCollections(Long userId, Long folderId, Integer page, Integer size) {
        Page<UserCollectionVO> pageParam = new Page<>(page, size);
        IPage<UserCollectionVO> result = userCollectionMapper.getUserCollectionsPage(pageParam, userId, folderId);

        return PageResult.of(
                result.getRecords(),
                result.getTotal(),
                result.getCurrent(),
                result.getSize());
    }

    @Override
    public PageResult<UserCollectionVO> getUserAllCollections(Long userId, Integer page, Integer size) {
        Page<UserCollectionVO> pageParam = new Page<>(page, size);
        IPage<UserCollectionVO> result = userCollectionMapper.getUserAllCollectionsPage(pageParam, userId);

        return PageResult.of(
                result.getRecords(),
                result.getTotal(),
                result.getCurrent(),
                result.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchMove(Long userId, Long targetFolderId, List<Long> collectionIds) {
        // 验证目标文件夹是否属于当前用户
        if (!collectionFolderService.getById(targetFolderId).getUserId().equals(userId)) {
            throw new RuntimeException("无权限操作此收藏夹");
        }

        // 获取原收藏夹ID列表，用于更新计数
        LambdaQueryWrapper<UserCollection> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(UserCollection::getId, collectionIds)
                .eq(UserCollection::getUserId, userId)
                .eq(UserCollection::getDeleted, 0);

        List<UserCollection> collections = list(wrapper);

        // 批量移动
        int movedCount = userCollectionMapper.batchMove(userId, targetFolderId, collectionIds);

        if (movedCount > 0) {
            // 统计各原收藏夹的移动数量
            collections.stream()
                    .filter(c -> !c.getFolderId().equals(targetFolderId))
                    .forEach(c -> collectionFolderService.updateCollectionCount(c.getFolderId(), -1));

            // 更新目标收藏夹计数
            collectionFolderService.updateCollectionCount(targetFolderId, movedCount);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCollection(Long userId, Long collectionId) {
        UserCollection collection = getById(collectionId);
        if (collection == null || !collection.getUserId().equals(userId)) {
            throw new RuntimeException("收藏不存在");
        }

        // 逻辑删除
        collection.setDeleted(1);
        updateById(collection);

        // 更新收藏夹计数
        collectionFolderService.updateCollectionCount(collection.getFolderId(), -1);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDelete(Long userId, List<Long> collectionIds) {
        if (collectionIds == null || collectionIds.isEmpty()) {
            return;
        }

        // 获取要删除的收藏记录，用于更新收藏夹计数
        LambdaQueryWrapper<UserCollection> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(UserCollection::getId, collectionIds)
                .eq(UserCollection::getUserId, userId)
                .eq(UserCollection::getDeleted, 0);

        List<UserCollection> collections = list(wrapper);

        if (collections.isEmpty()) {
            return;
        }

        // 执行批量逻辑删除
        int deletedCount = userCollectionMapper.batchLogicalDelete(userId, collectionIds);

        if (deletedCount > 0) {
            // 统计各收藏夹的删除数量并更新计数
            collections.stream()
                    .forEach(c -> collectionFolderService.updateCollectionCount(c.getFolderId(), -1));
        }
    }

    /**
     * 发布收藏通知给文章作者
     */
    private void publishCollectionNotification(Long blogId, Long userId) {
        try {
            Blog blog = blogMapper.selectById(blogId);
            if (blog == null || blog.getAuthorId().equals(userId)) {
                return; // 自己收藏自己的文章不通知
            }

            NotificationEvent event = NotificationEvent.collectionEvent(
                    this,
                    blog.getAuthorId(),
                    userId,
                    blog.getTitle(),
                    blogId,
                    java.util.Map.of("blogCover", blog.getCoverImg() != null ? blog.getCoverImg() : ""));
            eventPublisher.publishEvent(event);
            log.info("发布收藏通知事件: receiverId={}, senderId={}, blogId={}",
                    blog.getAuthorId(), userId, blogId);
        } catch (Exception e) {
            log.warn("发送收藏通知失败: {}", e.getMessage(), e);
        }
    }
}