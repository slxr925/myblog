package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ryan.myblog.common.NotificationType;
import com.ryan.myblog.mapper.NotificationMapper;
import com.ryan.myblog.mapper.NotificationSettingMapper;
import com.ryan.myblog.model.entity.Notification;
import com.ryan.myblog.model.entity.NotificationSetting;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.vo.NotificationVO;
import com.ryan.myblog.service.NotificationService;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.service.notification.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 通知服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl extends ServiceImpl<NotificationMapper, Notification>
        implements NotificationService {

    private final NotificationMapper notificationMapper;
    private final NotificationSettingMapper settingMapper;
    private final UserService userService;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String UNREAD_COUNT_KEY = "notification:unread:";
    private static final long UNREAD_COUNT_EXPIRE_HOURS = 24;

    @Override
    @Transactional
    public Notification create(NotificationMessage message) {
        Notification notification = new Notification();
        notification.setReceiverId(message.getReceiverId());
        notification.setSenderId(message.getSenderId());
        notification.setType(message.getType().name());
        notification.setTitle(message.getTitle());
        notification.setContent(message.getContent());
        notification.setResourceType(message.getResourceType() != null ? message.getResourceType().name() : null);
        notification.setResourceId(message.getResourceId());
        notification.setExtraData(message.getExtraData());
        notification.setIsRead(0);
        notification.setDeleted(0);

        save(notification);
        log.info("创建通知成功: id={}, type={}, receiver={}",
                notification.getId(), notification.getType(), notification.getReceiverId());
        return notification;
    }

    @Override
    public IPage<NotificationVO> getNotificationPage(Long userId, String type, Integer isRead, int page, int size) {
        Page<Notification> pageParam = new Page<>(page, size);
        IPage<Notification> notificationPage = notificationMapper.selectNotificationPage(pageParam, userId, type,
                isRead);

        return notificationPage.convert(this::toVO);
    }

    @Override
    public Long getUnreadCount(Long userId) {
        String key = UNREAD_COUNT_KEY + userId;
        Object cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            return Long.valueOf(cached.toString());
        }

        Long count = notificationMapper.countUnread(userId);
        redisTemplate.opsForValue().set(key, count, UNREAD_COUNT_EXPIRE_HOURS, TimeUnit.HOURS);
        return count;
    }

    @Override
    public Map<String, Long> getUnreadCountByType(Long userId) {
        Map<String, Long> result = new HashMap<>();
        for (NotificationType type : NotificationType.values()) {
            Long count = notificationMapper.countUnreadByType(userId, type.name());
            result.put(type.name(), count);
        }
        return result;
    }

    @Override
    @Transactional
    public boolean markAsRead(Long userId, Long notificationId) {
        Notification notification = getById(notificationId);
        if (notification == null || !notification.getReceiverId().equals(userId)) {
            return false;
        }
        if (notification.getIsRead() == 1) {
            return true;
        }

        notification.setIsRead(1);
        notification.setReadTime(LocalDateTime.now());
        boolean result = updateById(notification);

        if (result) {
            decrementUnreadCount(userId, 1);
        }
        return result;
    }

    @Override
    @Transactional
    public boolean markAllAsRead(Long userId) {
        int count = notificationMapper.markAllAsRead(userId);
        if (count > 0) {
            // 清除Redis缓存，下次查询重新计算
            redisTemplate.delete(UNREAD_COUNT_KEY + userId);
        }
        return true;
    }

    @Override
    @Transactional
    public boolean markAsReadByType(Long userId, String type) {
        int count = notificationMapper.markAsReadByType(userId, type);
        if (count > 0) {
            redisTemplate.delete(UNREAD_COUNT_KEY + userId);
        }
        return true;
    }

    @Override
    @Transactional
    public boolean deleteNotification(Long userId, Long notificationId) {
        Notification notification = getById(notificationId);
        if (notification == null || !notification.getReceiverId().equals(userId)) {
            return false;
        }

        boolean wasUnread = notification.getIsRead() == 0;
        boolean result = removeById(notificationId);

        if (result && wasUnread) {
            decrementUnreadCount(userId, 1);
        }
        return result;
    }

    @Override
    public boolean isNotificationEnabled(Long userId, NotificationType type) {
        NotificationSetting setting = getUserSetting(userId);
        if (setting == null || !Boolean.TRUE.equals(setting.getEnableAll())) {
            return false;
        }

        return switch (type) {
            case COMMENT -> Boolean.TRUE.equals(setting.getEnableComment());
            case LIKE -> Boolean.TRUE.equals(setting.getEnableLike());
            case FOLLOW -> Boolean.TRUE.equals(setting.getEnableFollow());
            case COLLECTION -> Boolean.TRUE.equals(setting.getEnableCollection());
            case SYSTEM -> Boolean.TRUE.equals(setting.getEnableSystem());
            case NEW_ARTICLE -> Boolean.TRUE.equals(setting.getEnableNewArticle());
            case MENTION -> Boolean.TRUE.equals(setting.getEnableMention());
            case STATS -> Boolean.TRUE.equals(setting.getEnableStats());
        };
    }

    @Override
    public NotificationSetting getUserSetting(Long userId) {
        LambdaQueryWrapper<NotificationSetting> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NotificationSetting::getUserId, userId);
        NotificationSetting setting = settingMapper.selectOne(wrapper);

        // 如果没有设置，返回默认全开的设置
        if (setting == null) {
            setting = createDefaultSetting(userId);
        }
        return setting;
    }

    @Override
    @Transactional
    public boolean updateUserSetting(Long userId, NotificationSetting newSetting) {
        NotificationSetting existing = getUserSetting(userId);
        if (existing.getId() == null) {
            // 新建
            newSetting.setUserId(userId);
            return settingMapper.insert(newSetting) > 0;
        } else {
            // 更新
            newSetting.setId(existing.getId());
            newSetting.setUserId(userId);
            return settingMapper.updateById(newSetting) > 0;
        }
    }

    @Override
    public void incrementUnreadCount(Long userId) {
        String key = UNREAD_COUNT_KEY + userId;
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, UNREAD_COUNT_EXPIRE_HOURS, TimeUnit.HOURS);
    }

    @Override
    public void decrementUnreadCount(Long userId, int count) {
        String key = UNREAD_COUNT_KEY + userId;
        Object cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            long newCount = Math.max(0, Long.parseLong(cached.toString()) - count);
            redisTemplate.opsForValue().set(key, newCount, UNREAD_COUNT_EXPIRE_HOURS, TimeUnit.HOURS);
        }
    }

    @Override
    public NotificationVO toVO(Notification notification) {
        NotificationVO vo = new NotificationVO();
        vo.setId(notification.getId());
        vo.setSenderId(notification.getSenderId());
        vo.setType(notification.getType());
        vo.setTitle(notification.getTitle());
        vo.setContent(notification.getContent());
        vo.setResourceType(notification.getResourceType());
        vo.setResourceId(notification.getResourceId());
        vo.setExtraData(notification.getExtraData());
        vo.setIsRead(notification.getIsRead() == 1);
        vo.setReadTime(notification.getReadTime());
        vo.setCreateTime(notification.getCreateTime());

        // 设置类型名称
        try {
            NotificationType type = NotificationType.valueOf(notification.getType());
            vo.setTypeName(type.getName());
        } catch (IllegalArgumentException e) {
            vo.setTypeName(notification.getType());
        }

        // 获取发送者信息
        if (notification.getSenderId() != null) {
            User sender = userService.getUserById(notification.getSenderId());
            if (sender != null) {
                vo.setSenderName(sender.getNickname());
                vo.setSenderAvatar(sender.getAvatar());
            }
        }

        return vo;
    }

    private NotificationSetting createDefaultSetting(Long userId) {
        NotificationSetting setting = new NotificationSetting();
        setting.setUserId(userId);
        setting.setEnableComment(true);
        setting.setEnableLike(true);
        setting.setEnableFollow(true);
        setting.setEnableCollection(true);
        setting.setEnableSystem(true);
        setting.setEnableNewArticle(true);
        setting.setEnableMention(true);
        setting.setEnableStats(true);
        setting.setEnableWebsocket(true);
        setting.setEnableBrowser(true);
        setting.setEnableAll(true);
        return setting;
    }
}
