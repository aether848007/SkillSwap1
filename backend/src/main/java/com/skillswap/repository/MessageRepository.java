package com.skillswap.repository;

import com.skillswap.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByConversationIdOrderBySentAtAsc(UUID conversationId);

    @Query("SELECT DISTINCT m.conversationId FROM Message m WHERE m.sender.userId = :userId OR m.receiver.userId = :userId")
    List<UUID> findConversationIdsByUserId(@Param("userId") UUID userId);
}
