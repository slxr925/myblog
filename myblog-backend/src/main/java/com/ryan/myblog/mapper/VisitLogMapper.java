package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.VisitLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;

/**
 * 访问日志 Mapper 接口
 */
@Mapper
public interface VisitLogMapper extends BaseMapper<VisitLog> {

    /**
     * 统计指定时间范围内的活跃用户数（去重）
     * 
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @return 活跃用户数
     */
    @Select("SELECT COUNT(DISTINCT user_id) FROM tb_visit_log " +
            "WHERE user_id IS NOT NULL " +
            "AND visit_time >= #{startTime} " +
            "AND visit_time < #{endTime} " +
            "AND deleted = 0")
    Long countDistinctActiveUsers(@Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}