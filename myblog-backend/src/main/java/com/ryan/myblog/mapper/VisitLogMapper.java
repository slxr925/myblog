package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.VisitLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 访问日志 Mapper 接口
 */
@Mapper
public interface VisitLogMapper extends BaseMapper<VisitLog> {
}