package com.skillswap.dto;

import com.skillswap.model.enums.OtpIntent;
import java.util.UUID;

public class OtpChallengeResponse {
    private final UUID challengeId;
    private final String email;
    private final OtpIntent intent;
    private final int expiresInSeconds;
    private final int resendCooldownSeconds;

    public OtpChallengeResponse(UUID challengeId, String email, OtpIntent intent,
                                int expiresInSeconds, int resendCooldownSeconds) {
        this.challengeId = challengeId;
        this.email = email;
        this.intent = intent;
        this.expiresInSeconds = expiresInSeconds;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    public UUID getChallengeId() { return challengeId; }
    public String getEmail() { return email; }
    public OtpIntent getIntent() { return intent; }
    public int getExpiresInSeconds() { return expiresInSeconds; }
    public int getResendCooldownSeconds() { return resendCooldownSeconds; }
}
