package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.NotificationSetting;
import org.apache.ibatis.annotations.Mapper;

/**
 * 通知设置Mapper接口
 */
@Mapper
public interface NotificationSettingMapper extends BaseMapper<NotificationSetting> {
}
