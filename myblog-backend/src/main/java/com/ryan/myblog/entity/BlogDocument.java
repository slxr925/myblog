package com.ryan.myblog.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDateTime;

/**
 * 博客文档实体（用于Elasticsearch）
 */
@Data
@Document(indexName = "blog_index")
public class BlogDocument {
    
    @Id
    private String id;
    
    @Field(type = FieldType.Text, analyzer = "standard")
    private String title;
    
    @Field(type = FieldType.Text, analyzer = "standard")
    private String summary;
    
    @Field(type = FieldType.Text, analyzer = "standard")
    private String content;
    
    @Field(type = FieldType.Long)
    private Long authorId;
    
    @Field(type = FieldType.Keyword)
    private String authorName;
    
    @Field(type = FieldType.Long)
    private Long categoryId;
    
    @Field(type = FieldType.Keyword)
    private String categoryName;
    
    @Field(type = FieldType.Keyword)
    private String[] tags;
    
    @Field(type = FieldType.Integer)
    private Integer status;
    
    @Field(type = FieldType.Boolean)
    private Boolean isTop;
    
    @Field(type = FieldType.Long)
    private Long viewCount;
    
    @Field(type = FieldType.Long)
    private Long likeCount;
    
    @Field(type = FieldType.Long)
    private Long commentCount;
    
    @Field(type = FieldType.Date)
    private LocalDateTime publishTime;
    
    @Field(type = FieldType.Date)
    private LocalDateTime createTime;
    
    @Field(type = FieldType.Date)
    private LocalDateTime updateTime;
}