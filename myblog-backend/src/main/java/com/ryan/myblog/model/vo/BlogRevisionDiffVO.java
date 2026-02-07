package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * 博客版本对比视图对象
 */
@Data
public class BlogRevisionDiffVO {

    private Long fromRevisionId;
    private Long toRevisionId;

    private String fromTitle;
    private String toTitle;

    private String fromSummary;
    private String toSummary;

    private String fromContentSnippet;
    private String toContentSnippet;

    private boolean titleChanged;
    private boolean summaryChanged;
    private boolean contentChanged;
}
