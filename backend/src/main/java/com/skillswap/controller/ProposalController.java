package com.skillswap.controller;

import com.skillswap.dto.ProposeRequest;
import com.skillswap.model.Exchange;
import com.skillswap.model.Proposal;
import com.skillswap.model.Skill;
import com.skillswap.model.User;
import com.skillswap.service.ProposalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/proposals")
public class ProposalController {
    private final ProposalService proposalService;

    public ProposalController(ProposalService p) { this.proposalService = p; }

    @PostMapping
    public ResponseEntity<?> propose(Authentication auth, @Valid @RequestBody ProposeRequest req) {
        UUID fromId = (UUID) auth.getPrincipal();
        try {
            Proposal p = proposalService.propose(fromId, req);
            return ResponseEntity.ok(Map.of("proposalId", p.getProposalId(), "status", "sent"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> myProposals(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Proposal p : proposalService.listForUser(userId)) {
            out.add(toMap(p, userId));
        }
        return ResponseEntity.ok(out);
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<?> accept(Authentication auth, @PathVariable UUID id) {
        UUID userId = (UUID) auth.getPrincipal();
        try {
            Exchange ex = proposalService.accept(id, userId);
            return ResponseEntity.ok(Map.of("status", "accepted", "exchangeId", ex.getExchangeId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/decline")
    public ResponseEntity<?> decline(Authentication auth, @PathVariable UUID id) {
        UUID userId = (UUID) auth.getPrincipal();
        try {
            proposalService.decline(id, userId);
            return ResponseEntity.ok(Map.of("status", "declined"));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(Authentication auth, @PathVariable UUID id) {
        UUID userId = (UUID) auth.getPrincipal();
        try {
            proposalService.cancel(id, userId);
            return ResponseEntity.ok(Map.of("status", "cancelled"));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> toMap(Proposal p, UUID viewerId) {
        boolean iSent = p.getFromUser().getUserId().equals(viewerId);
        User other = iSent ? p.getToUser() : p.getFromUser();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("proposalId", p.getProposalId());
        m.put("status", p.getStatus());
        m.put("message", p.getMessage());
        m.put("createdAt", p.getCreatedAt());
        m.put("direction", iSent ? "sent" : "received");
        m.put("otherUser", Map.of(
                "userId", other.getUserId(),
                "displayName", other.getDisplayName(),
                "avatarUrl", other.getAvatarUrl() != null ? other.getAvatarUrl() : "",
                "city", other.getCity() != null ? other.getCity() : ""));
        // offeredSkill = what fromUser teaches; requestedSkill = what fromUser wants to learn
        m.put("offeredSkill", skillBrief(p.getOfferedSkill()));
        m.put("requestedSkill", skillBrief(p.getRequestedSkill()));
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
