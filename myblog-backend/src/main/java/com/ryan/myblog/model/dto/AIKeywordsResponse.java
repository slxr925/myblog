package com.ryan.myblog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI关键词提取响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIKeywordsResponse {
    private List<String> keywords;
}
