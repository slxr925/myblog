package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.BrowseHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 浏览记录 Mapper 接口
 */
@Mapper
public interface BrowseHistoryMapper extends BaseMapper<BrowseHistory> {

    /**
     * 插入或更新浏览记录
     * 如果记录已存在，则更新 browse_time 为当前时间
     * 
     * @param userId 用户ID
     * @param blogId 文章ID
     * @return 影响的行数
     */
    int insertOrUpdate(@Param("userId") Long userId, @Param("blogId") Long blogId);
}
