package com.ryan.myblog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI标题生成响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AITitleResponse {
    private String title;
}
