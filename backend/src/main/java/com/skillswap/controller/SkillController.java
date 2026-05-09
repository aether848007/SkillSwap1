package com.skillswap.controller;

import com.skillswap.dto.SkillCreateRequest;
import com.skillswap.model.Skill;
import com.skillswap.service.SkillService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/skills")
public class SkillController {
    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @PostMapping
    public ResponseEntity<Skill> addSkill(Authentication auth, @Valid @RequestBody SkillCreateRequest req) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(skillService.addSkill(userId, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable UUID id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    public ResponseEntity<List<Skill>> getMySkills(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(skillService.getUserSkills(userId));
    }
}
