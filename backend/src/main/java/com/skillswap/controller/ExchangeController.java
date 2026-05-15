package com.skillswap.controller;

import com.skillswap.model.Exchange;
import com.skillswap.model.Session;
import com.skillswap.model.Skill;
import com.skillswap.model.User;
import com.skillswap.repository.RatingRepository;
import com.skillswap.service.ExchangeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/exchanges")
public class ExchangeController {
    private final ExchangeService exchangeService;
    private final RatingRepository ratingRepo;

    public ExchangeController(ExchangeService e, RatingRepository r) {
        this.exchangeService = e; this.ratingRepo = r;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> myExchanges(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Exchange ex : exchangeService.listForUser(userId)) {
            out.add(summary(ex, userId));
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(Authentication auth, @PathVariable UUID id) {
        UUID userId = (UUID) auth.getPrincipal();
        try {
            Exchange ex = exchangeService.getDetail(id, userId);
            Map<String, Object> body = summary(ex, userId);
            List<Map<String, Object>> sessions = new ArrayList<>();
            for (Session s : exchangeService.sessionsOf(id)) {
                sessions.add(sessionMap(s, userId));
            }
            body.put("sessions", sessions);
            return ResponseEntity.ok(body);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/abandon")
    public ResponseEntity<?> abandon(Authentication auth, @PathVariable UUID id) {
        UUID userId = (UUID) auth.getPrincipal();
        try {
            exchangeService.abandon(id, userId);
            return ResponseEntity.ok(Map.of("status", "abandoned"));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> summary(Exchange ex, UUID viewerId) {
        boolean viewerIsA = ex.getPartyA().getUserId().equals(viewerId);
        User me    = viewerIsA ? ex.getPartyA() : ex.getPartyB();
        User other = viewerIsA ? ex.getPartyB() : ex.getPartyA();
        Skill iTeach   = viewerIsA ? ex.getSkillA() : ex.getSkillB();
        Skill theyTeach = viewerIsA ? ex.getSkillB() : ex.getSkillA();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("exchangeId", ex.getExchangeId());
        m.put("status", ex.getStatus());
        m.put("createdAt", ex.getCreatedAt());
        m.put("me", userBrief(me));
        m.put("partner", userBrief(other));
        m.put("iTeach", skillBrief(iTeach));
        m.put("theyTeach", skillBrief(theyTeach));
        return m;
    }

    private Map<String, Object> sessionMap(Session s, UUID viewerId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("sessionId", s.getSessionId());
        m.put("status", s.getStatus());
        m.put("skill", skillBrief(s.getSkill()));
        m.put("scheduledAt", s.getScheduledAt());
        m.put("durationMinutes", s.getDurationMinutes());
        m.put("learner", userBrief(s.getLearner()));
        m.put("provider", userBrief(s.getProvider()));
        m.put("viewerRole", s.getLearner().getUserId().equals(viewerId) ? "learner" : "provider");
        m.put("viewerHasRated", ratingRepo.existsBySessionSessionIdAndRaterUserId(s.getSessionId(), viewerId));
        return m;
    }

    private Map<String, Object> userBrief(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", u.getUserId());
        m.put("displayName", u.getDisplayName());
        m.put("avatarUrl", u.getAvatarUrl() != null ? u.getAvatarUrl() : "");
        return m;
    }

    private Map<String, Object> skillBrief(Skill s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("skillId", s.getSkillId());
        m.put("title", s.getTitle());
        m.put("category", s.getCategory().name());
        return m;
    }
}
