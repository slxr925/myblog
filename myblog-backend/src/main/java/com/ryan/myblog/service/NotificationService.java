package com.ryan.myblog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.ryan.myblog.common.NotificationType;
import com.ryan.myblog.model.entity.Notification;
import com.ryan.myblog.model.entity.NotificationSetting;
import com.ryan.myblog.model.vo.NotificationVO;
import com.ryan.myblog.service.notification.NotificationMessage;

import java.util.Map;

/**
 * 通知服务接口
 */
public interface NotificationService extends IService<Notification> {

    /**
     * 创建通知记录
     */
    Notification create(NotificationMessage message);

    /**
     * 分页查询用户通知
     */
    IPage<NotificationVO> getNotificationPage(Long userId, String type, Integer isRead, int page, int size);

    /**
     * 获取用户未读通知总数
     */
    Long getUnreadCount(Long userId);

    /**
     * 按类型获取未读通知数量
     */
    Map<String, Long> getUnreadCountByType(Long userId);

    /**
     * 标记通知为已读
     */
    boolean markAsRead(Long userId, Long notificationId);

    /**
     * 标记所有通知为已读
     */
    boolean markAllAsRead(Long userId);

    /**
     * 标记某类型通知为已读
     */
    boolean markAsReadByType(Long userId, String type);

    /**
     * 删除通知
     */
    boolean deleteNotification(Long userId, Long notificationId);

    /**
     * 检查用户是否开启了某类型通知
     */
    boolean isNotificationEnabled(Long userId, NotificationType type);

    /**
     * 获取用户通知设置
     */
    NotificationSetting getUserSetting(Long userId);

    /**
     * 更新用户通知设置
     */
    boolean updateUserSetting(Long userId, NotificationSetting setting);

    /**
     * 增加用户未读计数（Redis缓存）
     */
    void incrementUnreadCount(Long userId);

    /**
     * 减少用户未读计数（Redis缓存）
     */
    void decrementUnreadCount(Long userId, int count);

    /**
     * 将通知实体转换为VO
     */
    NotificationVO toVO(Notification notification);
}
