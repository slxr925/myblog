package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 博客版本视图对象
 */
@Data
public class BlogRevisionVO {

    private Long id;
    private Long blogId;
    private Integer version;
    private String title;
    private String summary;
    private Long authorId;
    private LocalDateTime createTime;
}
