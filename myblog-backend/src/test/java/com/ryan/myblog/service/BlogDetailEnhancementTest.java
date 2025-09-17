package com.ryan.myblog.service;

import com.ryan.myblog.entity.Blog;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.service.impl.BlogServiceImpl;
import com.ryan.myblog.vo.BlogDetailVO;
import com.ryan.myblog.vo.TagVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * 博客详情增强功能测试
 */
@ExtendWith(MockitoExtension.class)
class BlogDetailEnhancementTest {
    
    @Mock
    private BlogMapper blogMapper;
    
    @Mock
    private TagMapper tagMapper;
    
    @InjectMocks
    private BlogServiceImpl blogService;
    
    @Test
    void testGetRelatedBlogs() {
        // 准备测试数据
        Long blogId = 1L;
        Long categoryId = 1L;
        
        // Mock当前博客
        Blog currentBlog = new Blog();
        currentBlog.setId(blogId);
        currentBlog.setCategoryId(categoryId);
        when(blogMapper.selectById(blogId)).thenReturn(currentBlog);
        
        // Mock标签
        TagVO tag1 = new TagVO();
        tag1.setId(1L);
        tag1.setName("Java");
        when(tagMapper.selectTagsByBlogId(blogId)).thenReturn(Arrays.asList(tag1));
        
        // Mock相关博客
        BlogDetailVO relatedBlog1 = createMockBlog(2L, "Related Blog 1");
        when(blogMapper.selectRelatedBlogs(eq(blogId), eq(categoryId), anyList(), eq(5)))
                .thenReturn(Arrays.asList(relatedBlog1));
        
        // Mock为相关博客设置标签
        when(tagMapper.selectTagsByBlogId(2L)).thenReturn(Arrays.asList(tag1));
        
        // 测试
        List<BlogDetailVO> relatedBlogs = blogService.getRelatedBlogs(blogId, 5);
        
        // 验证
        assertNotNull(relatedBlogs);
        assertEquals(1, relatedBlogs.size());
        assertEquals("Related Blog 1", relatedBlogs.get(0).getTitle());
    }
    
    @Test
    void testGetHotBlogs() {
        // Mock热门博客
        BlogDetailVO hotBlog1 = createMockBlog(1L, "Hot Blog 1");
        hotBlog1.setViewCount(1000);
        
        when(blogMapper.selectHotBlogs(5)).thenReturn(Arrays.asList(hotBlog1));
        when(tagMapper.selectTagsByBlogId(anyLong())).thenReturn(Arrays.asList());
        
        // 测试
        List<BlogDetailVO> hotBlogs = blogService.getHotBlogs(5);
        
        // 验证
        assertNotNull(hotBlogs);
        assertEquals(1, hotBlogs.size());
        assertEquals("Hot Blog 1", hotBlogs.get(0).getTitle());
        assertEquals(1000, hotBlogs.get(0).getViewCount());
    }
    
    private BlogDetailVO createMockBlog(Long id, String title) {
        BlogDetailVO blog = new BlogDetailVO();
        blog.setId(id);
        blog.setTitle(title);
        blog.setSummary("Summary for " + title);
        blog.setAuthorName("Test Author");
        blog.setCategoryName("Test Category");
        blog.setViewCount(100);
        blog.setLikeCount(10);
        blog.setCommentCount(5);
        blog.setPublishTime(LocalDateTime.now());
        return blog;
    }
}