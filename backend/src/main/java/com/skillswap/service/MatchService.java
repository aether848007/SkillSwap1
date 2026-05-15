package com.skillswap.service;

import com.skillswap.dto.MatchResult;
import com.skillswap.model.Skill;
import com.skillswap.model.SkillProfile;
import com.skillswap.model.enums.ProficiencyLevel;
import com.skillswap.repository.SkillProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchService {
    private static final Logger log = LoggerFactory.getLogger(MatchService.class);

    private final SkillProfileRepository profileRepo;

    public MatchService(SkillProfileRepository profileRepo) {
        this.profileRepo = profileRepo;
    }

    @Transactional(readOnly = true)
    public List<MatchResult> findMatches(UUID userId) {
        Optional<SkillProfile> myProfileOpt = profileRepo.findByUserUserId(userId);
        if (myProfileOpt.isEmpty()) {
            log.warn("findMatches: no SkillProfile found for userId={}", userId);
            return Collections.emptyList();
        }

        SkillProfile myProfile = myProfileOpt.get();
        List<Skill> myOffered = activeSkills(myProfile, true);
        List<Skill> myWanted  = activeSkills(myProfile, false);
        log.info("findMatches: userId={} offered={} wanted={}", userId, myOffered.size(), myWanted.size());

        if (myOffered.isEmpty() && myWanted.isEmpty()) {
            log.warn("findMatches: userId={} has no active skills — returning empty", userId);
            return Collections.emptyList();
        }

        List<SkillProfile> candidates = profileRepo.findAllOtherUsersWithSkills(userId);
        log.info("findMatches: found {} candidate profiles", candidates.size());
        List<MatchResult> results = new ArrayList<>();

        for (SkillProfile candidate : candidates) {
            List<Skill> theirOffered = activeSkills(candidate, true);
            List<Skill> theirWanted  = activeSkills(candidate, false);

            List<String> theyTeachMe = new ArrayList<>();
            List<String> iTeachThem  = new ArrayList<>();
            double score = 0;

            // Forward: what I offer that they want
            for (Skill mine : myOffered) {
                for (Skill theirWant : theirWanted) {
                    int ts = titleScore(mine.getTitle(), theirWant.getTitle());
                    if (ts == 0 && mine.getCategory() == theirWant.getCategory()) ts = 8;
                    if (ts > 0) {
                        score += ts;
                        if (!iTeachThem.contains(mine.getTitle())) iTeachThem.add(mine.getTitle());
                    }
                }
            }

            // Reverse: what they offer that I want
            for (Skill myWant : myWanted) {
                for (Skill theirs : theirOffered) {
                    int ts = titleScore(theirs.getTitle(), myWant.getTitle());
                    if (ts == 0 && theirs.getCategory() == myWant.getCategory()) ts = 8;
                    if (ts > 0) {
                        score += ts;
                        score += proficiencyBonus(theirs.getProficiencyLevel());
                        if (!theyTeachMe.contains(theirs.getTitle())) theyTeachMe.add(theirs.getTitle());
                    }
                }
            }

            log.info("findMatches: candidate={} rawScore={} iTeach={} theyTeach={}", candidate.getUser().getDisplayName(), score, iTeachThem, theyTeachMe);
            if (score < 10) continue;

            double normalizedScore = Math.min(100.0, score);

            MatchResult r = new MatchResult();
            r.setUserId(candidate.getUser().getUserId());
            r.setDisplayName(candidate.getUser().getDisplayName());
            r.setAvatarUrl(candidate.getUser().getAvatarUrl());
            r.setCity(candidate.getUser().getCity());
            r.setAverageRating(candidate.getAverageRating());
            r.setTotalSessions(candidate.getTotalSessions());
            r.setMatchScore(Math.round(normalizedScore * 10.0) / 10.0);
            r.setTheyTeachMe(theyTeachMe);
            r.setITeachThem(iTeachThem);
            r.setTheirOfferedSkills(theirOffered.stream().map(Skill::getTitle).collect(Collectors.toList()));
            r.setTheirWantedSkills(theirWanted.stream().map(Skill::getTitle).collect(Collectors.toList()));
            results.add(r);
        }

        results.sort(Comparator.comparingDouble(MatchResult::getMatchScore).reversed());
        return results.size() > 50 ? results.subList(0, 50) : results;
    }

    private List<Skill> activeSkills(SkillProfile profile, boolean offered) {
        return profile.getSkills().stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsActive()) && s.getIsOffered() == offered)
                .collect(Collectors.toList());
    }

    private int titleScore(String a, String b) {
        String an = a.toLowerCase().trim();
        String bn = b.toLowerCase().trim();
        if (an.equals(bn)) return 40;
        if (an.contains(bn) || bn.contains(an)) return 20;
        return 0;
    }

    private double proficiencyBonus(ProficiencyLevel level) {
        if (level == ProficiencyLevel.ADVANCED || level == ProficiencyLevel.INTERMEDIATE) return 10;
        return 5;
    }

}
