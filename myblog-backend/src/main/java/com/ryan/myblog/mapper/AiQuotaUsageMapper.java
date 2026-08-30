package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.AiQuotaUsage;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface AiQuotaUsageMapper extends BaseMapper<AiQuotaUsage> {

    @Insert("INSERT IGNORE INTO tb_ai_quota_usage " +
            "(request_id, user_id, usage_date, action, status, estimated_tokens, create_time, update_time) " +
            "VALUES (#{requestId}, #{userId}, #{usageDate}, #{action}, 'RESERVED', #{estimatedTokens}, NOW(), NOW())")
    int insertReservation(@Param("requestId") String requestId,
                          @Param("userId") Long userId,
                          @Param("usageDate") LocalDate usageDate,
                          @Param("action") String action,
                          @Param("estimatedTokens") int estimatedTokens);

    @Update("UPDATE tb_ai_quota_usage SET status = #{nextStatus}, update_time = NOW() " +
            "WHERE request_id = #{requestId} AND status = 'RESERVED'")
    int transitionReserved(@Param("requestId") String requestId, @Param("nextStatus") String nextStatus);

    @Select("SELECT * FROM tb_ai_quota_usage WHERE request_id = #{requestId} LIMIT 1")
    AiQuotaUsage selectByRequestId(@Param("requestId") String requestId);

    @Select("SELECT * FROM tb_ai_quota_usage WHERE status = 'RESERVED' AND create_time < #{cutoff} " +
            "ORDER BY id ASC LIMIT #{limit}")
    List<AiQuotaUsage> selectStaleReservations(@Param("cutoff") LocalDateTime cutoff, @Param("limit") int limit);
}
