package com.skillswap.repository;

import com.skillswap.model.Session;
import com.skillswap.model.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {
    @Query("SELECT s FROM Session s JOIN FETCH s.learner JOIN FETCH s.provider JOIN FETCH s.skill " +
           "WHERE s.learner.userId = :learnerId OR s.provider.userId = :providerId " +
           "ORDER BY s.scheduledAt DESC")
    List<Session> findByLearnerUserIdOrProviderUserIdOrderByScheduledAtDesc(
            @Param("learnerId") UUID learnerId, @Param("providerId") UUID providerId);

    List<Session> findByProviderUserIdAndStatus(UUID providerId, SessionStatus status);
}
