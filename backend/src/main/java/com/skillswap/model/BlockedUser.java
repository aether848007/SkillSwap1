package com.skillswap.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/** A record that {@code blocker} has blocked {@code blocked}, hiding them and forbidding contact. */
@Entity
@Table(name = "blocked_users",
       uniqueConstraints = @UniqueConstraint(name = "uq_block", columnNames = {"blocker_id", "blocked_id"}))
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class BlockedUser {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "block_id")
    private UUID blockId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_id", nullable = false)
    private User blocked;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public BlockedUser() {}
    public BlockedUser(User blocker, User blocked) { this.blocker = blocker; this.blocked = blocked; }

    public UUID getBlockId() { return blockId; }
    public User getBlocker() { return blocker; }
    public void setBlocker(User u) { this.blocker = u; }
    public User getBlocked() { return blocked; }
    public void setBlocked(User u) { this.blocked = u; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
