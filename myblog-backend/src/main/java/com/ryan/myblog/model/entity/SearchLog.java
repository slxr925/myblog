package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 搜索日志实体
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_search_log")
public class SearchLog {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("keyword")
    private String keyword;

    @TableField("filters_json")
    private String filtersJson;

    @TableField("result_count")
    private Integer resultCount;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
