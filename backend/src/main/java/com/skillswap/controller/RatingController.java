package com.skillswap.controller;

import com.skillswap.dto.RatingCreateRequest;
import com.skillswap.repository.RatingRepository;
import com.skillswap.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
public class RatingController {
    private final RatingService ratingService;
    private final RatingRepository ratingRepo;

    public RatingController(RatingService rs, RatingRepository rr) {
        this.ratingService = rs; this.ratingRepo = rr;
    }

    @PostMapping("/api/sessions/{id}/rating")
    public ResponseEntity<?> createRating(
            @PathVariable UUID id,
            Authentication auth,
            @Valid @RequestBody RatingCreateRequest req) {
        UUID raterId = (UUID) auth.getPrincipal();
        try {
            return ResponseEntity.ok(ratingService.createRating(id, raterId, req));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/users/{id}/ratings")
    public ResponseEntity<?> getUserRatings(@PathVariable UUID id) {
        return ResponseEntity.ok(ratingRepo.findByRateeUserIdOrderByCreatedAtDesc(id));
    }
}
