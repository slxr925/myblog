package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.model.entity.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 通知Mapper接口
 */
@Mapper
public interface NotificationMapper extends BaseMapper<Notification> {

    /**
     * 分页查询用户通知（带发送者信息）
     */
    IPage<Notification> selectNotificationPage(
            Page<Notification> page,
            @Param("receiverId") Long receiverId,
            @Param("type") String type,
            @Param("isRead") Integer isRead);

    /**
     * 统计用户未读通知数量
     */
    Long countUnread(@Param("receiverId") Long receiverId);

    /**
     * 按类型统计用户未读通知数量
     */
    Long countUnreadByType(
            @Param("receiverId") Long receiverId,
            @Param("type") String type);

    /**
     * 标记用户所有通知为已读
     */
    int markAllAsRead(@Param("receiverId") Long receiverId);

    /**
     * 标记用户某类型通知为已读
     */
    int markAsReadByType(
            @Param("receiverId") Long receiverId,
            @Param("type") String type);
}
