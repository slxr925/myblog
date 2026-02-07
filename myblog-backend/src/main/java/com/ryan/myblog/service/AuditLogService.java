package com.ryan.myblog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.model.entity.AuditLog;

/**
 * 审计日志服务
 */
public interface AuditLogService {

    void record(AuditLog log);

    IPage<AuditLog> getAuditLogs(PageRequest pageRequest, Long operatorId, String action);
}
