package com.codelens.service;

import com.codelens.dto.AiResponse;
import com.codelens.dto.FixResponse;
import com.codelens.dto.IssueDto;
import com.codelens.dto.ReviewRequest;
import com.codelens.dto.ReviewResponse;
import com.codelens.dto.ReviewSummary;
import com.codelens.entity.Issue;
import com.codelens.entity.Review;
import com.codelens.repository.ReviewRepository;
import com.codelens.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository repository;
    private final UserRepository userRepository;
    private final AiEngineClient aiEngine;

    public ReviewService(ReviewRepository repository, UserRepository userRepository, AiEngineClient aiEngine) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.aiEngine = aiEngine;
    }

    /** 1) ask Python to analyse  2) save result in SQL for this user  3) return it. */
    public ReviewResponse create(ReviewRequest request, Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in again"));

        AiResponse ai = aiEngine.analyze(request);

        Review review = new Review();
        review.setUser(user);
        review.setLanguage(request.language().toLowerCase());
        review.setCode(request.code());
        review.setScore(ai.score());
        review.setSummary(ai.summary());

        if (ai.issues() != null) {
            for (IssueDto dto : ai.issues()) {
                Issue issue = new Issue();
                issue.setSeverity(dto.severity());
                issue.setRule(dto.rule());
                issue.setLine(dto.line());
                issue.setMessage(dto.message());
                issue.setSuggestion(dto.suggestion());
                review.addIssue(issue);
            }
        }
        return toResponse(repository.save(review));
    }

    /** Only this user's reviews. */
    @Transactional(readOnly = true)
    public List<ReviewSummary> list(Long userId) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(r -> new ReviewSummary(
                        r.getId(),
                        r.getLanguage(),
                        preview(r.getCode()),
                        r.getScore(),
                        r.getIssues().size(),
                        r.getCreatedAt()))
                .toList();
    }

    /** 404 (not 403) when it belongs to someone else, so ids are not revealed. */
    @Transactional(readOnly = true)
    public ReviewResponse get(Long id, Long userId) {
        Review review = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
        return toResponse(review);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Review review = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
        repository.delete(review);
    }

    /** Ask the AI engine for a corrected version of an already-loaded review. */
    public FixResponse fix(ReviewResponse review) {
        return aiEngine.fix(review.language(), review.code(), review.issues());
    }

    private ReviewResponse toResponse(Review r) {
        List<IssueDto> issues = r.getIssues().stream()
                .map(i -> new IssueDto(i.getSeverity(), i.getRule(), i.getLine(), i.getMessage(), i.getSuggestion()))
                .toList();
        return new ReviewResponse(r.getId(), r.getLanguage(), r.getCode(),
                r.getScore(), r.getSummary(), r.getCreatedAt(), issues);
    }

    /** First non-empty line of the code, shortened, for the history table. */
    private String preview(String code) {
        for (String line : code.split("\\R")) {
            String t = line.trim();
            if (!t.isEmpty()) {
                return t.length() > 60 ? t.substring(0, 60) + "..." : t;
            }
        }
        return "";
    }
}
