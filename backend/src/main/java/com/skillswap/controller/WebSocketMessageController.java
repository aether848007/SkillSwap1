package com.skillswap.controller;

import com.skillswap.model.Message;
import com.skillswap.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Controller
public class WebSocketMessageController {
    private final MessageService messageService;
    private final SimpMessagingTemplate broker;

    public WebSocketMessageController(MessageService ms, SimpMessagingTemplate broker) {
        this.messageService = ms;
        this.broker = broker;
    }

    @MessageMapping("/chat.send")
    public void send(Principal principal, Map<String, String> payload) {
        UUID senderId = UUID.fromString(principal.getName());
        UUID receiverId = UUID.fromString(payload.get("receiverId"));
        String content = payload.get("content");

        Message saved = messageService.sendMessage(senderId, receiverId, content);
        broker.convertAndSend(
                "/topic/conversation/" + saved.getConversationId(),
                saved);
    }
}
