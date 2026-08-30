package com.ryan.myblog.exception;

public class AiQuotaExceededException extends RuntimeException {
    public AiQuotaExceededException() {
        super("今日 AI 使用次数已用完");
    }
}
