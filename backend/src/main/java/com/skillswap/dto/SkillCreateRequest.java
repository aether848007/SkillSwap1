package com.skillswap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SkillCreateRequest {
    @NotBlank
    @Size(max = 100)
    private String title;

    @NotBlank
    private String category;

    @NotBlank
    private String proficiencyLevel;
    private String description;
    private Boolean isOffered;

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
}
