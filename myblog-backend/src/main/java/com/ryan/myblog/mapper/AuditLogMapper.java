package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}
