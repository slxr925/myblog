package com.ryan.myblog.service;

import com.ryan.myblog.model.vo.RagSearchResult;
import com.ryan.myblog.model.vo.RagStatusVO;

import java.util.List;

public interface BlogRagService {

    String INDEX_NAME = "blog_rag_chunks";

    void upsertBlogAsync(Long blogId);

    void deleteBlogAsync(Long blogId);

    List<RagSearchResult> search(String question, int topK, double similarityThreshold);

    RagStatusVO getStatus();

    RagStatusVO rebuildAllAsync();
}
