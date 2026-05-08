package com.ryan.myblog.ai.tool;

import com.ryan.myblog.model.vo.TagVO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ArticleContextToolResult {
    private Long id;
    private String publicId;
    private String title;
    private String summary;
    private String contentSnippet;
    private Long categoryId;
    private String categoryName;
    private List<TagVO> tags;
    private String visibility;
}
