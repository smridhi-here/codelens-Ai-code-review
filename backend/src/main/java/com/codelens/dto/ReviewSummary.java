package com.codelens.dto;

import java.time.LocalDateTime;

/** One row of the History page. */
public record ReviewSummary(
        Long id,
        String language,
        String preview,
        int score,
        int issueCount,
        LocalDateTime createdAt
) {}
