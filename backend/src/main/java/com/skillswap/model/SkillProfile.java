package com.skillswap.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "skill_profiles")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SkillProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID profileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Double averageRating = 0.0;
    private Integer totalSessions = 0;
    private Boolean isVisible = true;

    @OneToMany(mappedBy = "skillProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Skill> skills = new ArrayList<>();

    public SkillProfile() {}
    public UUID getProfileId() { return profileId; }
    public void setProfileId(UUID id) { this.profileId = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double r) { this.averageRating = r; }
    public Integer getTotalSessions() { return totalSessions; }
    public void setTotalSessions(Integer t) { this.totalSessions = t; }
    public Boolean getIsVisible() { return isVisible; }
    public void setIsVisible(Boolean v) { this.isVisible = v; }
    public List<Skill> getSkills() { return skills; }
    public void setSkills(List<Skill> skills) { this.skills = skills; }
}
