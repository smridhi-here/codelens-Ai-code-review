package com.codelens.dto;

import java.time.LocalDateTime;
import java.util.List;

/** Full review, returned after submitting and when opening one review. */
public record ReviewResponse(
        Long id,
        String language,
        String code,
        int score,
        String summary,
        LocalDateTime createdAt,
        List<IssueDto> issues
) {}
