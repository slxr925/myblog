package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.UserFollow;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户关注关系 Mapper 接口
 */
@Mapper
public interface UserFollowMapper extends BaseMapper<UserFollow> {

    /**
     * 物理删除关注记录（绕过逻辑删除）
     */
    @Delete("DELETE FROM tb_user_follow WHERE id = #{id}")
    int physicalDeleteById(@Param("id") Long id);

    /**
     * 物理删除指定关注关系的所有记录
     */
    @Delete("DELETE FROM tb_user_follow WHERE follower_id = #{followerId} AND followee_id = #{followeeId}")
    int physicalDeleteByFollowerAndFollowee(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);
}
