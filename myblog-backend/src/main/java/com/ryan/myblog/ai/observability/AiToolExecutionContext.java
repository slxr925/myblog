package com.ryan.myblog.ai.observability;

public final class AiToolExecutionContext {

    private static final ThreadLocal<Context> CURRENT = new ThreadLocal<>();

    private AiToolExecutionContext() {
    }

    public static void set(Context context) {
        CURRENT.set(context);
    }

    public static Context get() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }

    public static final class Context {
        private final String conversationId;
        private final Long userId;
        private final Long messageId;
        private final java.util.concurrent.atomic.AtomicInteger toolCallCount = new java.util.concurrent.atomic.AtomicInteger();

        public Context(String conversationId, Long userId, Long messageId) {
            this.conversationId = conversationId;
            this.userId = userId;
            this.messageId = messageId;
        }

        public String conversationId() {
            return conversationId;
        }

        public Long userId() {
            return userId;
        }

        public Long messageId() {
            return messageId;
        }

        public int incrementToolCallCount() {
            return toolCallCount.incrementAndGet();
        }

        public int toolCallCount() {
            return toolCallCount.get();
        }
    }
}
