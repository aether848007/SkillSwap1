package com.skillswap.dto;

import java.util.UUID;

public class SessionRequest {
    private UUID providerId;
    private UUID skillId;
    private String scheduledAt;
    private Integer durationMinutes;
    private String notes;

    public UUID getProviderId() { return providerId; }
    public void setProviderId(UUID p) { this.providerId = p; }
    public UUID getSkillId() { return skillId; }
    public void setSkillId(UUID s) { this.skillId = s; }
    public String getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(String s) { this.scheduledAt = s; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer d) { this.durationMinutes = d; }
    public String getNotes() { return notes; }
    public void setNotes(String n) { this.notes = n; }
}
