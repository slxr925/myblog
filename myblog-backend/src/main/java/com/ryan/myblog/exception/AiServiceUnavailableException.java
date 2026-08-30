package com.ryan.myblog.exception;

public class AiServiceUnavailableException extends RuntimeException {
    public AiServiceUnavailableException(Throwable cause) {
        super("AI 服务暂时不可用，本次不计入额度", cause);
    }
}
