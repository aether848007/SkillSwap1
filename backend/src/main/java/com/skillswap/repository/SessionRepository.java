package com.skillswap.repository;

import com.skillswap.model.Session;
import com.skillswap.model.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {
    @Query("SELECT DISTINCT s FROM Session s JOIN FETCH s.learner JOIN FETCH s.provider JOIN FETCH s.skill " +
           "WHERE s.learner.userId = :userId OR s.provider.userId = :userId " +
           "ORDER BY s.scheduledAt ASC NULLS LAST")
    List<Session> findByLearnerOrProviderWithFetch(@Param("userId") UUID userId);

    @Query("SELECT s FROM Session s JOIN FETCH s.learner JOIN FETCH s.provider JOIN FETCH s.skill " +
           "WHERE s.sessionId = :id")
    Optional<Session> findByIdWithFetch(@Param("id") UUID id);

    List<Session> findByProviderUserIdAndStatus(UUID providerId, SessionStatus status);

    @Query("SELECT s FROM Session s JOIN FETCH s.learner JOIN FETCH s.provider JOIN FETCH s.skill " +
           "WHERE s.exchange.exchangeId = :exchangeId ORDER BY s.createdAt ASC")
    List<Session> findByExchangeId(@Param("exchangeId") UUID exchangeId);
}
