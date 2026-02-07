package com.ryan.myblog.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ryan.myblog.model.dto.CollectionFolderDTO;
import com.ryan.myblog.model.entity.CollectionFolder;
import com.ryan.myblog.model.vo.CollectionFolderVO;

import java.util.List;

/**
 * 收藏夹分类服务接口
 */
public interface CollectionFolderService extends IService<CollectionFolder> {

    /**
     * 获取用户收藏夹列表（包含收藏数量）
     */
    List<CollectionFolderVO> getUserFoldersWithCount(Long userId);

    /**
     * 创建收藏夹
     */
    CollectionFolderVO createFolder(Long userId, CollectionFolderDTO dto);

    /**
     * 更新收藏夹
     */
    void updateFolder(Long userId, Long folderId, CollectionFolderDTO dto);

    /**
     * 删除收藏夹（将收藏移至默认收藏夹）
     */
    void deleteFolder(Long userId, Long folderId);

    /**
     * 获取或创建用户默认收藏夹
     */
    CollectionFolder getOrCreateDefaultFolder(Long userId);

    /**
     * 更新收藏夹的收藏数量
     */
    void updateCollectionCount(Long folderId, Integer delta);

    /**
     * 设置收藏夹公开/私密
     */
    CollectionFolderVO setFolderPublic(Long userId, Long folderId, boolean isPublic);

    /**
     * 生成分享码
     */
    CollectionFolderVO generateShareCode(Long userId, Long folderId);

    /**
     * 通过分享码获取收藏夹
     */
    CollectionFolderVO getByShareCode(String shareCode);
}
