package com.ryan.myblog.service.impl;

import com.ryan.myblog.common.RedisKeyFactory;
import com.ryan.myblog.enums.CaptchaVerificationResult;
import com.ryan.myblog.model.dto.CaptchaDTO;
import com.ryan.myblog.service.CaptchaService;
import com.ryan.myblog.service.UnifiedCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Random;
import java.util.UUID;

/**
 * 验证码服务实现
 * 使用统一缓存服务管理验证码生命周期
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CaptchaServiceImpl implements CaptchaService {

    // 使用统一缓存服务，纳入项目缓存管理体系
    private final UnifiedCacheService cacheService;

    private static final int WIDTH = 120;
    private static final int HEIGHT = 40;
    private static final int CODE_LENGTH = 4;

    // 排除易混淆字符: 0,O,l,1,I
    private static final String CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    @Override
    public CaptchaDTO generateCaptcha() {
        // 1. 生成随机验证码
        String code = RandomStringUtils.secure().next(CODE_LENGTH, CHARS.toCharArray());

        // 2. 生成验证码图片
        BufferedImage image = createCaptchaImage(code);

        // 3. 转Base64
        String base64Image = imageToBase64(image);

        // 4. 使用统一缓存服务存储
        // 自动使用RedisKeyFactory.CAPTCHA定义的TTL（5分钟）
        String captchaId = UUID.randomUUID().toString();
        cacheService.set(
                RedisKeyFactory.CAPTCHA, // 使用枚举，自动生成key: myblog:captcha:{captchaId}
                code.toLowerCase(),
                captchaId);

        log.info("生成验证码: id={}", captchaId);

        return new CaptchaDTO(captchaId, base64Image);
    }

    @Override
    public CaptchaVerificationResult verifyCaptcha(String captchaId, String userCode) {
        if (StringUtils.isBlank(captchaId) || StringUtils.isBlank(userCode)) {
            log.warn("验证码ID或用户输入为空");
            return CaptchaVerificationResult.INCORRECT;
        }

        // 使用统一缓存服务获取
        String correctCode = cacheService.get(
                RedisKeyFactory.CAPTCHA,
                String.class,
                captchaId);

        // 验证码不存在或已过期
        if (correctCode == null) {
            log.warn("验证码不存在或已过期: {}", captchaId);
            return CaptchaVerificationResult.EXPIRED;
        }

        // 验证码正确性
        boolean isValid = correctCode.equalsIgnoreCase(userCode.trim());

        if (isValid) {
            // 验证成功，删除验证码（一次性使用）
            cacheService.delete(RedisKeyFactory.CAPTCHA, captchaId);
            log.info("验证码校验成功: id={}", captchaId);
            return CaptchaVerificationResult.SUCCESS;
        } else {
            // 验证失败，保留验证码供用户重试
            log.warn("验证码校验失败: id={}, 用户输入={}", captchaId, userCode);
            return CaptchaVerificationResult.INCORRECT;
        }
    }

    /**
     * 创建验证码图片
     */
    private BufferedImage createCaptchaImage(String code) {
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        Random random = new Random();

        // 设置抗锯齿
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // 设置背景
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, WIDTH, HEIGHT);

        // 绘制干扰线
        g.setColor(Color.LIGHT_GRAY);
        for (int i = 0; i < 5; i++) {
            int x1 = random.nextInt(WIDTH);
            int y1 = random.nextInt(HEIGHT);
            int x2 = random.nextInt(WIDTH);
            int y2 = random.nextInt(HEIGHT);
            g.drawLine(x1, y1, x2, y2);
        }

        // 绘制字符
        g.setFont(new Font("Arial", Font.BOLD, 28));
        for (int i = 0; i < code.length(); i++) {
            // 随机颜色
            g.setColor(new Color(random.nextInt(100), random.nextInt(100), random.nextInt(100)));
            // 随机位置
            int x = 20 + i * 25;
            int y = 25 + random.nextInt(10);
            g.drawString(String.valueOf(code.charAt(i)), x, y);
        }

        // 绘制噪点
        for (int i = 0; i < 50; i++) {
            int x = random.nextInt(WIDTH);
            int y = random.nextInt(HEIGHT);
            g.setColor(new Color(random.nextInt(255), random.nextInt(255), random.nextInt(255)));
            g.fillOval(x, y, 1, 1);
        }

        g.dispose();
        return image;
    }

    /**
     * 将图片转为Base64
     */
    private String imageToBase64(BufferedImage image) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", baos);
            byte[] bytes = baos.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (IOException e) {
            log.error("验证码图片转换失败", e);
            throw new RuntimeException("验证码图片转换失败", e);
        }
    }
}
