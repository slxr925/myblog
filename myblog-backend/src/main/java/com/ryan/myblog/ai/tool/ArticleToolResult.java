package com.ryan.myblog.ai.tool;

import com.ryan.myblog.model.vo.TagVO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ArticleToolResult {
    private Long id;
    private String publicId;
    private String title;
    private String summary;
    private Long categoryId;
    private String categoryName;
    private List<TagVO> tags;
    private String publishTime;
    private String snippet;
    private Double score;
    private String matchSource;
}
