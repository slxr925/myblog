package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.mapper.UserBlockMapper;
import com.ryan.myblog.model.entity.UserBlock;
import com.ryan.myblog.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserBlockServiceImpl implements UserBlockService {

    private final UserBlockMapper userBlockMapper;

    @Override
    public void blockUser(Long blockerId, Long blockedId) {
        if (blockerId == null || blockedId == null || blockerId.equals(blockedId)) {
            return;
        }
        LambdaQueryWrapper<UserBlock> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserBlock::getBlockerId, blockerId).eq(UserBlock::getBlockedId, blockedId);
        if (userBlockMapper.selectCount(wrapper) > 0) {
            return;
        }
        UserBlock block = new UserBlock();
        block.setBlockerId(blockerId);
        block.setBlockedId(blockedId);
        block.setCreateTime(LocalDateTime.now());
        userBlockMapper.insert(block);
    }

    @Override
    public void unblockUser(Long blockerId, Long blockedId) {
        LambdaQueryWrapper<UserBlock> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserBlock::getBlockerId, blockerId).eq(UserBlock::getBlockedId, blockedId);
        userBlockMapper.delete(wrapper);
    }

    @Override
    public boolean isBlocked(Long blockerId, Long blockedId) {
        if (blockerId == null || blockedId == null) {
            return false;
        }
        LambdaQueryWrapper<UserBlock> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserBlock::getBlockerId, blockerId).eq(UserBlock::getBlockedId, blockedId);
        return userBlockMapper.selectCount(wrapper) > 0;
    }

    @Override
    public List<Long> getBlockedUserIds(Long blockerId) {
        LambdaQueryWrapper<UserBlock> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserBlock::getBlockerId, blockerId);
        List<UserBlock> blocks = userBlockMapper.selectList(wrapper);
        return blocks.stream().map(UserBlock::getBlockedId).collect(Collectors.toList());
    }
}
