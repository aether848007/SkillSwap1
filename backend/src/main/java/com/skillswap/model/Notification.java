package com.skillswap.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.skillswap.model.enums.NotificationType;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID notificationId;

    @Column(nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false)
    private boolean isRead = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Notification() {}
    public UUID getNotificationId() { return notificationId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID u) { this.userId = u; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType t) { this.type = t; }
    public String getMessage() { return message; }
    public void setMessage(String m) { this.message = m; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean r) { this.isRead = r; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
