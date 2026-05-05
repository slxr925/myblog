package com.ryan.myblog.service;

/**
 * AI功能动作，用于区分不同调用的输出上限和观测日志。
 */
public enum AiAction {
    CHAT,
    TITLE,
    SUMMARY,
    KEYWORDS,
    POLISH
}
