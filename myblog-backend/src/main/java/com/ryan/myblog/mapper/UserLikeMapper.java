package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.UserLike;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 用户点赞记录Mapper
 */
@Mapper
public interface UserLikeMapper extends BaseMapper<UserLike> {

    /**
     * 根据用户ID和目标类型、目标ID查询点赞记录
     * 
     * @param userId     用户ID
     * @param targetType 目标类型（blog/comment）
     * @param targetId   目标ID
     * @return 点赞记录
     */
    UserLike selectByUserAndTarget(@Param("userId") Long userId,
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId);

    /**
     * 统计目标点赞数量
     * 
     * @param targetType 目标类型
     * @param targetId   目标ID
     * @return 点赞数量
     */
    Long countByTarget(@Param("targetType") String targetType,
            @Param("targetId") Long targetId);

    /**
     * 查询博客的所有点赞记录
     * 用于数据同步
     * 
     * @param blogId 博客ID
     * @return 点赞记录列表
     */
    @Select("SELECT * FROM user_like WHERE target_type = 'blog' AND target_id = #{blogId}")
    List<UserLike> selectByBlogId(@Param("blogId") Long blogId);

    /**
     * 更新用户点赞状态
     * 用于数据同步时修正状态
     * 
     * @param userId 用户ID
     * @param blogId 博客ID
     * @param status 状态（0-未点赞，1-已点赞）
     */
    @Update("UPDATE user_like SET status = #{status}, update_time = NOW() " +
            "WHERE user_id = #{userId} AND target_type = 'blog' AND target_id = #{blogId}")
    void updateStatus(@Param("userId") Long userId,
            @Param("blogId") Long blogId,
            @Param("status") Integer status);
}