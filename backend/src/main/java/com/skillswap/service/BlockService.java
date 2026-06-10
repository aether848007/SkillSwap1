package com.skillswap.service;

import com.skillswap.model.BlockedUser;
import com.skillswap.model.User;
import com.skillswap.repository.BlockedUserRepository;
import com.skillswap.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class BlockService {
    private final BlockedUserRepository blockRepo;
    private final UserRepository userRepo;

    public BlockService(BlockedUserRepository blockRepo, UserRepository userRepo) {
        this.blockRepo = blockRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public void block(UUID blockerId, UUID blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new IllegalArgumentException("You cannot block yourself");
        }
        if (blockRepo.existsByBlocker_UserIdAndBlocked_UserId(blockerId, blockedId)) {
            return; // idempotent
        }
        User blocker = userRepo.findById(blockerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User blocked = userRepo.findById(blockedId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        blockRepo.save(new BlockedUser(blocker, blocked));
    }

    @Transactional
    public void unblock(UUID blockerId, UUID blockedId) {
        blockRepo.deleteByBlocker_UserIdAndBlocked_UserId(blockerId, blockedId);
    }

    @Transactional(readOnly = true)
    public List<UUID> blockedIds(UUID userId) {
        return blockRepo.findBlockedIds(userId);
    }

    /** Either direction — used to forbid proposals and messaging. */
    @Transactional(readOnly = true)
    public boolean isBlockedBetween(UUID a, UUID b) {
        return blockRepo.blockExistsBetween(a, b);
    }

    /** Everyone to hide from this user in search/matches (they blocked, or were blocked by). */
    @Transactional(readOnly = true)
    public Set<UUID> hiddenFrom(UUID userId) {
        Set<UUID> ids = new HashSet<>(blockRepo.findBlockedIds(userId));
        ids.addAll(blockRepo.findBlockerIds(userId));
        return ids;
    }
}
