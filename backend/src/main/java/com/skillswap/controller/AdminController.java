package com.skillswap.controller;

import com.skillswap.config.JwtUtil;
import com.skillswap.model.User;
import com.skillswap.model.enums.UserRole;
import com.skillswap.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserRepository userRepo;
    private final SkillRepository skillRepo;
    private final SessionRepository sessionRepo;
    private final RatingRepository ratingRepo;
    private final ProposalRepository proposalRepo;
    private final ExchangeRepository exchangeRepo;
    private final MessageRepository messageRepo;
    private final SkillProfileRepository profileRepo;
    private final JwtUtil jwtUtil;

    public AdminController(UserRepository u, SkillRepository sk, SessionRepository se,
                           RatingRepository r, ProposalRepository pr, ExchangeRepository ex,
                           MessageRepository msg, SkillProfileRepository sp, JwtUtil jwt) {
        this.userRepo = u; this.skillRepo = sk; this.sessionRepo = se; this.ratingRepo = r;
        this.proposalRepo = pr; this.exchangeRepo = ex; this.messageRepo = msg;
        this.profileRepo = sp; this.jwtUtil = jwt;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(Map.of(
                "totalUsers",     userRepo.count(),
                "totalSkills",    skillRepo.count(),
                "totalSessions",  sessionRepo.count(),
                "totalRatings",   ratingRepo.count(),
                "totalProposals", proposalRepo.count(),
                "totalExchanges", exchangeRepo.count(),
                "totalMessages",  messageRepo.count()
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        var pageResult = userRepo.findAll(pageable);
        List<Map<String, Object>> out = new ArrayList<>();
        for (User u : pageResult.getContent()) {
            out.add(userMap(u));
        }
        return ResponseEntity.ok(Map.of("content", out, "total", pageResult.getTotalElements()));
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable UUID id) {
        User user = userRepo.findById(id).orElseThrow();
        user.setDisabled(true);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "User banned"));
    }

    @PatchMapping("/users/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable UUID id) {
        User user = userRepo.findById(id).orElseThrow();
        user.setDisabled(false);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "User reinstated"));
    }

    @PatchMapping("/users/{id}/promote")
    public ResponseEntity<?> promoteUser(@PathVariable UUID id, Authentication auth) {
        UUID callerId = (UUID) auth.getPrincipal();
        if (id.equals(callerId)) return ResponseEntity.badRequest().body(Map.of("error", "Cannot change your own role"));
        User user = userRepo.findById(id).orElseThrow();
        user.setRole(UserRole.ADMIN);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "Promoted to admin"));
    }

    @PatchMapping("/users/{id}/demote")
    public ResponseEntity<?> demoteUser(@PathVariable UUID id, Authentication auth) {
        UUID callerId = (UUID) auth.getPrincipal();
        if (id.equals(callerId)) return ResponseEntity.badRequest().body(Map.of("error", "Cannot change your own role"));
        User user = userRepo.findById(id).orElseThrow();
        user.setRole(UserRole.LEARNER);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "Demoted to member"));
    }

    @PatchMapping("/users/{id}/verify-email")
    public ResponseEntity<?> verifyEmail(@PathVariable UUID id) {
        User user = userRepo.findById(id).orElseThrow();
        user.setEmailVerified(true);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "Email verified"));
    }

    @PostMapping("/users/{id}/impersonate")
    public ResponseEntity<?> impersonate(@PathVariable UUID id, Authentication auth) {
        UUID callerId = (UUID) auth.getPrincipal();
        if (id.equals(callerId)) return ResponseEntity.badRequest().body(Map.of("error", "Cannot impersonate yourself"));
        User user = userRepo.findById(id).orElseThrow();
        if (user.isDisabled()) return ResponseEntity.badRequest().body(Map.of("error", "User is banned"));
        String token = jwtUtil.generateToken(user.getUserId(), user.getEmail(), user.getRole().name());
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("accessToken", token);
        res.put("userId", user.getUserId());
        res.put("email", user.getEmail());
        res.put("displayName", user.getDisplayName());
        res.put("role", user.getRole().name());
        res.put("avatarUrl", user.getAvatarUrl());
        res.put("city", user.getCity());
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id, Authentication auth) {
        UUID callerId = (UUID) auth.getPrincipal();
        if (id.equals(callerId)) return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete your own account"));
        if (!userRepo.existsById(id)) return ResponseEntity.notFound().build();
        try {
            profileRepo.findByUserUserId(id).ifPresent(profileRepo::delete);
            userRepo.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(409).body(Map.of("error", "Cannot delete: user has associated data (sessions, exchanges). Ban the user instead."));
        }
    }

    private Map<String, Object> userMap(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId",        u.getUserId());
        m.put("email",         u.getEmail());
        m.put("displayName",   u.getDisplayName());
        m.put("avatarUrl",     u.getAvatarUrl());
        m.put("city",          u.getCity());
        m.put("role",          u.getRole().name());
        m.put("disabled",      u.isDisabled());
        m.put("emailVerified", u.isEmailVerified());
        m.put("createdAt",     u.getCreatedAt());
        return m;
    }
}
