package com.skillswap.controller;

import com.skillswap.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notifService;

    public NotificationController(NotificationService ns) { this.notifService = ns; }

    @GetMapping
    public ResponseEntity<?> getNotifications(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(notifService.getForUser(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("count", notifService.countUnread(userId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable UUID id) {
        notifService.markRead(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        notifService.markAllRead(userId);
        return ResponseEntity.ok().build();
    }
}
