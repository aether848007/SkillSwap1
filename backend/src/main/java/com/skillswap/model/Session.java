package com.skillswap.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.skillswap.model.enums.SessionStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private User learner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private User provider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.REQUESTED;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    private Integer durationMinutes = 60;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Session() {}
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID id) { this.sessionId = id; }
    public User getLearner() { return learner; }
    public void setLearner(User l) { this.learner = l; }
    public User getProvider() { return provider; }
    public void setProvider(User p) { this.provider = p; }
    public Skill getSkill() { return skill; }
    public void setSkill(Skill s) { this.skill = s; }
    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus s) { this.status = s; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime s) { this.scheduledAt = s; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer d) { this.durationMinutes = d; }
    public String getNotes() { return notes; }
    public void setNotes(String n) { this.notes = n; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
