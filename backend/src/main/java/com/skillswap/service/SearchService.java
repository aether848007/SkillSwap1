package com.skillswap.service;

import com.skillswap.dto.SkillDto;
import com.skillswap.model.Skill;
import com.skillswap.model.User;
import com.skillswap.model.enums.SkillCategory;
import com.skillswap.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {
    private final SkillRepository skillRepo;

    public SearchService(SkillRepository skillRepo) { this.skillRepo = skillRepo; }

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
    public List<SkillDto> searchByCity(String city) {
        String lower = city.toLowerCase().trim();
        return skillRepo.findByIsOfferedTrueAndIsActiveTrue().stream()
                .filter(s -> {
                    String c = s.getSkillProfile().getUser().getCity();
                    return c != null && c.toLowerCase().contains(lower);
                })
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillDto> searchNearby(double lat, double lng, double radiusKm, String query) {
        List<Skill> candidates = (query != null && !query.isBlank())
                ? skillRepo.searchSkills(query)
                : skillRepo.findByIsOfferedTrueAndIsActiveTrue();
        return candidates.stream()
                .filter(s -> {
                    User u = s.getSkillProfile().getUser();
                    return u.getLatitude() != null && u.getLongitude() != null
                            && haversineKm(lat, lng, u.getLatitude(), u.getLongitude()) <= radiusKm;
                })
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
        User u = s.getSkillProfile().getUser();
        dto.setProviderName(u.getDisplayName());
        dto.setProviderCity(u.getCity());
        dto.setProviderRating(s.getSkillProfile().getAverageRating());
        dto.setProviderUserId(u.getUserId());
        dto.setProviderAvatar(u.getAvatarUrl());
        dto.setProviderLat(u.getLatitude());
        dto.setProviderLng(u.getLongitude());
        return dto;
    }
}
