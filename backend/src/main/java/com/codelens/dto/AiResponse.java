package com.codelens.dto;

import java.util.List;

/** JSON returned by the Python engine's POST /analyze. */
public record AiResponse(int score, String summary, List<IssueDto> issues) {}
