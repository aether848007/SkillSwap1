package com.skillswap.service;

import com.skillswap.dto.SkillDto;
import com.skillswap.model.Skill;
import com.skillswap.model.enums.SkillCategory;
import com.skillswap.repository.SkillRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {
    private final SkillRepository skillRepo;

    public SearchService(SkillRepository skillRepo) { this.skillRepo = skillRepo; }

    public List<SkillDto> searchSkills(String query, String category) {
        List<Skill> skills;
        if (query != null && !query.isBlank()) {
            skills = skillRepo.searchSkills(query);
        } else if (category != null && !category.isBlank()) {
            skills = skillRepo.findByActiveCategory(SkillCategory.valueOf(category.toUpperCase()));
        } else {
            skills = skillRepo.findByIsOfferedTrueAndIsActiveTrue();
        }
        return skills.stream().map(this::toDto).collect(Collectors.toList());
    }

    private SkillDto toDto(Skill s) {
        SkillDto dto = new SkillDto();
        dto.setSkillId(s.getSkillId());
        dto.setTitle(s.getTitle());
        dto.setCategory(s.getCategory().name());
        dto.setProficiencyLevel(s.getProficiencyLevel().name());
        dto.setDescription(s.getDescription());
        dto.setIsOffered(s.getIsOffered());
        dto.setProfileId(s.getSkillProfile().getProfileId());
        dto.setProviderName(s.getSkillProfile().getUser().getDisplayName());
        dto.setProviderCity(s.getSkillProfile().getUser().getCity());
        dto.setProviderRating(s.getSkillProfile().getAverageRating());
        dto.setProviderUserId(s.getSkillProfile().getUser().getUserId());
        dto.setProviderAvatar(s.getSkillProfile().getUser().getAvatarUrl());
        return dto;
    }
}
