package com.ryan.myblog.exception;

public class DuplicateAiRequestException extends RuntimeException {
    public DuplicateAiRequestException() {
        super("该 AI 请求已处理，请勿重复提交");
    }
}
