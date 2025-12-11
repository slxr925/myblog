package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ryan.myblog.mapper.CollectionFolderMapper;
import com.ryan.myblog.mapper.UserCollectionMapper;
import com.ryan.myblog.model.dto.CollectionFolderDTO;
import com.ryan.myblog.model.entity.CollectionFolder;
import com.ryan.myblog.model.entity.UserCollection;
import com.ryan.myblog.model.vo.CollectionFolderVO;
import com.ryan.myblog.service.CollectionFolderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * 收藏夹分类服务实现类
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CollectionFolderServiceImpl extends ServiceImpl<CollectionFolderMapper, CollectionFolder>
        implements CollectionFolderService {

    private final CollectionFolderMapper collectionFolderMapper;
    private final UserCollectionMapper userCollectionMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String FOLDER_CACHE_KEY = "collection:folder:user:";
    private static final int CACHE_EXPIRE_HOURS = 1;

    @Override
    public List<CollectionFolderVO> getUserFoldersWithCount(Long userId) {
        // 先从缓存查询
        String cacheKey = FOLDER_CACHE_KEY + userId;
        @SuppressWarnings("unchecked")
        List<CollectionFolderVO> cachedList = (List<CollectionFolderVO>) redisTemplate.opsForValue().get(cacheKey);
        if (cachedList != null) {
            return cachedList;
        }

        // 从数据库查询
        List<CollectionFolderVO> folders = collectionFolderMapper.getUserFoldersWithCount(userId);

        // 缓存结果
        redisTemplate.opsForValue().set(cacheKey, folders, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);

        return folders;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CollectionFolderVO createFolder(Long userId, CollectionFolderDTO dto) {
        // 检查同名收藏夹
        if (collectionFolderMapper.countByName(userId, dto.getName()) > 0) {
            throw new RuntimeException("已存在同名收藏夹");
        }

        CollectionFolder folder = new CollectionFolder();
        BeanUtils.copyProperties(dto, folder);
        folder.setUserId(userId);
        folder.setIsDefault(false);
        folder.setCollectionCount(0);
        if (folder.getSortOrder() == null) {
            folder.setSortOrder(0);
        }

        save(folder);

        // 清除缓存
        clearFolderCache(userId);

        // 转换为VO返回
        CollectionFolderVO vo = new CollectionFolderVO();
        BeanUtils.copyProperties(folder, vo);
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateFolder(Long userId, Long folderId, CollectionFolderDTO dto) {
        CollectionFolder folder = getById(folderId);
        if (folder == null || !folder.getUserId().equals(userId)) {
            throw new RuntimeException("收藏夹不存在");
        }

        // 默认收藏夹不能修改名称
        if (folder.getIsDefault() && !folder.getName().equals(dto.getName())) {
            throw new RuntimeException("默认收藏夹不能修改名称");
        }

        // 检查同名（排除自己）
        if (!folder.getName().equals(dto.getName()) &&
            collectionFolderMapper.countByName(userId, dto.getName()) > 0) {
            throw new RuntimeException("已存在同名收藏夹");
        }

        BeanUtils.copyProperties(dto, folder);
        updateById(folder);

        // 清除缓存
        clearFolderCache(userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteFolder(Long userId, Long folderId) {
        CollectionFolder folder = getById(folderId);
        if (folder == null || !folder.getUserId().equals(userId)) {
            throw new RuntimeException("收藏夹不存在");
        }

        // 默认收藏夹不能删除
        if (folder.getIsDefault()) {
            throw new RuntimeException("默认收藏夹不能删除");
        }

        // 获取默认收藏夹
        CollectionFolder defaultFolder = getOrCreateDefaultFolder(userId);

        // 将该收藏夹下的收藏移至默认收藏夹
        LambdaQueryWrapper<UserCollection> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserCollection::getUserId, userId)
               .eq(UserCollection::getFolderId, folderId)
               .eq(UserCollection::getDeleted, 0);

        List<UserCollection> collections = userCollectionMapper.selectList(wrapper);
        if (!collections.isEmpty()) {
            // 批量更新收藏夹
            collections.forEach(c -> {
                c.setFolderId(defaultFolder.getId());
                userCollectionMapper.updateById(c);
            });

            // 更新收藏夹数量
            updateCollectionCount(defaultFolder.getId(), collections.size());
        }

        // 删除收藏夹
        removeById(folderId);

        // 清除缓存
        clearFolderCache(userId);
    }

    @Override
    public CollectionFolder getOrCreateDefaultFolder(Long userId) {
        // 先从缓存查找
        String cacheKey = FOLDER_CACHE_KEY + userId + ":default";
        CollectionFolder defaultFolder = (CollectionFolder) redisTemplate.opsForValue().get(cacheKey);

        if (defaultFolder != null) {
            return defaultFolder;
        }

        // 数据库查询
        defaultFolder = collectionFolderMapper.getUserDefaultFolder(userId);

        // 如果不存在，创建默认收藏夹
        if (defaultFolder == null) {
            defaultFolder = new CollectionFolder();
            defaultFolder.setUserId(userId);
            defaultFolder.setName("默认收藏夹");
            defaultFolder.setIsDefault(true);
            defaultFolder.setSortOrder(0);
            defaultFolder.setCollectionCount(0);
            save(defaultFolder);
        }

        // 缓存1小时
        redisTemplate.opsForValue().set(cacheKey, defaultFolder, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);

        return defaultFolder;
    }

    @Override
    public void updateCollectionCount(Long folderId, Integer delta) {
        collectionFolderMapper.updateCollectionCount(folderId, delta);
        // 清除相关用户的缓存（简化处理，可以优化为只清除特定用户）
        redisTemplate.delete(redisTemplate.keys(FOLDER_CACHE_KEY + "*"));
    }

    private void clearFolderCache(Long userId) {
        redisTemplate.delete(FOLDER_CACHE_KEY + userId);
        redisTemplate.delete(FOLDER_CACHE_KEY + userId + ":default");
    }
}