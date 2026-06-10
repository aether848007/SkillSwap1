package com.skillswap.repository;

import com.skillswap.model.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

public interface BlockedUserRepository extends JpaRepository<BlockedUser, UUID> {

    boolean existsByBlocker_UserIdAndBlocked_UserId(UUID blockerId, UUID blockedId);

    List<BlockedUser> findByBlocker_UserId(UUID blockerId);

    @Transactional
    void deleteByBlocker_UserIdAndBlocked_UserId(UUID blockerId, UUID blockedId);

    /** True if either user has blocked the other — used to forbid contact in both directions. */
    @Query("SELECT COUNT(b) > 0 FROM BlockedUser b WHERE " +
           "(b.blocker.userId = :a AND b.blocked.userId = :b) OR " +
           "(b.blocker.userId = :b AND b.blocked.userId = :a)")
    boolean blockExistsBetween(@Param("a") UUID a, @Param("b") UUID b);

    /** Ids this user has blocked. */
    @Query("SELECT b.blocked.userId FROM BlockedUser b WHERE b.blocker.userId = :userId")
    List<UUID> findBlockedIds(@Param("userId") UUID userId);

    /** Ids that have blocked this user. */
    @Query("SELECT b.blocker.userId FROM BlockedUser b WHERE b.blocked.userId = :userId")
    List<UUID> findBlockerIds(@Param("userId") UUID userId);
}
