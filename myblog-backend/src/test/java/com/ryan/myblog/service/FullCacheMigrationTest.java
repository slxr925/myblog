package com.ryan.myblog.service;

import com.ryan.myblog.common.RedisKeyFactory;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.CategoryMapper;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.mapper.UserLikeMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.model.entity.Tag;
import com.ryan.myblog.service.impl.BlogServiceImpl;
import com.ryan.myblog.service.impl.CategoryServiceImpl;
import com.ryan.myblog.service.impl.RedisLikeServiceImpl;
import com.ryan.myblog.service.impl.TagServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
public class FullCacheMigrationTest {

    @Autowired
    private BlogService blogService;

    @Autowired
    private RedisLikeService redisLikeService; // RedisLikeServiceImpl

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private TagService tagService;

    @Autowired
    private UnifiedCacheService unifiedCacheService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // Mock Mappers to avoid DB dependency
    @MockBean
    private BlogMapper blogMapper;

    @MockBean
    private UserLikeMapper userLikeMapper;

    @MockBean
    private CategoryMapper categoryMapper;

    @MockBean
    private TagMapper tagMapper;

    @MockBean
    private UserMapper userMapper;

    @MockBean
    private CacheConsistencyService cacheConsistencyService;

    // We also need to mock BrowseHistoryService inside BlogServiceImpl
    @MockBean
    private BrowseHistoryService browseHistoryService;

    @BeforeEach
    public void setup() {
        // Clear redis keys used in tests
        unifiedCacheService.delete(RedisKeyFactory.BLOG_DETAIL.getKey(1L));
        unifiedCacheService.delete(RedisKeyFactory.BLOG_LIKE_COUNT.getKey(1L));
        unifiedCacheService.delete("category:list"); // Constant
        unifiedCacheService.delete("tag:list"); // Constant
    }

    @Test
    public void testBlogCacheMigration() {
        Long blogId = 1L;
        Blog mockBlog = new Blog();
        mockBlog.setId(blogId);
        mockBlog.setTitle("Test Blog");
        mockBlog.setContent("Content");
        mockBlog.setUpdateTime(LocalDateTime.now());

        // Mock DB return
        when(blogMapper.selectById(blogId)).thenReturn(mockBlog);

        // 1. Get Blog - Should hit DB and Cache
        Blog result = blogService.getBlogById(blogId);
        assertNotNull(result);
        assertEquals("Test Blog", result.getTitle());

        // Verify Cache Exists
        Blog cachedBlog = unifiedCacheService.get(RedisKeyFactory.BLOG_DETAIL, Blog.class, blogId);
        assertNotNull(cachedBlog, "Blog should be cached after get");
        assertEquals("Test Blog", cachedBlog.getTitle());

        // 2. Clear Cache (simulate update)
        unifiedCacheService.delete(RedisKeyFactory.BLOG_DETAIL, blogId);
        assertNull(unifiedCacheService.get(RedisKeyFactory.BLOG_DETAIL, Blog.class, blogId));
    }

    @Test
    public void testLikeCacheMigration() {
        Long blogId = 1L;
        Long userId = 100L;

        // Mock DB count
        when(userLikeMapper.countByTarget("blog", blogId)).thenReturn(10L);

        // 1. Get Count - Should cache
        Long count = redisLikeService.getLikeCount(blogId);
        // Note: implementation might be async or complex, check UnifiedCacheService
        // usage

        // Let's verify UnifiedCacheService was used.
        // Since we can't easy verify internal calls, validting side effects on Redis
        // If RedisLikeServiceImpl refactor is correct, it should use
        // RedisKeyFactory.BLOG_LIKE_COUNT

        // Manually set cache to verify reading
        unifiedCacheService.set(RedisKeyFactory.BLOG_LIKE_COUNT, 999L, blogId);
        Long cachedCount = redisLikeService.getLikeCount(blogId);
        assertEquals(999L, cachedCount, "Should read from Redis cache");
    }

    @Test
    public void testCategoryCacheMigration() {
        // Mock DB
        Category cat = new Category();
        cat.setId(1L);
        cat.setName("Java");
        when(categoryMapper.selectList(any())).thenReturn(Collections.singletonList(cat));

        // 1. Get Categories
        List<Category> categories = categoryService.getAllCategories();
        assertFalse(categories.isEmpty());

        // Verify Cache (Constant Key: category:list)
        List<Category> cached = (List<Category>) redisTemplate.opsForValue().get("category:list");
        assertNotNull(cached, "Category list should be cached");
        assertFalse(cached.isEmpty());
    }

    @Test
    public void testTagCacheMigration() {
        // Mock DB
        Tag tag = new Tag();
        tag.setId(1L);
        tag.setName("Spring");
        when(tagMapper.selectList(any())).thenReturn(Collections.singletonList(tag));

        // 1. Get Tags
        List<Tag> tags = tagService.getAllTags();
        assertFalse(tags.isEmpty());

        // Verify Cache (Constant Key: tag:list)
        List<Tag> cached = (List<Tag>) redisTemplate.opsForValue().get("tag:list");
        assertNotNull(cached, "Tag list should be cached");
        assertFalse(cached.isEmpty());
    }
}
