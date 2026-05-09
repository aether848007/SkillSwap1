package com.skillswap.service;

import com.skillswap.model.Message;
import com.skillswap.repository.MessageRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class MessageService {
    private final MessageRepository msgRepo;
    private final UserRepository userRepo;

    public MessageService(MessageRepository m, UserRepository u) { this.msgRepo = m; this.userRepo = u; }

    public Message sendMessage(UUID senderId, UUID receiverId, String content) {
        UUID convId = generateConversationId(senderId, receiverId);
        Message msg = new Message();
        msg.setConversationId(convId);
        msg.setSender(userRepo.findById(senderId).orElseThrow());
        msg.setReceiver(userRepo.findById(receiverId).orElseThrow());
        msg.setContent(content);
        return msgRepo.save(msg);
    }

    public List<Message> getConversation(UUID convId) {
        return msgRepo.findByConversationIdOrderBySentAtAsc(convId);
    }

    public List<UUID> getUserConversations(UUID userId) {
        return msgRepo.findConversationIdsByUserId(userId);
    }

    private UUID generateConversationId(UUID u1, UUID u2) {
        String combined = u1.compareTo(u2) < 0 ? u1.toString() + u2.toString() : u2.toString() + u1.toString();
        return UUID.nameUUIDFromBytes(combined.getBytes());
    }
}
