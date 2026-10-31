package com.codelens.dto;

/** One finding. Same shape the Python engine returns and the frontend shows. */
public record IssueDto(
        String severity,
        String rule,
        Integer line,
        String message,
        String suggestion
) {}
