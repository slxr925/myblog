package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.model.entity.UserCollection;
import com.ryan.myblog.model.vo.UserCollectionVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 用户收藏Mapper接口
 */
@Mapper
public interface UserCollectionMapper extends BaseMapper<UserCollection> {

    /**
     * 检查用户是否已收藏
     */
    @Select("SELECT COUNT(1) FROM tb_user_collection WHERE user_id = #{userId} AND target_type = #{targetType} AND target_id = #{targetId} AND deleted = 0")
    int checkCollected(@Param("userId") Long userId, @Param("targetType") String targetType, @Param("targetId") Long targetId);

    /**
     * 获取用户收藏列表（带博客信息）
     */
    IPage<UserCollectionVO> getUserCollectionsPage(Page<UserCollectionVO> page,
                                                  @Param("userId") Long userId,
                                                  @Param("folderId") Long folderId);

    /**
     * 批量移动收藏到其他文件夹
     */
    @Update("<script>" +
            "UPDATE tb_user_collection SET folder_id = #{targetFolderId} " +
            "WHERE id IN " +
            "<foreach collection='collectionIds' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            " AND user_id = #{userId} AND deleted = 0" +
            "</script>")
    int batchMove(@Param("userId") Long userId, @Param("targetFolderId") Long targetFolderId, @Param("collectionIds") List<Long> collectionIds);

    /**
     * 获取用户所有收藏（不分文件夹）
     */
    IPage<UserCollectionVO> getUserAllCollectionsPage(Page<UserCollectionVO> page, @Param("userId") Long userId);

    /**
     * 根据用户和目标获取收藏记录
     */
    UserCollection selectByUserAndTarget(@Param("userId") Long userId,
                                       @Param("targetType") String targetType,
                                       @Param("targetId") Long targetId);

    /**
     * 逻辑删除收藏记录
     */
    @Update("UPDATE tb_user_collection SET deleted = 1, update_time = NOW() WHERE id = #{id}")
    int logicalDelete(@Param("id") Long id);

    /**
     * 批量逻辑删除收藏记录
     */
    @Update("<script>" +
            "UPDATE tb_user_collection SET deleted = 1, update_time = NOW() " +
            "WHERE id IN " +
            "<foreach collection='collectionIds' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            " AND user_id = #{userId} AND deleted = 0" +
            "</script>")
    int batchLogicalDelete(@Param("userId") Long userId, @Param("collectionIds") List<Long> collectionIds);

    /**
     * 物理删除收藏记录（绕过逻辑删除）
     */
    @org.apache.ibatis.annotations.Delete("DELETE FROM tb_user_collection WHERE id = #{id}")
    int physicalDeleteById(@Param("id") Long id);
}