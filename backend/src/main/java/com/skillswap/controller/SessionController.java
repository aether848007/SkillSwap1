package com.skillswap.controller;

import com.skillswap.dto.ScheduleRequest;
import com.skillswap.model.Session;
import com.skillswap.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    private final SessionService sessionService;

    public SessionController(SessionService s) { this.sessionService = s; }

    /** Sessions the caller participates in (across all their exchanges). */
    @GetMapping
    public ResponseEntity<List<Session>> getMySessions(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(sessionService.getUserSessions(userId));
    }

    /** Learner proposes / re-proposes a time. DRAFT|DECLINED|CONFIRMED -> REQUESTED. */
    @PatchMapping("/{id}/schedule")
    public ResponseEntity<?> schedule(Authentication auth, @PathVariable UUID id,
                                      @Valid @RequestBody ScheduleRequest req) {
        UUID callerId = (UUID) auth.getPrincipal();
        try {
            return ResponseEntity.ok(sessionService.schedule(callerId, id, req.getScheduledAt()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Transition a session: confirm / decline / start / complete / cancel. */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(Authentication auth, @PathVariable UUID id, @RequestParam String status) {
        UUID callerId = (UUID) auth.getPrincipal();
        try {
            return ResponseEntity.ok(sessionService.updateStatus(callerId, id, status));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
