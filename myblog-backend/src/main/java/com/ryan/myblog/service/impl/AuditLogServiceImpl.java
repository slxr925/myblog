package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.mapper.AuditLogMapper;
import com.ryan.myblog.model.entity.AuditLog;
import com.ryan.myblog.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogMapper auditLogMapper;

    @Override
    public void record(AuditLog log) {
        auditLogMapper.insert(log);
    }

    @Override
    public IPage<AuditLog> getAuditLogs(PageRequest pageRequest, Long operatorId, String action) {
        Page<AuditLog> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        LambdaQueryWrapper<AuditLog> wrapper = new LambdaQueryWrapper<>();
        if (operatorId != null) {
            wrapper.eq(AuditLog::getOperatorId, operatorId);
        }
        if (action != null && !action.isBlank()) {
            wrapper.eq(AuditLog::getAction, action);
        }
        wrapper.orderByDesc(AuditLog::getCreateTime);
        return auditLogMapper.selectPage(page, wrapper);
    }
}
