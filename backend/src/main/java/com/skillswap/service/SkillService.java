package com.skillswap.service;

import com.skillswap.dto.SkillCreateRequest;
import com.skillswap.model.Skill;
import com.skillswap.model.SkillProfile;
import com.skillswap.model.enums.ProficiencyLevel;
import com.skillswap.model.enums.SkillCategory;
import com.skillswap.repository.SkillProfileRepository;
import com.skillswap.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SkillService {
    private final SkillRepository skillRepo;
    private final SkillProfileRepository profileRepo;

    public SkillService(SkillRepository s, SkillProfileRepository p) { this.skillRepo = s; this.profileRepo = p; }

    @Transactional
    public Skill addSkill(UUID userId, SkillCreateRequest req) {
        SkillProfile profile = profileRepo.findByUserUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        Skill skill = new Skill();
        skill.setTitle(req.getTitle());
        skill.setCategory(SkillCategory.valueOf(req.getCategory()));
        skill.setProficiencyLevel(ProficiencyLevel.valueOf(req.getProficiencyLevel()));
        skill.setDescription(req.getDescription());
        skill.setIsOffered(req.getIsOffered() != null ? req.getIsOffered() : true);
        skill.setIsActive(true);
        skill.setSkillProfile(profile);
        return skillRepo.save(skill);
    }

    public void deleteSkill(UUID skillId) { skillRepo.deleteById(skillId); }

    @Transactional(readOnly = true)
    public List<Skill> getUserSkills(UUID userId) {
        return new ArrayList<>(profileRepo.findByUserUserId(userId)
                .map(SkillProfile::getSkills)
                .orElseGet(List::of));
    }
}
