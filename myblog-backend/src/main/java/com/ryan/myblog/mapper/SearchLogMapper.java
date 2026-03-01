package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.SearchLog;
import com.ryan.myblog.model.vo.SearchTrendVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SearchLogMapper extends BaseMapper<SearchLog> {

    @Select("SELECT keyword AS keyword, COUNT(*) AS count FROM tb_search_log " +
            "WHERE create_time >= DATE_SUB(NOW(), INTERVAL #{days} DAY) " +
            "AND result_count > 0 " +
            "AND NOT (LOWER(keyword) REGEXP '^[a-z]{1,3}$') " +
            "AND (filters_json IS NULL OR filters_json NOT LIKE '%\"source\":\"suggest\"%') " +
            "GROUP BY keyword ORDER BY count DESC LIMIT #{limit}")
    List<SearchTrendVO> selectTrending(@Param("days") int days, @Param("limit") int limit);
}
