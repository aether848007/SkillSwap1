package com.skillswap.controller;

import com.skillswap.dto.SessionRequest;
import com.skillswap.model.Session;
import com.skillswap.service.SessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    private final SessionService sessionService;

    public SessionController(SessionService s) { this.sessionService = s; }

    @PostMapping
    public ResponseEntity<?> createSession(Authentication auth, @RequestBody SessionRequest req) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(sessionService.createSession(userId, req));
    }

    @GetMapping
    public ResponseEntity<List<Session>> getMySessions(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(sessionService.getUserSessions(userId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable UUID id, @RequestParam String status) {
        return ResponseEntity.ok(sessionService.updateStatus(id, status));
    }
}
