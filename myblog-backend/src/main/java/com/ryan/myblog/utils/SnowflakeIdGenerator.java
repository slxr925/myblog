package com.ryan.myblog.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/**
 * 雪花算法ID生成器
 * 
 * 生成64位唯一ID，结构如下：
 * +------+----------------------+----------------+--------------+
 * | 1bit | 41bits | 10bits | 12bits |
 * +------+----------------------+----------------+--------------+
 * | 符号 | 时间戳 | 机器ID | 序列号 |
 * +------+----------------------+----------------+--------------+
 * 
 * - 1位符号位：固定为0，表示正数
 * - 41位时间戳：当前时间与起始时间的毫秒差值，可用约69年
 * - 10位机器ID：5位数据中心ID (0-31) + 5位机器ID (0-31)，共支持1024个节点
 * - 12位序列号：每毫秒最多生成4096个ID
 * 
 * 特点：
 * - 趋势递增：ID大致按时间有序
 * - 高性能：本地生成，无网络开销
 * - 可扩展：支持分布式部署
 * 
 * 面试要点：
 * 1. 为什么不用UUID？
 * - UUID无序，会导致B+Tree页分裂，影响数据库性能
 * - 雪花ID趋势递增，插入性能更好
 * 
 * 2. 时钟回拨问题如何处理？
 * - 方案一：等待时钟追上（本实现采用）
 * - 方案二：使用预留位或直接报错
 * - 方案三：使用NTP时钟同步
 * 
 * 3. 机器ID如何分配？
 * - 通过配置文件手动配置
 * - 使用ZooKeeper/Redis自动分配
 * - 使用MAC地址/IP地址计算
 */
@Slf4j
@Component
public class SnowflakeIdGenerator {

    /**
     * 起始时间戳（2024-01-01 00:00:00）
     * 这个时间一旦确定就不能修改
     */
    private static final long START_TIMESTAMP = 1704067200000L;

    /**
     * 各部分占用的位数
     */
    private static final long DATACENTER_ID_BITS = 5L;
    private static final long WORKER_ID_BITS = 5L;
    private static final long SEQUENCE_BITS = 12L;

    /**
     * 各部分的最大值
     */
    private static final long MAX_DATACENTER_ID = ~(-1L << DATACENTER_ID_BITS); // 31
    private static final long MAX_WORKER_ID = ~(-1L << WORKER_ID_BITS); // 31
    private static final long SEQUENCE_MASK = ~(-1L << SEQUENCE_BITS); // 4095

    /**
     * 各部分左移位数
     */
    private static final long WORKER_ID_SHIFT = SEQUENCE_BITS;
    private static final long DATACENTER_ID_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;
    private static final long TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS + DATACENTER_ID_BITS;

    /**
     * 数据中心ID（0-31）
     */
    @Value("${myblog.snowflake.datacenter-id:0}")
    private long datacenterId;

    /**
     * 机器ID（0-31）
     */
    @Value("${myblog.snowflake.worker-id:0}")
    private long workerId;

    /**
     * 序列号
     */
    private long sequence = 0L;

    /**
     * 上次生成ID的时间戳
     */
    private long lastTimestamp = -1L;

    @PostConstruct
    public void init() {
        // 验证配置
        if (datacenterId > MAX_DATACENTER_ID || datacenterId < 0) {
            throw new IllegalArgumentException(
                    String.format("数据中心ID必须在0-%d之间", MAX_DATACENTER_ID));
        }
        if (workerId > MAX_WORKER_ID || workerId < 0) {
            throw new IllegalArgumentException(
                    String.format("机器ID必须在0-%d之间", MAX_WORKER_ID));
        }
        log.info("雪花算法ID生成器初始化完成 - datacenterId: {}, workerId: {}",
                datacenterId, workerId);
    }

    /**
     * 生成下一个ID
     * 线程安全
     */
    public synchronized long nextId() {
        long currentTimestamp = getCurrentTimestamp();

        // 时钟回拨检测
        if (currentTimestamp < lastTimestamp) {
            long offset = lastTimestamp - currentTimestamp;
            if (offset <= 5) {
                // 回拨时间较短，等待时钟追上
                try {
                    Thread.sleep(offset << 1);
                    currentTimestamp = getCurrentTimestamp();
                    if (currentTimestamp < lastTimestamp) {
                        throw new RuntimeException(
                                String.format("时钟回拨，拒绝生成ID。回拨时间: %d毫秒", offset));
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("等待时钟同步被中断", e);
                }
            } else {
                throw new RuntimeException(
                        String.format("时钟回拨，拒绝生成ID。回拨时间: %d毫秒", offset));
            }
        }

        // 同一毫秒内，序列号递增
        if (currentTimestamp == lastTimestamp) {
            sequence = (sequence + 1) & SEQUENCE_MASK;
            // 序列号溢出，等待下一毫秒
            if (sequence == 0) {
                currentTimestamp = waitNextMillis(lastTimestamp);
            }
        } else {
            // 不同毫秒，序列号重置
            sequence = 0L;
        }

        lastTimestamp = currentTimestamp;

        // 组装ID
        return ((currentTimestamp - START_TIMESTAMP) << TIMESTAMP_SHIFT)
                | (datacenterId << DATACENTER_ID_SHIFT)
                | (workerId << WORKER_ID_SHIFT)
                | sequence;
    }

    /**
     * 生成ID并转换为字符串
     */
    public String nextIdStr() {
        return String.valueOf(nextId());
    }

    /**
     * 解析ID中的时间戳
     */
    public long parseTimestamp(long id) {
        return (id >> TIMESTAMP_SHIFT) + START_TIMESTAMP;
    }

    /**
     * 解析ID中的数据中心ID
     */
    public long parseDatacenterId(long id) {
        return (id >> DATACENTER_ID_SHIFT) & MAX_DATACENTER_ID;
    }

    /**
     * 解析ID中的机器ID
     */
    public long parseWorkerId(long id) {
        return (id >> WORKER_ID_SHIFT) & MAX_WORKER_ID;
    }

    /**
     * 解析ID中的序列号
     */
    public long parseSequence(long id) {
        return id & SEQUENCE_MASK;
    }

    /**
     * 获取当前时间戳（毫秒）
     */
    private long getCurrentTimestamp() {
        return System.currentTimeMillis();
    }

    /**
     * 等待直到下一毫秒
     */
    private long waitNextMillis(long lastTime) {
        long timestamp = getCurrentTimestamp();
        while (timestamp <= lastTime) {
            timestamp = getCurrentTimestamp();
        }
        return timestamp;
    }
}
