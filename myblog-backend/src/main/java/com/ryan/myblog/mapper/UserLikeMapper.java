package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.UserLike;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户点赞记录Mapper
 */
@Mapper
public interface UserLikeMapper extends BaseMapper<UserLike> {

    /**
     * 根据用户ID和目标类型、目标ID查询点赞记录
     * @param userId 用户ID
     * @param targetType 目标类型（blog/comment）
     * @param targetId 目标ID
     * @return 点赞记录
     */
    UserLike selectByUserAndTarget(@Param("userId") Long userId,
                                   @Param("targetType") String targetType,
                                   @Param("targetId") Long targetId);

    /**
     * 统计目标点赞数量
     * @param targetType 目标类型
     * @param targetId 目标ID
     * @return 点赞数量
     */
    Long countByTarget(@Param("targetType") String targetType,
                       @Param("targetId") Long targetId);
}