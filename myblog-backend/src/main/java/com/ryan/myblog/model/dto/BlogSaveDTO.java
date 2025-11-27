package com.ryan.myblog.model.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * 博客保存DTO
 */
@Data
public class BlogSaveDTO {
    
    @NotBlank(message = "标题不能为空")
    @Size(max = 100, message = "标题长度不能超过100字符")
    private String title;
    
    @Size(max = 200, message = "摘要长度不能超过200字符")
    private String summary;
    
    @NotBlank(message = "内容不能为空")
    private String content;
    
    private String coverImg;
    
    private Long categoryId;
    
    private List<Long> tagIds;

    /**
     * 标签名称列表（前端编辑器使用）
     */
    private List<String> tags;
    
    @NotNull(message = "状态不能为空")
    private Integer status;
    
    private Integer isTop = 0;

    /**
     * 文章可见性：0-私密，1-公开
     */
    private Integer visibility = 1;
}