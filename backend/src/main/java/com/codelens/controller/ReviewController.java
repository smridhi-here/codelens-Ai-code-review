package com.codelens.controller;

import com.codelens.dto.FixResponse;
import com.codelens.dto.ReviewRequest;
import com.codelens.dto.ReviewResponse;
import com.codelens.dto.ReviewSummary;
import com.codelens.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Every method here needs a valid login token; userId comes from that token. */
@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewService service;

    public ReviewController(ReviewService service) {
        this.service = service;
    }

    @PostMapping("/review")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(@Valid @RequestBody ReviewRequest request,
                                 @AuthenticationPrincipal Long userId) {
        return service.create(request, userId);
    }

    @GetMapping("/reviews")
    public List<ReviewSummary> list(@AuthenticationPrincipal Long userId) {
        return service.list(userId);
    }

    @GetMapping("/reviews/{id}")
    public ReviewResponse get(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        return service.get(id, userId);
    }

    /** AI-corrected version of one of your reviews' code. */
    @PostMapping("/reviews/{id}/fix")
    public FixResponse fix(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        ReviewResponse review = service.get(id, userId);   // 404 if it is not yours
        return service.fix(review);
    }

    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        service.delete(id, userId);
    }
}
