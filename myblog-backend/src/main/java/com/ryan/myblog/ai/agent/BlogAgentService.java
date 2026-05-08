package com.ryan.myblog.ai.agent;

import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.model.dto.AIChatResponse;

public interface BlogAgentService {

    boolean isAvailable();

    AIChatResponse chat(AIChatRequest request);
}
