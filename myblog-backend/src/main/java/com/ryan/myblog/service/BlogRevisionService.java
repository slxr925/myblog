package com.ryan.myblog.service;

import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.vo.BlogRevisionDiffVO;
import com.ryan.myblog.model.vo.BlogRevisionVO;

import java.util.List;

/**
 * 博客版本历史服务
 */
public interface BlogRevisionService {

    void createRevision(Blog blog, Long authorId);

    List<BlogRevisionVO> listRevisions(Long blogId);

    BlogRevisionDiffVO diffRevisions(Long fromRevisionId, Long toRevisionId);

    void restoreRevision(Long revisionId, Long operatorId);
}
