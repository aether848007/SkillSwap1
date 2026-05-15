package com.skillswap.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public class ProposeRequest {
    @NotNull(message = "toUserId is required")
    private UUID toUserId;

    @NotNull(message = "offeredSkillId is required")
    private UUID offeredSkillId;

    @NotNull(message = "requestedSkillId is required")
    private UUID requestedSkillId;

    @Size(max = 500, message = "message must be 500 characters or fewer")
    private String message;

    public UUID getToUserId() { return toUserId; }
    public void setToUserId(UUID toUserId) { this.toUserId = toUserId; }
    public UUID getOfferedSkillId() { return offeredSkillId; }
    public void setOfferedSkillId(UUID offeredSkillId) { this.offeredSkillId = offeredSkillId; }
    public UUID getRequestedSkillId() { return requestedSkillId; }
    public void setRequestedSkillId(UUID requestedSkillId) { this.requestedSkillId = requestedSkillId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
