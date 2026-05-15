package com.skillswap.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class OtpResendRequest {
    @NotNull(message = "challengeId is required")
    private UUID challengeId;

    public UUID getChallengeId() { return challengeId; }
    public void setChallengeId(UUID challengeId) { this.challengeId = challengeId; }
}
