package com.ryan.myblog.converter;

import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.BlogDocument;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.model.entity.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 博客实体与Elasticsearch文档转换器
 */
@Slf4j
@Component
public class BlogDocumentConverter {

    /**
     * 将Blog实体转换为BlogDocument
     */
    public BlogDocument convertToDocument(Blog blog, User author, Category category, List<Tag> tags) {
        if (blog == null) {
            return null;
        }

        BlogDocument document = new BlogDocument();
        document.setId(blog.getId().toString());
        document.setTitle(blog.getTitle());
        document.setSummary(blog.getSummary());
        document.setContent(blog.getContent());
        document.setAuthorId(blog.getAuthorId());
        document.setCategoryId(blog.getCategoryId());
        document.setStatus(blog.getStatus());
        document.setIsTop(blog.getIsTop() != null && blog.getIsTop() == 1);
        document.setViewCount(blog.getViewCount() != null ? blog.getViewCount().longValue() : 0L);
        // 注意：like_count 和 comment_count 已从 Blog 实体删除，这里设置为 0
        // 如果需要，应该在调用者传入实际的计数值
        document.setLikeCount(0L);
        document.setCommentCount(0L);
        document.setPublishTime(blog.getPublishTime());
        document.setCreateTime(blog.getCreateTime());
        document.setUpdateTime(blog.getUpdateTime());

        // 设置作者名称
        if (author != null) {
            document.setAuthorName(author.getNickname());
        }

        // 设置分类名称
        if (category != null) {
            document.setCategoryName(category.getName());
        }

        // 设置标签
        if (!CollectionUtils.isEmpty(tags)) {
            List<String> tagNames = tags.stream()
                    .map(Tag::getName)
                    .collect(Collectors.toList());
            document.setTags(tagNames.toArray(new String[0]));
        }

        return document;
    }

    /**
     * 将BlogDocument转换为Blog实体（用于搜索结果展示）
     */
    public Blog convertFromDocument(BlogDocument document) {
        if (document == null) {
            return null;
        }

        Blog blog = new Blog();
        try {
            blog.setId(Long.valueOf(document.getId()));
        } catch (NumberFormatException e) {
            log.error("Invalid blog ID format: {}", document.getId());
            return null;
        }

        blog.setTitle(document.getTitle());
        blog.setSummary(document.getSummary());
        blog.setContent(document.getContent());
        blog.setAuthorId(document.getAuthorId());
        blog.setCategoryId(document.getCategoryId());
        blog.setStatus(document.getStatus());
        blog.setIsTop(document.getIsTop() != null && document.getIsTop() ? 1 : 0);
        blog.setViewCount(document.getViewCount() != null ? document.getViewCount().intValue() : 0);
        // likeCount 和 commentCount 已从 Blog 实体删除，不再设置
        blog.setPublishTime(document.getPublishTime());
        blog.setCreateTime(document.getCreateTime());
        blog.setUpdateTime(document.getUpdateTime());

        return blog;
    }
}