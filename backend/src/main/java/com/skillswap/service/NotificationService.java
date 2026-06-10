package com.skillswap.service;

import com.skillswap.model.Notification;
import com.skillswap.model.User;
import com.skillswap.model.enums.NotificationType;
import com.skillswap.repository.NotificationRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRepository repo;
    private final SimpMessagingTemplate broker;
    private final UserRepository userRepo;
    private final EmailService emailService;

    // Event types worth an email. NEW_MESSAGE is intentionally excluded (too noisy).
    private static final Map<NotificationType, String> EMAIL_SUBJECTS = Map.of(
            NotificationType.MATCH_REQUEST,    "New exchange proposal on SkillSwap",
            NotificationType.MATCH_ACCEPTED,   "Your SkillSwap exchange was accepted",
            NotificationType.MATCH_DECLINED,   "Update on your SkillSwap proposal",
            NotificationType.SESSION_REQUEST,  "A SkillSwap session time was proposed",
            NotificationType.SESSION_ACCEPTED, "Your SkillSwap session was confirmed",
            NotificationType.SESSION_DECLINED, "Update on your SkillSwap session",
            NotificationType.NEW_RATING,       "You received a new SkillSwap rating");

    public NotificationService(NotificationRepository repo, SimpMessagingTemplate broker,
                               UserRepository userRepo, EmailService emailService) {
        this.repo = repo;
        this.broker = broker;
        this.userRepo = userRepo;
        this.emailService = emailService;
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
        maybeEmail(userId, type, message);
        return saved;
    }

    /** Send a transactional email for high-signal events. Async + fail-silent. */
    private void maybeEmail(UUID userId, NotificationType type, String message) {
        String subject = EMAIL_SUBJECTS.get(type);
        if (subject == null) return;
        try {
            User u = userRepo.findById(userId).orElse(null);
            if (u == null || u.getEmail() == null) return;
            String body = message + "\n\nOpen SkillSwap to respond.\n\n— The SkillSwap team";
            emailService.sendNotificationEmail(u.getEmail(), subject, body);
        } catch (Exception ignored) {}
    }

    /** Latest notifications, newest first. Capped so the list can't grow unbounded. */
    public List<Notification> getForUser(UUID userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, MAX_NOTIFICATIONS));
    }

    private static final int MAX_NOTIFICATIONS = 50;

    public long countUnread(UUID userId) {
        return repo.countByUserIdAndIsReadFalse(userId);
    }

    public void markRead(UUID notificationId) {
        repo.findById(notificationId).ifPresent(n -> { n.setRead(true); repo.save(n); });
    }

    public void markAllRead(UUID userId) {
        repo.markAllReadForUser(userId);
    }
}
