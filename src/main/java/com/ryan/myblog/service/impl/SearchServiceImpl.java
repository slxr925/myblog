package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.document.BlogDocument;
import com.ryan.myblog.dto.SearchRequestDTO;
import com.ryan.myblog.entity.Blog;
import com.ryan.myblog.entity.Category;
import com.ryan.myblog.entity.User;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.CategoryMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.repository.BlogSearchRepository;
import com.ryan.myblog.service.SearchService;
import com.ryan.myblog.service.TagService;
import com.ryan.myblog.vo.SearchResultVO;
import com.ryan.myblog.vo.TagVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 搜索服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {
    
    private final BlogSearchRepository blogSearchRepository;
    private final BlogMapper blogMapper;
    private final UserMapper userMapper;
    private final CategoryMapper categoryMapper;
    private final TagService tagService;
    private final ElasticsearchOperations elasticsearchOperations;
    
    @Override
    public Page<SearchResultVO> searchBlogs(SearchRequestDTO searchRequest) {
        PageRequest pageRequest = buildPageRequest(searchRequest);
        Page<BlogDocument> documentPage;
        
        if (StringUtils.hasText(searchRequest.getKeyword())) {
            // 关键词搜索
            documentPage = blogSearchRepository.searchByMultiFieldsAndStatus(
                searchRequest.getKeyword(), 
                searchRequest.getStatus(), 
                pageRequest
            );
        } else if (searchRequest.getCategoryId() != null) {
            // 分类搜索
            documentPage = blogSearchRepository.findByCategoryIdAndStatus(
                searchRequest.getCategoryId(), 
                searchRequest.getStatus(), 
                pageRequest
            );
        } else if (searchRequest.getTagIds() != null && !searchRequest.getTagIds().isEmpty()) {
            // 标签搜索
            documentPage = blogSearchRepository.findByTagIdsInAndStatus(
                searchRequest.getTagIds(), 
                searchRequest.getStatus(), 
                pageRequest
            );
        } else if (searchRequest.getAuthorId() != null) {
            // 作者搜索
            documentPage = blogSearchRepository.findByAuthorIdAndStatus(
                searchRequest.getAuthorId(), 
                searchRequest.getStatus(), 
                pageRequest
            );
        } else {
            // 默认查询所有已发布博客
            documentPage = blogSearchRepository.findByStatus(searchRequest.getStatus(), pageRequest);
        }
        
        return documentPage.map(this::convertToSearchResultVO);
    }
    
    @Override
    public Page<SearchResultVO> searchByKeyword(String keyword, Integer page, Integer size) {
        SearchRequestDTO searchRequest = new SearchRequestDTO();
        searchRequest.setKeyword(keyword);
        searchRequest.setPage(page);
        searchRequest.setSize(size);
        return searchBlogs(searchRequest);
    }
    
    @Override
    public List<String> getHotSearchKeywords(Integer limit) {
        // 这里简化实现，返回一些预定义的热门关键词
        // 实际项目中可以通过统计用户搜索行为来实现
        List<String> hotKeywords = Arrays.asList(
            "Spring Boot", "Java", "MySQL", "Redis", "Vue.js", 
            "微服务", "Docker", "算法", "前端", "后端"
        );
        return hotKeywords.stream()
                .limit(limit != null ? limit : 10)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<String> getSearchSuggestions(String keyword, Integer limit) {
        if (!StringUtils.hasText(keyword)) {
            return new ArrayList<>();
        }
        
        // 这里简化实现，基于现有标签和分类生成建议
        // 实际项目中可以使用Elasticsearch的completion suggester
        List<String> suggestions = new ArrayList<>();
        
        // 从热门关键词中匹配
        List<String> hotKeywords = getHotSearchKeywords(20);
        suggestions.addAll(hotKeywords.stream()
                .filter(hot -> hot.toLowerCase().contains(keyword.toLowerCase()))
                .limit(limit != null ? limit : 5)
                .collect(Collectors.toList()));
        
        return suggestions;
    }
    
    @Override
    public void syncBlogToEs(Long blogId) {
        try {
            Blog blog = blogMapper.selectById(blogId);
            if (blog == null) {
                log.warn("博客不存在，无法同步到ES，blogId: {}", blogId);
                return;
            }
            
            BlogDocument document = convertToBlogDocument(blog);
            blogSearchRepository.save(document);
            log.info("博客同步到ES成功，blogId: {}", blogId);
        } catch (Exception e) {
            log.error("博客同步到ES失败，blogId: {}", blogId, e);
        }
    }
    
    @Override
    public void deleteBlogFromEs(Long blogId) {
        try {
            blogSearchRepository.deleteById(blogId);
            log.info("从ES删除博客成功，blogId: {}", blogId);
        } catch (Exception e) {
            log.error("从ES删除博客失败，blogId: {}", blogId, e);
        }
    }
    
    @Override
    public void syncAllBlogsToEs() {
        try {
            // 删除现有索引
            blogSearchRepository.deleteAll();
            
            // 查询所有已发布的博客
            LambdaQueryWrapper<Blog> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Blog::getStatus, 1); // 只同步已发布的博客
            List<Blog> blogs = blogMapper.selectList(wrapper);
            
            List<BlogDocument> documents = blogs.stream()
                    .map(this::convertToBlogDocument)
                    .collect(Collectors.toList());
            
            blogSearchRepository.saveAll(documents);
            log.info("批量同步博客到ES成功，共同步 {} 篇博客", documents.size());
        } catch (Exception e) {
            log.error("批量同步博客到ES失败", e);
        }
    }
    
    @Override
    public void rebuildIndex() {
        try {
            // 删除索引
            elasticsearchOperations.indexOps(BlogDocument.class).delete();
            // 创建索引
            elasticsearchOperations.indexOps(BlogDocument.class).create();
            // 同步数据
            syncAllBlogsToEs();
            log.info("重建Elasticsearch索引成功");
        } catch (Exception e) {
            log.error("重建Elasticsearch索引失败", e);
        }
    }
    
    /**
     * 构建分页和排序请求
     */
    private PageRequest buildPageRequest(SearchRequestDTO searchRequest) {
        Sort sort = buildSort(searchRequest.getSortBy(), searchRequest.getSortDir());
        return PageRequest.of(
            searchRequest.getPage() - 1, 
            searchRequest.getSize(), 
            sort
        );
    }
    
    /**
     * 构建排序条件
     */
    private Sort buildSort(String sortBy, String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? 
            Sort.Direction.ASC : Sort.Direction.DESC;
        
        return switch (sortBy) {
            case "time" -> Sort.by(direction, "publishTime");
            case "view" -> Sort.by(direction, "viewCount");
            case "like" -> Sort.by(direction, "likeCount");
            default -> Sort.by(direction, "_score"); // 默认按相关度排序
        };
    }
    
    /**
     * 将Blog实体转换为BlogDocument
     */
    private BlogDocument convertToBlogDocument(Blog blog) {
        BlogDocument document = new BlogDocument();
        document.setId(blog.getId());
        document.setTitle(blog.getTitle());
        document.setSummary(blog.getSummary());
        document.setContent(blog.getContent());
        document.setAuthorId(blog.getAuthorId());
        document.setCategoryId(blog.getCategoryId());
        document.setCoverImg(blog.getCoverImg());
        document.setStatus(blog.getStatus());
        document.setIsTop(blog.getIsTop());
        document.setViewCount(blog.getViewCount() != null ? blog.getViewCount() : 0L);
        document.setLikeCount(blog.getLikeCount() != null ? blog.getLikeCount() : 0L);
        document.setCommentCount(blog.getCommentCount() != null ? blog.getCommentCount() : 0L);
        document.setPublishTime(blog.getPublishTime());
        document.setCreateTime(blog.getCreateTime());
        document.setUpdateTime(blog.getUpdateTime());
        
        // 设置作者昵称
        User author = userMapper.selectById(blog.getAuthorId());
        if (author != null) {
            document.setAuthorNickname(author.getNickname());
        }
        
        // 设置分类名称
        Category category = categoryMapper.selectById(blog.getCategoryId());
        if (category != null) {
            document.setCategoryName(category.getName());
        }
        
        // 设置标签信息
        List<TagVO> tags = tagService.getTagsByBlogId(blog.getId());
        if (tags != null && !tags.isEmpty()) {
            document.setTagIds(tags.stream().map(TagVO::getId).collect(Collectors.toList()));
            document.setTagNames(tags.stream().map(TagVO::getName).collect(Collectors.toList()));
        }
        
        return document;
    }
    
    /**
     * 将BlogDocument转换为SearchResultVO
     */
    private SearchResultVO convertToSearchResultVO(BlogDocument document) {
        SearchResultVO vo = new SearchResultVO();
        vo.setId(document.getId());
        vo.setTitle(document.getTitle());
        vo.setSummary(document.getSummary());
        vo.setAuthorNickname(document.getAuthorNickname());
        vo.setCategoryName(document.getCategoryName());
        vo.setTagNames(document.getTagNames());
        vo.setCoverImg(document.getCoverImg());
        vo.setViewCount(document.getViewCount());
        vo.setLikeCount(document.getLikeCount());
        vo.setCommentCount(document.getCommentCount());
        vo.setPublishTime(document.getPublishTime());
        
        // 设置内容片段（截取前200个字符）
        if (StringUtils.hasText(document.getContent())) {
            String content = document.getContent().replaceAll("<[^>]+>", ""); // 去除HTML标签
            vo.setContentSnippet(content.length() > 200 ? 
                content.substring(0, 200) + "..." : content);
        }
        
        return vo;
    }
}