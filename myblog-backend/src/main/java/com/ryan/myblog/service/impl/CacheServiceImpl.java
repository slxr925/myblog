package com.ryan.myblog.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ryan.myblog.service.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 缓存服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheServiceImpl implements CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    // 创建一个ObjectMapper实例，并注册Java 8时间模块
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Override
    public void set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
            log.debug("缓存设置成功: key={}", key);
        } catch (Exception e) {
            log.error("缓存设置失败: key={}, error={}", key, e.getMessage());
        }
    }

    @Override
    public void set(String key, Object value, long seconds) {
        try {
            redisTemplate.opsForValue().set(key, value, seconds, TimeUnit.SECONDS);
            log.debug("缓存设置成功（带过期时间）: key={}, seconds={}", key, seconds);
        } catch (Exception e) {
            log.error("缓存设置失败: key={}, error={}", key, e.getMessage());
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }

            if (clazz.isInstance(value)) {
                return (T) value;
            }

            // 如果类型不匹配，尝试JSON转换
            if (value instanceof String) {
                return objectMapper.readValue((String) value, clazz);
            }

            // 尝试通过JSON序列化转换
            String json = objectMapper.writeValueAsString(value);
            return objectMapper.readValue(json, clazz);

        } catch (JsonProcessingException e) {
            log.error("缓存JSON转换失败: key={}, error={}", key, e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("缓存获取失败: key={}, error={}", key, e.getMessage());
            return null;
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> List<T> getList(String key, Class<T> elementType) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }

            // 如果已经是List类型
            if (value instanceof List) {
                List<?> list = (List<?>) value;
                if (list.isEmpty()) {
                    return new ArrayList<>();
                }

                // 检查第一个元素是否已经是目标类型
                Object firstElement = list.get(0);
                if (elementType.isInstance(firstElement)) {
                    return (List<T>) list;
                }

                // 需要转换每个元素
                List<T> result = new ArrayList<>();
                for (Object item : list) {
                    String json = objectMapper.writeValueAsString(item);
                    T converted = objectMapper.readValue(json, elementType);
                    result.add(converted);
                }
                return result;
            }

            // 如果是JSON字符串
            if (value instanceof String) {
                return objectMapper.readValue((String) value,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, elementType));
            }

            return null;
        } catch (JsonProcessingException e) {
            log.error("缓存列表JSON转换失败: key={}, error={}", key, e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("缓存列表获取失败: key={}, error={}", key, e.getMessage());
            return null;
        }
    }

    @Override
    public void delete(String key) {
        try {
            redisTemplate.delete(key);
            log.debug("缓存删除成功: key={}", key);
        } catch (Exception e) {
            log.error("缓存删除失败: key={}, error={}", key, e.getMessage());
        }
    }

    @Override
    public boolean exists(String key) {
        try {
            Boolean result = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("缓存检查失败: key={}, error={}", key, e.getMessage());
            return false;
        }
    }

    @Override
    public void expire(String key, long seconds) {
        try {
            redisTemplate.expire(key, seconds, TimeUnit.SECONDS);
            log.debug("缓存过期时间设置成功: key={}, seconds={}", key, seconds);
        } catch (Exception e) {
            log.error("缓存过期时间设置失败: key={}, error={}", key, e.getMessage());
        }
    }

    @Override
    public void multiSet(Map<String, Object> keyValues) {
        try {
            redisTemplate.opsForValue().multiSet(keyValues);
            log.debug("批量缓存设置成功: count={}", keyValues.size());
        } catch (Exception e) {
            log.error("批量缓存设置失败: error={}", e.getMessage());
        }
    }

    @Override
    public void multiSet(Map<String, Object> keyValues, long seconds) {
        try {
            // Redis没有原生的批量设置带过期时间的命令，使用Pipeline优化
            redisTemplate.executePipelined((org.springframework.data.redis.core.RedisCallback<Object>) connection -> {
                keyValues.forEach((key, value) -> {
                    redisTemplate.opsForValue().set(key, value, seconds, TimeUnit.SECONDS);
                });
                return null;
            });
            log.debug("批量缓存设置成功（带过期时间）: count={}, seconds={}", keyValues.size(), seconds);
        } catch (Exception e) {
            log.error("批量缓存设置失败: error={}", e.getMessage());
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> List<T> multiGet(List<String> keys, Class<T> clazz) {
        try {
            List<Object> values = redisTemplate.opsForValue().multiGet(keys);
            if (values == null) {
                return new ArrayList<>();
            }

            return values.stream()
                    .map(value -> {
                        if (value == null) {
                            return null;
                        }
                        try {
                            if (clazz.isInstance(value)) {
                                return (T) value;
                            }

                            if (value instanceof String) {
                                return objectMapper.readValue((String) value, clazz);
                            }

                            String json = objectMapper.writeValueAsString(value);
                            return objectMapper.readValue(json, clazz);
                        } catch (JsonProcessingException e) {
                            log.error("批量缓存JSON转换失败: error={}", e.getMessage());
                            return null;
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("批量缓存获取失败: error={}", e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    public void multiDelete(List<String> keys) {
        try {
            redisTemplate.delete(keys);
            log.debug("批量缓存删除成功: count={}", keys.size());
        } catch (Exception e) {
            log.error("批量缓存删除失败: error={}", e.getMessage());
        }
    }

    @Override
    public void deleteByPattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("模式匹配缓存删除成功: pattern={}, count={}", pattern, keys.size());
            }
        } catch (Exception e) {
            log.error("模式匹配缓存删除失败: pattern={}, error={}", pattern, e.getMessage());
        }
    }

    @Override
    public Set<String> getKeysByPattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            return keys != null ? keys : new HashSet<>();
        } catch (Exception e) {
            log.error("模式匹配键获取失败: pattern={}, error={}", pattern, e.getMessage());
            return new HashSet<>();
        }
    }

    @Override
    public long getExpire(String key) {
        try {
            Long expire = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            return expire != null ? expire : -1;
        } catch (Exception e) {
            log.error("缓存过期时间获取失败: key={}, error={}", key, e.getMessage());
            return -1;
        }
    }

    @Override
    public long increment(String key) {
        return increment(key, 1);
    }

    @Override
    public long increment(String key, long delta) {
        try {
            Long result = redisTemplate.opsForValue().increment(key, delta);
            log.debug("缓存自增成功: key={}, delta={}, result={}", key, delta, result);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("缓存自增失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    @Override
    public long getSize(String key) {
        try {
            Long size = redisTemplate.opsForValue().size(key);
            return size != null ? size : 0;
        } catch (Exception e) {
            log.error("缓存大小获取失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    @Override
    public void clear() {
        try {
            Set<String> keys = redisTemplate.keys("*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("所有缓存清除成功: count={}", keys.size());
            }
        } catch (Exception e) {
            log.error("清除所有缓存失败: error={}", e.getMessage());
        }
    }

    @Override
    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        try {
            // 获取Redis信息
            Properties info = redisTemplate.getConnectionFactory().getConnection().info();
            if (info != null) {
                stats.put("used_memory", info.getProperty("used_memory_human"));
                stats.put("connected_clients", info.getProperty("connected_clients"));
                stats.put("total_commands_processed", info.getProperty("total_commands_processed"));
                stats.put("keyspace_hits", info.getProperty("keyspace_hits"));
                stats.put("keyspace_misses", info.getProperty("keyspace_misses"));
            }

            // 获取缓存键数量
            Set<String> keys = redisTemplate.keys("*");
            stats.put("total_keys", keys != null ? keys.size() : 0);

            // 按前缀统计
            Map<String, Long> keyPrefixStats = new HashMap<>();
            if (keys != null) {
                keys.forEach(key -> {
                    String prefix = key.contains(":") ? key.substring(0, key.indexOf(":")) : "other";
                    keyPrefixStats.merge(prefix, 1L, Long::sum);
                });
            }
            stats.put("key_prefix_stats", keyPrefixStats);

        } catch (Exception e) {
            log.error("获取缓存统计信息失败: error={}", e.getMessage());
            stats.put("error", e.getMessage());
        }
        return stats;
    }
}