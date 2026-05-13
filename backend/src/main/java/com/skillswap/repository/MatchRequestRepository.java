package com.skillswap.repository;

import com.skillswap.model.MatchRequest;
import com.skillswap.model.enums.MatchRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MatchRequestRepository extends JpaRepository<MatchRequest, UUID> {

    @Query("SELECT mr FROM MatchRequest mr JOIN FETCH mr.fromUser JOIN FETCH mr.toUser " +
           "WHERE mr.fromUser.userId = :userId OR mr.toUser.userId = :userId " +
           "ORDER BY mr.createdAt DESC")
    List<MatchRequest> findAllForUser(@Param("userId") UUID userId);

    boolean existsByFromUserUserIdAndToUserUserIdAndStatus(UUID fromUserId, UUID toUserId, MatchRequestStatus status);
}
