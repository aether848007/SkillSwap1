package com.skillswap.controller;

import com.skillswap.dto.RatingCreateRequest;
import com.skillswap.repository.RatingRepository;
import com.skillswap.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
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
        return ResponseEntity.ok(ratingService.createRating(id, raterId, req));
    }

    @GetMapping("/api/users/{id}/ratings")
    public ResponseEntity<?> getUserRatings(@PathVariable UUID id) {
        return ResponseEntity.ok(ratingRepo.findByRateeUserIdOrderByCreatedAtDesc(id));
    }
}
