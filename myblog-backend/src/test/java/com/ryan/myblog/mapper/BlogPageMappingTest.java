package com.ryan.myblog.mapper;

import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;

import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.*;

class BlogPageMappingTest {
    @Test
    void paginationUsesOneRowPerArticleAndLoadsTagsSeparately() throws Exception {
        Configuration configuration = new Configuration();
        String resource = "mapper/BlogMapper.xml";
        try (var input = Resources.getResourceAsStream(resource)) {
            new XMLMapperBuilder(input, configuration, resource, configuration.getSqlFragments()).parse();
        }
        var statement = configuration.getMappedStatement("com.ryan.myblog.mapper.BlogMapper.selectBlogPage");
        var params = new HashMap<String, Object>();
        params.put("sort", "pinned");
        params.put("timeRange", "all");
        String sql = statement.getBoundSql(params).getSql();
        assertFalse(sql.contains("LEFT JOIN tb_blog_tag"));
        assertFalse(sql.contains("LEFT JOIN tb_tag"));
        assertTrue(sql.contains("b.status = 1"));
        assertTrue(sql.contains("b.visibility = 1"));
        var tags = statement.getResultMaps().getFirst().getResultMappings().stream()
                .filter(mapping -> "tags".equals(mapping.getProperty())).toList();
        assertEquals(1, tags.size());
        assertEquals("com.ryan.myblog.mapper.TagMapper.selectTagsByBlogId", tags.getFirst().getNestedQueryId());
        params.put("tagId", 2L);
        assertTrue(statement.getBoundSql(params).getSql().contains("SELECT blog_id FROM tb_blog_tag WHERE tag_id = ?"));
    }
}
