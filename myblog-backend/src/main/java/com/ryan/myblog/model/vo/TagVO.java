package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * 标签VO
 */
@Data
public class TagVO {
    
    private Long id;
    private String name;
    private String color;
}