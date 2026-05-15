package com.skillswap.model;

import com.skillswap.model.enums.OtpIntent;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "otp_challenges")
public class OtpChallenge {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "challenge_id")
    private UUID challengeId;

    @Column(name = "user_id")
    private UUID userId;          // nullable on signup before the user record exists (we still attach if available)

    @Column(nullable = false)
    private String email;

    @Column(name = "code_hash", nullable = false)
    private String codeHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private OtpIntent intent;

    @Column(name = "attempts_remaining", nullable = false)
    private int attemptsRemaining = 5;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "last_sent_at", nullable = false)
    private LocalDateTime lastSentAt;

    @Column(nullable = false)
    private boolean consumed = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public UUID getChallengeId() { return challengeId; }
    public void setChallengeId(UUID c) { this.challengeId = c; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID u) { this.userId = u; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String h) { this.codeHash = h; }
    public OtpIntent getIntent() { return intent; }
    public void setIntent(OtpIntent intent) { this.intent = intent; }
    public int getAttemptsRemaining() { return attemptsRemaining; }
    public void setAttemptsRemaining(int n) { this.attemptsRemaining = n; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime t) { this.expiresAt = t; }
    public LocalDateTime getLastSentAt() { return lastSentAt; }
    public void setLastSentAt(LocalDateTime t) { this.lastSentAt = t; }
    public boolean isConsumed() { return consumed; }
    public void setConsumed(boolean c) { this.consumed = c; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
