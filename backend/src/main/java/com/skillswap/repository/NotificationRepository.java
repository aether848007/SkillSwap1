package com.skillswap.repository;

import com.skillswap.model.Notification;
import com.skillswap.model.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserIdAndIsReadFalse(UUID userId);
    long countByUserIdAndTypeAndCreatedAtAfter(UUID userId, NotificationType type, LocalDateTime after);
}
