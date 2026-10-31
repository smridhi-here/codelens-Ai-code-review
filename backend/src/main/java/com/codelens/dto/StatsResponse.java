package com.codelens.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Numbers for the Stats page (all for the logged-in user only). */
public record StatsResponse(
        int totalReviews,
        double averageScore,
        int bestScore,
        long totalIssues,
        Map<String, Long> issuesBySeverity,
        List<RuleCount> issuesByRule,
        List<ScorePoint> scoreTrend,
        Map<String, Long> reviewsByLanguage
) {
    public record RuleCount(String rule, long count) {}

    public record ScorePoint(Long id, LocalDateTime date, int score) {}
}
