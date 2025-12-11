package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.CollectionFolder;
import com.ryan.myblog.model.vo.CollectionFolderVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 收藏夹分类Mapper接口
 */
@Mapper
public interface CollectionFolderMapper extends BaseMapper<CollectionFolder> {

    /**
     * 获取用户的收藏夹列表
     */
    @Select("SELECT * FROM tb_collection_folder WHERE user_id = #{userId} AND deleted = 0 ORDER BY is_default DESC, sort_order ASC")
    List<CollectionFolder> getUserFolders(@Param("userId") Long userId);

    /**
     * 检查用户是否已存在同名收藏夹
     */
    @Select("SELECT COUNT(1) FROM tb_collection_folder WHERE user_id = #{userId} AND name = #{name} AND deleted = 0")
    int countByName(@Param("userId") Long userId, @Param("name") String name);

    /**
     * 更新收藏夹的收藏数量
     */
    @Update("UPDATE tb_collection_folder SET collection_count = collection_count + #{delta} WHERE id = #{folderId}")
    int updateCollectionCount(@Param("folderId") Long folderId, @Param("delta") Integer delta);

    /**
     * 获取用户收藏夹列表（包含收藏数量）
     */
    List<CollectionFolderVO> getUserFoldersWithCount(@Param("userId") Long userId);

    /**
     * 获取用户默认收藏夹
     */
    CollectionFolder getUserDefaultFolder(@Param("userId") Long userId);
}