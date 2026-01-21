package com.ryan.myblog.service;

import com.ryan.myblog.model.vo.ErrorLogVO;

import java.util.List;

/**
 * 错误日志服务
 */
public interface ErrorLogService {

    /**
     * 记录错误日志
     */
    void logError(ErrorLogVO errorLog);

    /**
     * 获取最近的错误日志
     * 
     * @param limit 数量限制
     * @return 错误日志列表
     */
    List<ErrorLogVO> getRecentErrors(int limit);

    /**
     * 获取最近24小时的错误统计
     * 
     * @return 错误数量
     */
    long getErrorCount24Hours();

    /**
     * 清除过期的错误日志
     */
    void cleanupExpiredErrors();
}
