package com.mirador.hotel.controller;

import com.mirador.hotel.dto.ReviewDtos;
import com.mirador.hotel.model.ReviewRules;
import com.mirador.hotel.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Guest reviews: collection, moderation and public display. */
@RestController
@RequestMapping("/api/avis")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /** Collect a review (it waits for moderation). */
    @PostMapping
    public ResponseEntity<ReviewDtos.ReviewResponse> submit(@Valid @RequestBody ReviewDtos.ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.submit(request));
    }

    /** Moderation queue; flagged reviews first. {@code ?status=EN_ATTENTE|APPROUVE|REJETE}. */
    @GetMapping
    public List<ReviewDtos.ReviewResponse> list(@RequestParam(required = false) String status) {
        return reviewService.list(status);
    }

    @GetMapping("/{id}")
    public ReviewDtos.ReviewResponse get(@PathVariable long id) {
        return reviewService.get(id);
    }

    @PutMapping("/{id}/moderation")
    public ReviewDtos.ReviewResponse moderate(@PathVariable long id, @Valid @RequestBody ReviewDtos.ModerationRequest request) {
        return reviewService.moderate(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        reviewService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Public (no token): approved reviews only, first name only. */
    @GetMapping("/public")
    public List<ReviewDtos.PublicReview> publicReviews(@RequestParam(defaultValue = "20") int limit) {
        return reviewService.publicReviews(limit);
    }

    /** Public (no token): average and distribution of the approved ratings. */
    @GetMapping("/public/summary")
    public ReviewRules.Summary summary() {
        return reviewService.summary();
    }
}
