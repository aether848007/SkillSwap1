package com.skillswap.controller;

import com.skillswap.dto.SkillCreateRequest;
import com.skillswap.dto.UserUpdateRequest;
import com.skillswap.model.User;
import com.skillswap.model.SkillProfile;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.SkillProfileRepository;
import com.skillswap.repository.RatingRepository;
import com.skillswap.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepo;
    private final SkillProfileRepository profileRepo;
    private final RatingRepository ratingRepo;
    private final SkillService skillService;

    public UserController(UserRepository u, SkillProfileRepository p, RatingRepository r, SkillService s) {
        this.userRepo = u; this.profileRepo = p; this.ratingRepo = r; this.skillService = s;
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
        if (req.getLatitude() != null) user.setLatitude(req.getLatitude());
        if (req.getLongitude() != null) user.setLongitude(req.getLongitude());
        user = userRepo.save(user);
        return ResponseEntity.ok(buildUserMap(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable UUID id) {
        User user = userRepo.findById(id).orElseThrow();
        return ResponseEntity.ok(buildUserMap(user));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<?> getUserReviews(@PathVariable UUID id) {
        return ResponseEntity.ok(ratingRepo.findByRateeUserIdOrderByCreatedAtDesc(id));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(Authentication auth, @RequestParam("file") MultipartFile file) throws IOException {
        UUID userId = (UUID) auth.getPrincipal();
        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf('.')))
                .orElse(".jpg");
        String filename = userId + "_" + System.currentTimeMillis() + ext;
        Path uploadDir = Paths.get("uploads");
        Files.createDirectories(uploadDir);
        Files.copy(file.getInputStream(), uploadDir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        String url = "/uploads/" + filename;
        User user = userRepo.findById(userId).orElseThrow();
        user.setAvatarUrl(url);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("avatarUrl", url));
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
        map.put("latitude", user.getLatitude());
        map.put("longitude", user.getLongitude());
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
