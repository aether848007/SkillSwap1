package com.skillswap.repository;

import com.skillswap.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByConversationIdOrderBySentAtAsc(UUID conversationId);

    /** Bounded fetch — newest first; the service reverses to chronological order for display. */
    List<Message> findByConversationIdOrderBySentAtDesc(UUID conversationId, org.springframework.data.domain.Pageable pageable);

    /** True if the user is a participant (sender or receiver) of the conversation. */
    @Query("SELECT COUNT(m) > 0 FROM Message m WHERE m.conversationId = :convId " +
           "AND (m.sender.userId = :userId OR m.receiver.userId = :userId)")
    boolean isParticipant(@Param("convId") UUID convId, @Param("userId") UUID userId);

    @Query("SELECT DISTINCT m.conversationId FROM Message m WHERE m.sender.userId = :userId OR m.receiver.userId = :userId")
    List<UUID> findConversationIdsByUserId(@Param("userId") UUID userId);

    @Query("SELECT m.sentAt FROM Message m WHERE (m.sender.userId = :userId OR m.receiver.userId = :userId) AND m.sentAt >= :since")
    List<java.time.LocalDateTime> findActivityTimestamps(@Param("userId") UUID userId, @Param("since") java.time.LocalDateTime since);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE Message m SET m.readAt = :now WHERE m.conversationId = :convId AND m.receiver.userId = :userId AND m.readAt IS NULL")
    void markConversationRead(@Param("convId") UUID convId, @Param("userId") UUID userId, @Param("now") java.time.LocalDateTime now);
}
