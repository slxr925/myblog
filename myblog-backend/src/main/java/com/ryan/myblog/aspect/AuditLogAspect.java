package com.ryan.myblog.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.myblog.annotation.AuditLog;
import com.ryan.myblog.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Around("@annotation(auditLog)")
    public Object around(ProceedingJoinPoint joinPoint, AuditLog auditLog) throws Throwable {
        Object result;
        Throwable error = null;
        try {
            result = joinPoint.proceed();
            return result;
        } catch (Throwable t) {
            error = t;
            throw t;
        } finally {
            try {
                recordAudit(joinPoint, auditLog, error);
            } catch (Exception e) {
                log.warn("记录审计日志失败", e);
            }
        }
    }

    private void recordAudit(ProceedingJoinPoint joinPoint, AuditLog auditLog, Throwable error) {
        com.ryan.myblog.model.entity.AuditLog logEntity = new com.ryan.myblog.model.entity.AuditLog();
        logEntity.setAction(auditLog.action());
        logEntity.setTargetType(auditLog.resource());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            logEntity.setOperatorId(userId);
        }

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            logEntity.setIp(request.getRemoteAddr());
            logEntity.setUserAgent(request.getHeader("User-Agent"));
        }

        // 记录参数详情
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] paramNames = signature.getParameterNames();
            Object[] args = joinPoint.getArgs();
            logEntity.setDetailJson(objectMapper.writeValueAsString(buildDetail(paramNames, args, error)));
        } catch (Exception e) {
            logEntity.setDetailJson("{\"error\":\"serialize_failed\"}");
        }
        logEntity.setCreateTime(LocalDateTime.now());

        auditLogService.record(logEntity);
    }

    private Object buildDetail(String[] paramNames, Object[] args, Throwable error) {
        java.util.Map<String, Object> detail = new java.util.HashMap<>();
        if (paramNames != null && args != null) {
            for (int i = 0; i < Math.min(paramNames.length, args.length); i++) {
                detail.put(paramNames[i], args[i]);
            }
        }
        if (error != null) {
            detail.put("error", error.getMessage());
        }
        return detail;
    }
}
