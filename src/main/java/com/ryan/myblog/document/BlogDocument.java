package com.ryan.myblog.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 博客搜索文档
 */
@Data
@Document(indexName = "myblog_blogs")
public class BlogDocument {
    
    @Id
    private Long id;
    
    /**
     * 博客标题
     */
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String title;
    
    /**
     * 博客摘要
     */
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String summary;
    
    /**
     * 博客内容
     */
    @Field(type = FieldType.Text, analyzer = "ik_max_word", searchAnalyzer = "ik_smart")
    private String content;
    
    /**
     * 作者ID
     */
    @Field(type = FieldType.Long)
    private Long authorId;
    
    /**
     * 作者昵称
     */
    @Field(type = FieldType.Keyword)
    private String authorNickname;
    
    /**
     * 分类ID
     */
    @Field(type = FieldType.Long)
    private Long categoryId;
    
    /**
     * 分类名称
     */
    @Field(type = FieldType.Keyword)
    private String categoryName;
    
    /**
     * 标签ID列表
     */
    @Field(type = FieldType.Long)
    private List<Long> tagIds;
    
    /**
     * 标签名称列表
     */
    @Field(type = FieldType.Keyword)
    private List<String> tagNames;
    
    /**
     * 封面图片
     */
    @Field(type = FieldType.Keyword)
    private String coverImg;
    
    /**
     * 博客状态：0-草稿，1-已发布，2-已下线
     */
    @Field(type = FieldType.Integer)
    private Integer status;
    
    /**
     * 是否置顶：0-否，1-是
     */
    @Field(type = FieldType.Integer)
    private Integer isTop;
    
    /**
     * 阅读量
     */
    @Field(type = FieldType.Long)
    private Long viewCount;
    
    /**
     * 点赞数
     */
    @Field(type = FieldType.Long)
    private Long likeCount;
    
    /**
     * 评论数
     */
    @Field(type = FieldType.Long)
    private Long commentCount;
    
    /**
     * 发布时间
     */
    @Field(type = FieldType.Date)
    private LocalDateTime publishTime;
    
    /**
     * 创建时间
     */
    @Field(type = FieldType.Date)
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    @Field(type = FieldType.Date)
    private LocalDateTime updateTime;
}