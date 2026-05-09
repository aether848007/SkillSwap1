package com.skillswap.service;

import com.skillswap.dto.SkillCreateRequest;
import com.skillswap.model.Skill;
import com.skillswap.model.SkillProfile;
import com.skillswap.model.enums.ProficiencyLevel;
import com.skillswap.model.enums.SkillCategory;
import com.skillswap.repository.SkillProfileRepository;
import com.skillswap.repository.SkillRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class SkillService {
    private final SkillRepository skillRepo;
    private final SkillProfileRepository profileRepo;

    public SkillService(SkillRepository s, SkillProfileRepository p) { this.skillRepo = s; this.profileRepo = p; }

    public Skill addSkill(UUID userId, SkillCreateRequest req) {
        SkillProfile profile = profileRepo.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        Skill skill = new Skill();
        skill.setTitle(req.getTitle());
        skill.setCategory(SkillCategory.valueOf(req.getCategory()));
        skill.setProficiencyLevel(ProficiencyLevel.valueOf(req.getProficiencyLevel()));
        skill.setDescription(req.getDescription());
        skill.setIsOffered(req.getIsOffered() != null ? req.getIsOffered() : true);
        skill.setSkillProfile(profile);
        return skillRepo.save(skill);
    }

    public void deleteSkill(UUID skillId) { skillRepo.deleteById(skillId); }
}
