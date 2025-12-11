package com.ryan.myblog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ryan.myblog.common.PageResult;
import com.ryan.myblog.model.dto.CollectToggleDTO;
import com.ryan.myblog.model.dto.CollectResultDTO;
import com.ryan.myblog.model.entity.UserCollection;
import com.ryan.myblog.model.vo.UserCollectionVO;

import java.util.List;

/**
 * 用户收藏服务接口
 */
public interface UserCollectionService extends IService<UserCollection> {

    /**
     * 收藏/取消收藏
     */
    CollectResultDTO toggleCollection(Long userId, CollectToggleDTO dto);

    /**
     * 检查是否已收藏
     */
    boolean checkCollected(Long userId, Long targetId, String targetType);

    /**
     * 获取用户收藏列表
     */
    PageResult<UserCollectionVO> getUserCollections(Long userId, Long folderId, Integer page, Integer size);

    /**
     * 获取用户所有收藏（不分文件夹）
     */
    PageResult<UserCollectionVO> getUserAllCollections(Long userId, Integer page, Integer size);

    /**
     * 批量移动收藏
     */
    void batchMove(Long userId, Long targetFolderId, List<Long> collectionIds);

    /**
     * 删除收藏
     */
    void deleteCollection(Long userId, Long collectionId);

    /**
     * 批量删除收藏
     */
    void batchDelete(Long userId, List<Long> collectionIds);
}