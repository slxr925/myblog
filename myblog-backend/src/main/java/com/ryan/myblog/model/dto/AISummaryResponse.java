package com.ryan.myblog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI摘要生成响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AISummaryResponse {
    private String summary;
}
