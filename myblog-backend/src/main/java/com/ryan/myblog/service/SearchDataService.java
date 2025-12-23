package com.ryan.myblog.service;

import com.ryan.myblog.model.entity.BlogDocument;
import java.util.List;

/**
 * 搜索数据服务
 * 负责从数据库读取数据并转换为 ES 文档
 */
public interface SearchDataService {

    /**
     * 获取所有已发布的博客文档
     */
    List<BlogDocument> getAllPublishedBlogDocuments();

    /**
     * 根据博客 ID 获取文档
     */
    BlogDocument getBlogDocumentById(Long blogId);
}
