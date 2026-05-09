package com.skillswap.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "messages")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID messageId;

    @Column(nullable = false)
    private UUID conversationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime sentAt;

    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() { sentAt = LocalDateTime.now(); }

    public Message() {}
    public UUID getMessageId() { return messageId; }
    public UUID getConversationId() { return conversationId; }
    public void setConversationId(UUID c) { this.conversationId = c; }
    public User getSender() { return sender; }
    public void setSender(User s) { this.sender = s; }
    public User getReceiver() { return receiver; }
    public void setReceiver(User r) { this.receiver = r; }
    public String getContent() { return content; }
    public void setContent(String c) { this.content = c; }
    public LocalDateTime getSentAt() { return sentAt; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime d) { this.deliveredAt = d; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime r) { this.readAt = r; }
}
