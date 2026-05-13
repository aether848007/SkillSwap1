package com.skillswap.service;

import com.skillswap.model.Notification;
import com.skillswap.model.enums.NotificationType;
import com.skillswap.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRepository repo;
    private final SimpMessagingTemplate broker;

    public NotificationService(NotificationRepository repo, SimpMessagingTemplate broker) {
        this.repo = repo;
        this.broker = broker;
    }

    public Notification create(UUID userId, NotificationType type, String message) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setMessage(message);
        Notification saved = repo.save(n);
        try {
            broker.convertAndSend("/topic/notifications/" + userId, saved);
        } catch (Exception ignored) {}
        return saved;
    }

    public List<Notification> getForUser(UUID userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countUnread(UUID userId) {
        return repo.countByUserIdAndIsReadFalse(userId);
    }

    public void markRead(UUID notificationId) {
        repo.findById(notificationId).ifPresent(n -> { n.setRead(true); repo.save(n); });
    }

    public void markAllRead(UUID userId) {
        repo.findByUserIdOrderByCreatedAtDesc(userId).forEach(n -> { n.setRead(true); repo.save(n); });
    }
}
