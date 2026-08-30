package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.AiUsageDaily;
import com.ryan.myblog.model.vo.AiUsageUserVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface AiUsageDailyMapper extends BaseMapper<AiUsageDaily> {

    @Insert("INSERT IGNORE INTO tb_ai_usage_daily " +
            "(user_id, usage_date, request_count, token_count, create_time, update_time) " +
            "VALUES (#{userId}, #{usageDate}, 0, 0, NOW(), NOW())")
    int insertIfAbsent(@Param("userId") Long userId, @Param("usageDate") LocalDate usageDate);

    @Update("UPDATE tb_ai_usage_daily SET request_count = request_count + 1, " +
            "token_count = token_count + #{estimatedTokens}, update_time = NOW() " +
            "WHERE user_id = #{userId} AND usage_date = #{usageDate} " +
            "AND (#{maxRequestsPerDay} <= 0 OR request_count < #{maxRequestsPerDay}) " +
            "AND (#{maxTokensPerDay} <= 0 OR token_count + #{estimatedTokens} <= #{maxTokensPerDay})")
    int consumeWithinLimit(@Param("userId") Long userId,
                           @Param("usageDate") LocalDate usageDate,
                           @Param("estimatedTokens") int estimatedTokens,
                           @Param("maxRequestsPerDay") int maxRequestsPerDay,
                           @Param("maxTokensPerDay") int maxTokensPerDay);

    @Update("UPDATE tb_ai_usage_daily SET request_count = request_count + 1, " +
            "token_count = token_count + #{estimatedTokens}, update_time = NOW() " +
            "WHERE user_id = #{userId} AND usage_date = #{usageDate}")
    int consumeUnlimited(@Param("userId") Long userId,
                         @Param("usageDate") LocalDate usageDate,
                         @Param("estimatedTokens") int estimatedTokens);

    @Update("UPDATE tb_ai_usage_daily SET request_count = GREATEST(request_count - 1, 0), " +
            "token_count = GREATEST(token_count - #{estimatedTokens}, 0), update_time = NOW() " +
            "WHERE user_id = #{userId} AND usage_date = #{usageDate}")
    int refund(@Param("userId") Long userId,
               @Param("usageDate") LocalDate usageDate,
               @Param("estimatedTokens") int estimatedTokens);

    @Select("SELECT COALESCE(request_count, 0) FROM tb_ai_usage_daily " +
            "WHERE user_id = #{userId} AND usage_date = #{usageDate} LIMIT 1")
    Integer selectRequestCount(@Param("userId") Long userId, @Param("usageDate") LocalDate usageDate);

    @Select("SELECT a.user_id AS userId, u.username AS username, SUM(a.request_count) AS requestCount, " +
            "SUM(a.token_count) AS tokenCount " +
            "FROM tb_ai_usage_daily a LEFT JOIN tb_user u ON a.user_id = u.id " +
            "WHERE a.usage_date >= DATE_SUB(CURDATE(), INTERVAL #{days} DAY) " +
            "GROUP BY a.user_id, u.username ORDER BY requestCount DESC LIMIT #{limit}")
    List<AiUsageUserVO> selectTopUsers(@Param("days") int days, @Param("limit") int limit);
}
