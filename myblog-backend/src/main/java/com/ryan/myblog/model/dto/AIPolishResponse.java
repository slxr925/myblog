package com.ryan.myblog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI文章润色响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIPolishResponse {
    private String polishedContent;
}
