package com.skillswap.controller;

import com.skillswap.repository.RatingRepository;
import com.skillswap.repository.SessionRepository;
import com.skillswap.repository.SkillRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserRepository userRepo;
    private final SkillRepository skillRepo;
    private final SessionRepository sessionRepo;
    private final RatingRepository ratingRepo;

    public AdminController(UserRepository u, SkillRepository sk, SessionRepository se, RatingRepository r) {
        this.userRepo = u; this.skillRepo = sk; this.sessionRepo = se; this.ratingRepo = r;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(Map.of(
                "totalUsers", userRepo.count(),
                "totalSkills", skillRepo.count(),
                "totalSessions", sessionRepo.count(),
                "totalRatings", ratingRepo.count()
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(userRepo.findAll(pageable));
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
}
