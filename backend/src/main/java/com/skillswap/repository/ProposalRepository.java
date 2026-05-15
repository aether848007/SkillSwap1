package com.skillswap.repository;

import com.skillswap.model.Proposal;
import com.skillswap.model.enums.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProposalRepository extends JpaRepository<Proposal, UUID> {

    @Query("SELECT p FROM Proposal p " +
           "JOIN FETCH p.fromUser JOIN FETCH p.toUser " +
           "JOIN FETCH p.offeredSkill JOIN FETCH p.requestedSkill " +
           "WHERE p.fromUser.userId = :userId OR p.toUser.userId = :userId " +
           "ORDER BY p.createdAt DESC")
    List<Proposal> findAllForUser(@Param("userId") UUID userId);

    boolean existsByFromUserUserIdAndToUserUserIdAndOfferedSkillSkillIdAndRequestedSkillSkillIdAndStatus(
            UUID fromUserId, UUID toUserId, UUID offeredSkillId, UUID requestedSkillId, ProposalStatus status);
}
