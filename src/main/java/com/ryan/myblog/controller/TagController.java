package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.entity.Tag;
import com.ryan.myblog.service.TagService;
import com.ryan.myblog.vo.TagVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 标签控制器
 */
@RestController
@RequestMapping("/api/tag")
@RequiredArgsConstructor
public class TagController {
    
    private final TagService tagService;
    
    /**
     * 获取所有标签
     */
    @GetMapping("/list")
    public Result<List<Tag>> getAllTags() {
        List<Tag> tags = tagService.getAllTags();
        return Result.success(tags);
    }
    
    /**
     * 根据ID查询标签
     */
    @GetMapping("/{id}")
    public Result<Tag> getTagById(@PathVariable Long id) {
        Tag tag = tagService.getTagById(id);
        if (tag == null) {
            return Result.error("标签不存在");
        }
        return Result.success(tag);
    }
    
    /**
     * 保存标签
     */
    @PostMapping
    public Result<Void> saveTag(@RequestBody Tag tag) {
        try {
            tagService.saveTag(tag);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 更新标签
     */
    @PutMapping
    public Result<Void> updateTag(@RequestBody Tag tag) {
        try {
            tagService.updateTag(tag);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 删除标签
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTag(@PathVariable Long id) {
        try {
            tagService.deleteTag(id);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 根据博客ID查询标签列表
     */
    @GetMapping("/blog/{blogId}")
    public Result<List<TagVO>> getTagsByBlogId(@PathVariable Long blogId) {
        List<TagVO> tags = tagService.getTagsByBlogId(blogId);
        return Result.success(tags);
    }
}