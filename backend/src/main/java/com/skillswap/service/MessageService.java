package com.skillswap.service;

import com.skillswap.model.Message;
import com.skillswap.model.User;
import com.skillswap.model.enums.NotificationType;
import com.skillswap.repository.MessageRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class MessageService {
    private final MessageRepository msgRepo;
    private final UserRepository userRepo;
    private final NotificationService notifService;
    private final BlockService blockService;

    public MessageService(MessageRepository m, UserRepository u, NotificationService n, BlockService b) {
        this.msgRepo = m; this.userRepo = u; this.notifService = n; this.blockService = b;
    }

    public Message sendMessage(UUID senderId, UUID receiverId, String content) {
        if (blockService.isBlockedBetween(senderId, receiverId)) {
            throw new AccessDeniedException("You can't message this user");
        }
        UUID convId = generateConversationId(senderId, receiverId);
        User sender = userRepo.findById(senderId).orElseThrow();
        User receiver = userRepo.findById(receiverId).orElseThrow();
        Message msg = new Message();
        msg.setConversationId(convId);
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setContent(content);
        Message saved = msgRepo.save(msg);

        String preview = content.length() > 60 ? content.substring(0, 60) + "…" : content;
        notifService.create(receiverId, NotificationType.NEW_MESSAGE,
                sender.getDisplayName() + " sent you a message: \"" + preview + "\"");

        return saved;
    }

    /** Latest messages in a conversation, chronological order. Caller must be a participant. */
    public List<Message> getConversation(UUID convId, UUID requesterId) {
        if (!msgRepo.isParticipant(convId, requesterId)) {
            throw new AccessDeniedException("You are not a participant in this conversation");
        }
        List<Message> latest = msgRepo.findByConversationIdOrderBySentAtDesc(convId, PageRequest.of(0, MAX_CONVERSATION_MESSAGES));
        Collections.reverse(latest);
        return latest;
    }

    private static final int MAX_CONVERSATION_MESSAGES = 200;

    public List<UUID> getUserConversations(UUID userId) {
        return msgRepo.findConversationIdsByUserId(userId);
    }

    public void markConversationRead(UUID convId, UUID userId) {
        msgRepo.markConversationRead(convId, userId, java.time.LocalDateTime.now());
    }

    private UUID generateConversationId(UUID u1, UUID u2) {
        String combined = u1.compareTo(u2) < 0 ? u1.toString() + u2.toString() : u2.toString() + u1.toString();
        return UUID.nameUUIDFromBytes(combined.getBytes());
    }
}
