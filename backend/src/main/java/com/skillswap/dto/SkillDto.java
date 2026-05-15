package com.skillswap.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class SkillDto {
    private UUID skillId;
    private String title;
    private String category;
    private String proficiencyLevel;
    private String description;
    private Boolean isOffered;
    private UUID profileId;
    private String providerName;
    private String providerCity;
    private Double providerRating;
    private UUID providerUserId;
    private String providerAvatar;
    private LocalDateTime createdAt;

    // Getters and setters
    public UUID getSkillId() { return skillId; }
    public void setSkillId(UUID s) { this.skillId = s; }
    public String getTitle() { return title; }
    public void setTitle(String t) { this.title = t; }
    public String getCategory() { return category; }
    public void setCategory(String c) { this.category = c; }
    public String getProficiencyLevel() { return proficiencyLevel; }
    public void setProficiencyLevel(String p) { this.proficiencyLevel = p; }
    public String getDescription() { return description; }
    public void setDescription(String d) { this.description = d; }
    public Boolean getIsOffered() { return isOffered; }
    public void setIsOffered(Boolean o) { this.isOffered = o; }
    public UUID getProfileId() { return profileId; }
    public void setProfileId(UUID p) { this.profileId = p; }
    public String getProviderName() { return providerName; }
    public void setProviderName(String n) { this.providerName = n; }
    public String getProviderCity() { return providerCity; }
    public void setProviderCity(String c) { this.providerCity = c; }
    public Double getProviderRating() { return providerRating; }
    public void setProviderRating(Double r) { this.providerRating = r; }
    public UUID getProviderUserId() { return providerUserId; }
    public void setProviderUserId(UUID u) { this.providerUserId = u; }
    public String getProviderAvatar() { return providerAvatar; }
    public void setProviderAvatar(String a) { this.providerAvatar = a; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
