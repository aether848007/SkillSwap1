package com.skillswap.repository;

import com.skillswap.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface RatingRepository extends JpaRepository<Rating, UUID> {
    List<Rating> findByRateeUserIdOrderByCreatedAtDesc(UUID rateeId);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.ratee.userId = :userId")
    Double getAverageRatingForUser(@Param("userId") UUID userId);
}
