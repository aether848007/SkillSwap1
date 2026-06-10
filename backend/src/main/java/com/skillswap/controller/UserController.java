package com.skillswap.controller;

import com.skillswap.dto.SkillCreateRequest;
import com.skillswap.dto.UserUpdateRequest;
import com.skillswap.model.User;
import com.skillswap.model.SkillProfile;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.SkillProfileRepository;
import com.skillswap.repository.RatingRepository;
import com.skillswap.service.BlockService;
import com.skillswap.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepo;
    private final SkillProfileRepository profileRepo;
    private final RatingRepository ratingRepo;
    private final SkillService skillService;
    private final BlockService blockService;

    public UserController(UserRepository u, SkillProfileRepository p, RatingRepository r,
                          SkillService s, BlockService b) {
        this.userRepo = u; this.profileRepo = p; this.ratingRepo = r; this.skillService = s;
        this.blockService = b;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        User user = userRepo.findById(userId).orElseThrow();
        return ResponseEntity.ok(buildUserMap(user));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(Authentication auth, @Valid @RequestBody UserUpdateRequest req) {
        UUID userId = (UUID) auth.getPrincipal();
        User user = userRepo.findById(userId).orElseThrow();
        if (req.getDisplayName() != null && !req.getDisplayName().isBlank()) {
            user.setDisplayName(req.getDisplayName());
        }
        if (req.getBio() != null) user.setBio(req.getBio());
        if (req.getCity() != null) user.setCity(req.getCity());
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());
        user = userRepo.save(user);
        return ResponseEntity.ok(buildUserMap(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(Authentication auth, @PathVariable UUID id) {
        User user = userRepo.findById(id).orElseThrow();
        Map<String, Object> map = buildUserMap(user);
        UUID viewerId = (UUID) auth.getPrincipal();
        if (!viewerId.equals(id)) {
            map.put("isBlocked", blockService.blockedIds(viewerId).contains(id));
        }
        return ResponseEntity.ok(map);
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<?> getUserReviews(@PathVariable UUID id) {
        return ResponseEntity.ok(ratingRepo.findByRateeUserIdOrderByCreatedAtDesc(id));
    }

    /** Block another user — hides them from search/matches and forbids proposals & messages. */
    @PostMapping("/{id}/block")
    public ResponseEntity<?> block(Authentication auth, @PathVariable UUID id) {
        UUID me = (UUID) auth.getPrincipal();
        blockService.block(me, id);
        return ResponseEntity.ok(Map.of("status", "blocked"));
    }

    @DeleteMapping("/{id}/block")
    public ResponseEntity<?> unblock(Authentication auth, @PathVariable UUID id) {
        UUID me = (UUID) auth.getPrincipal();
        blockService.unblock(me, id);
        return ResponseEntity.ok(Map.of("status", "unblocked"));
    }

    @GetMapping("/me/blocked")
    public ResponseEntity<?> myBlocked(Authentication auth) {
        UUID me = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(blockService.blockedIds(me));
    }

    private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(Authentication auth, @RequestParam("file") MultipartFile file) throws IOException {
        UUID userId = (UUID) auth.getPrincipal();
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_AVATAR_TYPES.contains(contentType.toLowerCase())) {
            return ResponseEntity.status(415).body(Map.of("error", "Unsupported image type. Use JPEG, PNG, or WebP."));
        }
        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        String dataUrl = "data:" + contentType + ";base64," + base64;
        User user = userRepo.findById(userId).orElseThrow();
        user.setAvatarUrl(dataUrl);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("avatarUrl", dataUrl));
    }

    @PostMapping("/skills")
    public ResponseEntity<?> addSkill(Authentication auth, @RequestBody SkillCreateRequest req) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(skillService.addSkill(userId, req));
    }

    @DeleteMapping("/skills/{skillId}")
    public ResponseEntity<?> deleteSkill(@PathVariable UUID skillId) {
        skillService.deleteSkill(skillId);
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> buildUserMap(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("userId", user.getUserId());
        map.put("email", user.getEmail());
        map.put("displayName", user.getDisplayName());
        map.put("avatarUrl", user.getAvatarUrl());
        map.put("bio", user.getBio());
        map.put("role", user.getRole());
        map.put("city", user.getCity());
        map.put("createdAt", user.getCreatedAt());
        SkillProfile profile = profileRepo.findByUserUserId(user.getUserId()).orElse(null);
        if (profile != null) {
            map.put("averageRating", profile.getAverageRating());
            map.put("totalSessions", profile.getTotalSessions());
            map.put("skills", profile.getSkills());
        }
        return map;
    }
}
