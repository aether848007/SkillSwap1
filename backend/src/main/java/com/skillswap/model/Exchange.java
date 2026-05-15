package com.skillswap.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.skillswap.model.enums.ExchangeStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One reciprocal swap, spawned when a {@link Proposal} is accepted.
 * partyA teaches skillA to partyB; partyB teaches skillB to partyA.
 * Each Exchange owns exactly two {@link Session}s, one per direction.
 */
@Entity
@Table(name = "exchanges")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Exchange {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID exchangeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id")
    private Proposal proposal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "party_a_id", nullable = false)
    private User partyA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_a_id", nullable = false)
    private Skill skillA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "party_b_id", nullable = false)
    private User partyB;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_b_id", nullable = false)
    private Skill skillB;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ExchangeStatus status = ExchangeStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public Exchange() {}

    public UUID getExchangeId() { return exchangeId; }
    public void setExchangeId(UUID id) { this.exchangeId = id; }
    public Proposal getProposal() { return proposal; }
    public void setProposal(Proposal p) { this.proposal = p; }
    public User getPartyA() { return partyA; }
    public void setPartyA(User u) { this.partyA = u; }
    public Skill getSkillA() { return skillA; }
    public void setSkillA(Skill s) { this.skillA = s; }
    public User getPartyB() { return partyB; }
    public void setPartyB(User u) { this.partyB = u; }
    public Skill getSkillB() { return skillB; }
    public void setSkillB(Skill s) { this.skillB = s; }
    public ExchangeStatus getStatus() { return status; }
    public void setStatus(ExchangeStatus s) { this.status = s; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
