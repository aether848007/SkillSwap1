package com.skillswap.model;

import com.skillswap.model.enums.MatchRequestStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "match_requests")
public class MatchRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID matchRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false)
    private User fromUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User toUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchRequestStatus status = MatchRequestStatus.PENDING;

    private String theyTeachMe;
    private String iTeachThem;

    @Column(length = 500)
    private String message;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public MatchRequest() {}

    public UUID getMatchRequestId() { return matchRequestId; }
    public void setMatchRequestId(UUID id) { this.matchRequestId = id; }
    public User getFromUser() { return fromUser; }
    public void setFromUser(User fromUser) { this.fromUser = fromUser; }
    public User getToUser() { return toUser; }
    public void setToUser(User toUser) { this.toUser = toUser; }
    public MatchRequestStatus getStatus() { return status; }
    public void setStatus(MatchRequestStatus status) { this.status = status; }
    public String getTheyTeachMe() { return theyTeachMe; }
    public void setTheyTeachMe(String theyTeachMe) { this.theyTeachMe = theyTeachMe; }
    public String getITeachThem() { return iTeachThem; }
    public void setITeachThem(String iTeachThem) { this.iTeachThem = iTeachThem; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
