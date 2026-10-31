package com.codelens.service;

import com.codelens.dto.StatsResponse;
import com.codelens.dto.StatsResponse.RuleCount;
import com.codelens.dto.StatsResponse.ScorePoint;
import com.codelens.entity.Issue;
import com.codelens.entity.Review;
import com.codelens.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Builds the numbers shown on the Stats page. */
@Service
public class StatsService {

    private final ReviewRepository repository;

    public StatsService(ReviewRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public StatsResponse stats(Long userId) {
        List<Review> reviews = repository.findAllByUserIdOrderByCreatedAtDesc(userId);

        double average = reviews.stream().mapToInt(Review::getScore).average().orElse(0);
        int best = reviews.stream().mapToInt(Review::getScore).max().orElse(0);

        long totalIssues = 0;
        Map<String, Long> bySeverity = new LinkedHashMap<>();
        Map<String, Long> byRule = new HashMap<>();
        for (Review review : reviews) {
            for (Issue issue : review.getIssues()) {
                totalIssues++;
                bySeverity.merge(issue.getSeverity(), 1L, Long::sum);
                byRule.merge(issue.getRule(), 1L, Long::sum);
            }
        }

        List<RuleCount> topRules = byRule.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .map(entry -> new RuleCount(entry.getKey(), entry.getValue()))
                .toList();

        // Score trend: oldest first, last 20 reviews.
        List<Review> oldestFirst = new ArrayList<>(reviews);
        Collections.reverse(oldestFirst);
        int from = Math.max(0, oldestFirst.size() - 20);
        List<ScorePoint> trend = oldestFirst.subList(from, oldestFirst.size()).stream()
                .map(r -> new ScorePoint(r.getId(), r.getCreatedAt(), r.getScore()))
                .toList();

        Map<String, Long> byLanguage = reviews.stream()
                .collect(Collectors.groupingBy(Review::getLanguage, Collectors.counting()));

        return new StatsResponse(
                reviews.size(),
                Math.round(average * 10) / 10.0,
                best,
                totalIssues,
                bySeverity,
                topRules,
                trend,
                byLanguage);
    }
}
