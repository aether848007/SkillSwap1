package com.skillswap.controller;

import com.skillswap.dto.MatchResult;
import com.skillswap.service.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/matches")
public class MatchController {
    private final MatchService matchService;

    public MatchController(MatchService matchService) { this.matchService = matchService; }

    @GetMapping
    public ResponseEntity<List<MatchResult>> getMatches(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(matchService.findMatches(userId));
    }
}
