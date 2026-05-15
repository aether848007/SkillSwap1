package com.skillswap.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    /** The parent Exchange. Sessions are only ever created as one of an Exchange's two slots. */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exchange_id")
    private Exchange exchange;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.DRAFT;

    /** Null while the session is a DRAFT slot — set when the learner proposes a time. */
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
    public Exchange getExchange() { return exchange; }
    public void setExchange(Exchange e) { this.exchange = e; }
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
