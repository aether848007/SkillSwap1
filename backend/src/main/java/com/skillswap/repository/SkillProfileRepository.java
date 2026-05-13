package com.skillswap.repository;

import com.skillswap.model.SkillProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface SkillProfileRepository extends JpaRepository<SkillProfile, UUID> {
    @Query("SELECT sp FROM SkillProfile sp JOIN FETCH sp.user LEFT JOIN FETCH sp.skills WHERE sp.user.userId = :userId")
    Optional<SkillProfile> findByUserUserId(@Param("userId") UUID userId);

    @Query("SELECT sp FROM SkillProfile sp JOIN FETCH sp.user WHERE sp.user.userId != :userId")
    java.util.List<SkillProfile> findAllOtherUsersWithSkills(@Param("userId") UUID userId);
}
