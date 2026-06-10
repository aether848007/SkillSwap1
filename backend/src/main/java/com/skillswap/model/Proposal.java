package com.skillswap.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.skillswap.model.enums.ProposalStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A "propose exchange" request. fromUser offers offeredSkill (one of their own teachable
 * skills) in return for requestedSkill (one of toUser's teachable skills). When accepted,
 * an {@link Exchange} is spawned.
 */
@Entity
@Table(name = "proposals")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Proposal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID proposalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false)
    private User fromUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User toUser;

    /** A teachable skill of fromUser — what the proposer gives. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offered_skill_id", nullable = false)
    private Skill offeredSkill;

    /** A teachable skill of toUser — what the proposer wants. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_skill_id", nullable = false)
    private Skill requestedSkill;

    @Column(length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ProposalStatus status = ProposalStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    /** Optional note from the recipient explaining a decline. */
    @Column(length = 500)
    private String reason;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public Proposal() {}

    public UUID getProposalId() { return proposalId; }
    public void setProposalId(UUID id) { this.proposalId = id; }
    public User getFromUser() { return fromUser; }
    public void setFromUser(User u) { this.fromUser = u; }
    public User getToUser() { return toUser; }
    public void setToUser(User u) { this.toUser = u; }
    public Skill getOfferedSkill() { return offeredSkill; }
    public void setOfferedSkill(Skill s) { this.offeredSkill = s; }
    public Skill getRequestedSkill() { return requestedSkill; }
    public void setRequestedSkill(Skill s) { this.requestedSkill = s; }
    public String getMessage() { return message; }
    public void setMessage(String m) { this.message = m; }
    public ProposalStatus getStatus() { return status; }
    public void setStatus(ProposalStatus s) { this.status = s; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime t) { this.decidedAt = t; }
    public String getReason() { return reason; }
    public void setReason(String r) { this.reason = r; }
}
