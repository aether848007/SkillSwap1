package com.skillswap.controller;

import com.skillswap.dto.MessageRequest;
import com.skillswap.model.Message;
import com.skillswap.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    private final MessageService msgService;

    public MessageController(MessageService m) { this.msgService = m; }

    @PostMapping
    public ResponseEntity<Message> send(Authentication auth, @RequestBody MessageRequest req) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(msgService.sendMessage(userId, req.getReceiverId(), req.getContent()));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<UUID>> getConversations(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(msgService.getUserConversations(userId));
    }

    @GetMapping("/conversation/{convId}")
    public ResponseEntity<List<Message>> getConversation(Authentication auth, @PathVariable UUID convId) {
        UUID userId = (UUID) auth.getPrincipal();
        return ResponseEntity.ok(msgService.getConversation(convId, userId));
    }

    @PatchMapping("/conversation/{convId}/read")
    public ResponseEntity<?> markRead(Authentication auth, @PathVariable UUID convId) {
        UUID userId = (UUID) auth.getPrincipal();
        msgService.markConversationRead(convId, userId);
        return ResponseEntity.ok().build();
    }
}
