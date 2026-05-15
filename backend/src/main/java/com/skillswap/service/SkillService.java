package com.skillswap.service;

import com.skillswap.dto.MatchResult;
import com.skillswap.dto.SkillCreateRequest;
import com.skillswap.model.Skill;
import com.skillswap.model.SkillProfile;
import com.skillswap.model.enums.NotificationType;
import com.skillswap.model.enums.ProficiencyLevel;
import com.skillswap.model.enums.SkillCategory;
import com.skillswap.repository.NotificationRepository;
import com.skillswap.repository.SkillProfileRepository;
import com.skillswap.repository.SkillRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SkillService {
    private final SkillRepository skillRepo;
    private final SkillProfileRepository profileRepo;
    private final MatchService matchService;
    private final NotificationService notifService;
    private final NotificationRepository notifRepo;

    public SkillService(SkillRepository s, SkillProfileRepository p, @Lazy MatchService m,
                        NotificationService n, NotificationRepository nr) {
        this.skillRepo = s; this.profileRepo = p; this.matchService = m;
        this.notifService = n; this.notifRepo = nr;
    }

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
        Skill saved = skillRepo.save(skill);

        // Fire MATCH_FOUND for top matches (rate-limited to once per 24h per user)
        try {
            long recentMatchNotifs = notifRepo.countByUserIdAndTypeAndCreatedAtAfter(
                    userId, NotificationType.MATCH_FOUND, LocalDateTime.now().minusHours(24));
            if (recentMatchNotifs == 0) {
                List<MatchResult> matches = matchService.findMatches(userId);
                List<MatchResult> strong = matches.stream()
                        .filter(m -> m.getMatchScore() >= 70)
                        .limit(3)
                        .toList();
                if (!strong.isEmpty()) {
                    String names = strong.stream().map(MatchResult::getDisplayName)
                            .reduce((a, b) -> a + ", " + b).orElse("");
                    notifService.create(userId, NotificationType.MATCH_FOUND,
                            "New strong match" + (strong.size() > 1 ? "es" : "") + ": " + names);
                }
            }
        } catch (Exception ignore) {
            // Match notification is best-effort; skill add should succeed regardless.
        }

        return saved;
    }

    public void deleteSkill(UUID skillId) { skillRepo.deleteById(skillId); }

    @Transactional(readOnly = true)
    public List<Skill> getUserSkills(UUID userId) {
        return new ArrayList<>(profileRepo.findByUserUserId(userId)
                .map(SkillProfile::getSkills)
                .orElseGet(List::of));
    }
}
