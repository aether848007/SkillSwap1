package com.skillswap.dto;

import jakarta.validation.constraints.NotBlank;

public class ScheduleRequest {
    /** ISO-8601 local date-time, e.g. 2026-06-01T14:30 */
    @NotBlank(message = "scheduledAt is required")
    private String scheduledAt;

    public String getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }
}
