package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.CollectionFolderDTO;
import com.ryan.myblog.model.dto.CollectToggleDTO;
import com.ryan.myblog.model.dto.CollectResultDTO;
import com.ryan.myblog.model.vo.CollectionFolderVO;
import com.ryan.myblog.model.vo.UserCollectionVO;
import com.ryan.myblog.service.CollectionFolderService;
import com.ryan.myblog.service.UserCollectionService;
import com.ryan.myblog.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 收藏管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/collection")
@RequiredArgsConstructor
@Validated
public class CollectionController {

    private final CollectionFolderService collectionFolderService;
    private final UserCollectionService userCollectionService;

    /**
     * 获取用户收藏夹列表
     */
    @GetMapping("/folders")
    public Result<List<CollectionFolderVO>> getFolders() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<CollectionFolderVO> folders = collectionFolderService.getUserFoldersWithCount(userId);
        return Result.success(folders);
    }

    /**
     * 创建收藏夹
     */
    @PostMapping("/folders")
    public Result<CollectionFolderVO> createFolder(@RequestBody @Validated CollectionFolderDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        CollectionFolderVO folder = collectionFolderService.createFolder(userId, dto);
        return Result.success(folder);
    }

    /**
     * 更新收藏夹
     */
    @PutMapping("/folders/{id}")
    public Result<Void> updateFolder(@PathVariable Long id, @RequestBody @Validated CollectionFolderDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        collectionFolderService.updateFolder(userId, id, dto);
        return Result.success();
    }

    /**
     * 删除收藏夹
     */
    @DeleteMapping("/folders/{id}")
    public Result<Void> deleteFolder(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        collectionFolderService.deleteFolder(userId, id);
        return Result.success();
    }

    /**
     * 收藏/取消收藏
     */
    @PostMapping("/toggle")
    public Result<CollectResultDTO> toggleCollection(@RequestBody @Validated CollectToggleDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        CollectResultDTO result = userCollectionService.toggleCollection(userId, dto);
        return Result.success(result);
    }

    /**
     * 检查是否已收藏
     */
    @GetMapping("/check/{targetId}")
    public Result<Boolean> checkCollected(@PathVariable Long targetId,
                                         @RequestParam(defaultValue = "blog") String targetType) {
        Long userId = SecurityUtils.getCurrentUserId();
        boolean collected = userCollectionService.checkCollected(userId, targetId, targetType);
        return Result.success(collected);
    }

    /**
     * 获取收藏列表（指定文件夹）
     */
    @GetMapping("/list")
    public Result<List<UserCollectionVO>> getCollectionList(
            @RequestParam(required = false) Long folderId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(userCollectionService.getUserCollections(userId, folderId, page, size).getRecords());
    }

    /**
     * 获取所有收藏（不分文件夹）
     */
    @GetMapping("/list/all")
    public Result<List<UserCollectionVO>> getAllCollections(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(userCollectionService.getUserAllCollections(userId, page, size).getRecords());
    }

    /**
     * 批量移动收藏
     */
    @PostMapping("/move")
    public Result<Void> batchMove(@RequestParam Long targetFolderId,
                                  @RequestParam List<Long> collectionIds) {
        Long userId = SecurityUtils.getCurrentUserId();
        userCollectionService.batchMove(userId, targetFolderId, collectionIds);
        return Result.success();
    }

    /**
     * 删除收藏
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteCollection(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        userCollectionService.deleteCollection(userId, id);
        return Result.success();
    }

    /**
     * 批量删除收藏
     */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> collectionIds) {
        Long userId = SecurityUtils.getCurrentUserId();
        userCollectionService.batchDelete(userId, collectionIds);
        return Result.success();
    }

    /**
     * 生成分享码并设为公开
     */
    @PostMapping("/folders/{id}/share")
    public Result<CollectionFolderVO> shareFolder(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        CollectionFolderVO vo = collectionFolderService.generateShareCode(userId, id);
        return Result.success(vo);
    }

    /**
     * 设置公开/私密
     */
    @PostMapping("/folders/{id}/public")
    public Result<CollectionFolderVO> setFolderPublic(@PathVariable Long id, @RequestParam boolean isPublic) {
        Long userId = SecurityUtils.getCurrentUserId();
        CollectionFolderVO vo = collectionFolderService.setFolderPublic(userId, id, isPublic);
        return Result.success(vo);
    }

    /**
     * 通过分享码获取收藏夹
     */
    @GetMapping("/share/{shareCode}")
    public Result<java.util.Map<String, Object>> getSharedFolder(
            @PathVariable String shareCode,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        CollectionFolderVO folder = collectionFolderService.getByShareCode(shareCode);
        var collections = userCollectionService.getUserCollections(folder.getUserId(), folder.getId(), page, size)
                .getRecords();
        return Result.success(java.util.Map.of(
                "folder", folder,
                "items", collections
        ));
    }
}
