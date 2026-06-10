package com.skillswap.repository;

import com.skillswap.model.Skill;
import com.skillswap.model.enums.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface SkillRepository extends JpaRepository<Skill, UUID> {
    // VISIBLE = skill is offered & active, owner's profile is visible, and owner isn't banned.
    @Query("SELECT s FROM Skill s JOIN FETCH s.skillProfile sp JOIN FETCH sp.user u " +
           "WHERE s.isOffered = true AND s.isActive = true AND sp.isVisible = true AND u.disabled = false AND " +
           "(LOWER(s.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Skill> searchSkills(@Param("query") String query);

    @Query("SELECT s FROM Skill s JOIN FETCH s.skillProfile sp JOIN FETCH sp.user u " +
           "WHERE s.isOffered = true AND s.isActive = true AND sp.isVisible = true AND u.disabled = false " +
           "AND s.category = :category")
    List<Skill> findByActiveCategory(@Param("category") SkillCategory category);

    @Query("SELECT s FROM Skill s JOIN FETCH s.skillProfile sp JOIN FETCH sp.user u " +
           "WHERE s.isOffered = true AND s.isActive = true AND sp.isVisible = true AND u.disabled = false")
    List<Skill> findByIsOfferedTrueAndIsActiveTrue();
}
