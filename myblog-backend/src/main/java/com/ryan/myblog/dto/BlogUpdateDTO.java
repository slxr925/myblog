package com.ryan.myblog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 博客更新DTO
 */
@Data
public class BlogUpdateDTO {

    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题长度不能超过200位")
    private String title;

    @Size(max = 500, message = "摘要长度不能超过500位")
    private String summary;

    @NotBlank(message = "内容不能为空")
    private String content;

    @Size(max = 500, message = "封面图URL长度不能超过500位")
    private String coverImage;

    @NotNull(message = "分类ID不能为空")
    private Long categoryId;

    private List<Long> tagIds;

    private Integer status; // 0-草稿，1-已发布，2-已下线

    private Boolean isTop; // 是否置顶

    private Boolean isCommentable; // 是否允许评论
}