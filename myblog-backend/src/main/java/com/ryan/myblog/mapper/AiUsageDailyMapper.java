package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.AiUsageDaily;
import com.ryan.myblog.model.vo.AiUsageUserVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface AiUsageDailyMapper extends BaseMapper<AiUsageDaily> {

    @Select("SELECT a.user_id AS userId, u.username AS username, SUM(a.request_count) AS requestCount, " +
            "SUM(a.token_count) AS tokenCount " +
            "FROM tb_ai_usage_daily a LEFT JOIN tb_user u ON a.user_id = u.id " +
            "WHERE a.usage_date >= DATE_SUB(CURDATE(), INTERVAL #{days} DAY) " +
            "GROUP BY a.user_id, u.username ORDER BY requestCount DESC LIMIT #{limit}")
    List<AiUsageUserVO> selectTopUsers(@Param("days") int days, @Param("limit") int limit);
}
