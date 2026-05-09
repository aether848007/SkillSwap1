package com.skillswap.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ratings")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Rating {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID ratingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rater_id", nullable = false)
    private User rater;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ratee_id", nullable = false)
    private User ratee;

    @Column(nullable = false)
    private Integer score;

    @Column(length = 1000)
    private String comment;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Rating() {}
    public UUID getRatingId() { return ratingId; }
    public Session getSession() { return session; }
    public void setSession(Session s) { this.session = s; }
    public User getRater() { return rater; }
    public void setRater(User r) { this.rater = r; }
    public User getRatee() { return ratee; }
    public void setRatee(User r) { this.ratee = r; }
    public Integer getScore() { return score; }
    public void setScore(Integer s) { this.score = s; }
    public String getComment() { return comment; }
    public void setComment(String c) { this.comment = c; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
