package com.skillswap.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.skillswap.model.enums.ProficiencyLevel;
import com.skillswap.model.enums.SkillCategory;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "skills")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Skill {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID skillId;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SkillCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProficiencyLevel proficiencyLevel;

    @Column(length = 1000)
    private String description;

    private Boolean isOffered = true;
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private SkillProfile skillProfile;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public Skill() {}
    public UUID getSkillId() { return skillId; }
    public void setSkillId(UUID id) { this.skillId = id; }
    public String getTitle() { return title; }
    public void setTitle(String t) { this.title = t; }
    public SkillCategory getCategory() { return category; }
    public void setCategory(SkillCategory c) { this.category = c; }
    public ProficiencyLevel getProficiencyLevel() { return proficiencyLevel; }
    public void setProficiencyLevel(ProficiencyLevel p) { this.proficiencyLevel = p; }
    public String getDescription() { return description; }
    public void setDescription(String d) { this.description = d; }
    public Boolean getIsOffered() { return isOffered; }
    public void setIsOffered(Boolean o) { this.isOffered = o; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean a) { this.isActive = a; }
    public SkillProfile getSkillProfile() { return skillProfile; }
    public void setSkillProfile(SkillProfile sp) { this.skillProfile = sp; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
